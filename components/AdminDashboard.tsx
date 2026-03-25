import React, { useState } from 'react';
import { CivicIssue, IssueStatus } from '../types';
import { api } from '../services/api';
import { DEPARTMENT_MAP } from '../constants';
import MapView from './MapView';

interface AdminDashboardProps {
  issues: CivicIssue[];
  onIssueUpdated: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ issues, onIssueUpdated }) => {
  const [selectedIssue, setSelectedIssue] = useState<CivicIssue | null>(null);
  const [showDismissModal, setShowDismissModal] = useState(false);
  const [dismissReason, setDismissReason] = useState('');
  const [newProgressNote, setNewProgressNote] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  const filteredIssues = issues.filter(issue => {
    const isArchived = issue.status === IssueStatus.RESOLVED || issue.status === IssueStatus.CLOSED || issue.status === IssueStatus.DISMISSED;
    return activeTab === 'archived' ? isArchived : !isArchived;
  });

  const sortedIssues = [...filteredIssues].sort((a, b) => b.priorityScore - a.priorityScore);

  const handleStatusUpdate = async (id: string, newStatus: IssueStatus) => {
    try {
      await api.updateIssue(id, { status: newStatus });
      onIssueUpdated();
      if (selectedIssue?.id === id) {
        setSelectedIssue({ ...selectedIssue, status: newStatus });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  const handleAssignTeam = async () => {
    if (!selectedIssue) return;
    const department = DEPARTMENT_MAP[selectedIssue.category] || 'General Maintenance';
    try {
      await api.updateIssue(selectedIssue.id, {
        status: IssueStatus.IN_PROGRESS,
        assignedDepartment: department
      });
      onIssueUpdated();
      setSelectedIssue({ ...selectedIssue, status: IssueStatus.IN_PROGRESS, assignedDepartment: department });
    } catch (err) {
      console.error(err);
      alert('Failed to assign team');
    }
  };

  const getPriorityColor = (score: number) => {
    if (score >= 80) return 'rgb(239, 68, 68)'; // Red
    if (score >= 50) return 'rgb(245, 158, 11)'; // Amber
    return 'rgb(16, 185, 129)'; // Emerald
  };

  const handleDismissReport = async () => {
    if (!selectedIssue || !dismissReason.trim()) return;
    try {
      await api.updateIssue(selectedIssue.id, {
        status: IssueStatus.DISMISSED,
        dismissalReason: dismissReason
      });
      onIssueUpdated();
      setSelectedIssue({ ...selectedIssue, status: IssueStatus.DISMISSED, dismissalReason: dismissReason });
      setShowDismissModal(false);
      setDismissReason('');
    } catch (err) {
      console.error(err);
      alert('Failed to dismiss request');
    }
  };

  const handleAddProgressNote = async () => {
    if (!selectedIssue || !newProgressNote.trim()) return;
    const existingNotes = selectedIssue.adminNotes ? selectedIssue.adminNotes + '\n' : '';
    const updatedNotes = existingNotes + `[${new Date().toLocaleDateString()}] ${newProgressNote}`;
    try {
      await api.updateIssue(selectedIssue.id, { adminNotes: updatedNotes });
      onIssueUpdated();
      setSelectedIssue({ ...selectedIssue, adminNotes: updatedNotes });
      setNewProgressNote('');
    } catch (err) {
      console.error(err);
      alert('Failed to add progress note');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      <div className="lg:col-span-12 flex justify-between items-center mb-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Command Center</h2>
          <p className="text-slate-500 font-medium">Monitoring {issues.length} active civic reports across the region.</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
          <button onClick={() => setViewMode('list')} className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400'}`}>List View</button>
          <button onClick={() => setViewMode('map')} className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${viewMode === 'map' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400'}`}>Map Pulse</button>
        </div>
      </div>

      {viewMode === 'map' ? (
        <div className="lg:col-span-12 h-[600px] rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-2xl relative">
          <MapView
            readOnly
            markers={issues.map(i => ({
              loc: i.location,
              color: getPriorityColor(i.priorityScore),
              label: `Priority ${i.priorityScore}: ${i.category}`
            }))}
          />
          <div className="absolute bottom-8 left-8 bg-white/90 backdrop-blur-md p-6 rounded-[2rem] shadow-2xl z-[1000] border border-white max-w-xs">
            <h4 className="font-black text-slate-900 mb-2">Priority Legend</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-red-500" /> <span className="text-xs font-bold text-slate-600">Critical (&gt;80)</span></div>
              <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-amber-500" /> <span className="text-xs font-bold text-slate-600">High (50-79)</span></div>
              <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-emerald-500" /> <span className="text-xs font-bold text-slate-600">Normal (&lt;50)</span></div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="lg:col-span-4 space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 custom-scrollbar">
            <div className="flex bg-slate-100 p-1 mb-4 rounded-xl">
              <button
                onClick={() => { setActiveTab('active'); setSelectedIssue(null); }}
                className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'active' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}
              >
                Action Required
              </button>
              <button
                onClick={() => { setActiveTab('archived'); setSelectedIssue(null); }}
                className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'archived' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}
              >
                Resolved
              </button>
            </div>

            {sortedIssues.map(issue => (
              <div
                key={issue.id}
                onClick={() => setSelectedIssue(issue)}
                className={`p-6 rounded-[1.8rem] cursor-pointer transition-all border-2 ${selectedIssue?.id === issue.id ? 'border-blue-500 bg-blue-50/50 shadow-xl' : 'border-white bg-white shadow-sm hover:border-slate-100'}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Score</span>
                    <span className="text-xl font-black" style={{ color: getPriorityColor(issue.priorityScore) }}>{issue.priorityScore}%</span>
                  </div>
                  <StatusDot status={issue.status} />
                </div>
                <h3 className="font-bold text-slate-900 truncate mb-1">{issue.location.address}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">{issue.description}</p>
                <div className="flex justify-between items-center">
                  <span className="px-3 py-1 bg-white text-slate-600 text-[10px] font-black rounded-lg border border-slate-100 uppercase tracking-widest">
                    {issue.category}
                  </span>
                  <span className="text-[10px] font-bold text-slate-300 italic">{new Date(issue.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            {sortedIssues.length === 0 && (
              <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest">No cases found in this view</div>
            )}
          </div>

          <div className="lg:col-span-8">
            {selectedIssue ? (
              <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden sticky top-24">
                <div className="h-64 bg-slate-900 relative">
                  {selectedIssue.image ? (
                    <img src={selectedIssue.image} className="w-full h-full object-cover opacity-80" alt="Issue Evidence" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-700 bg-slate-100 font-black">NO IMAGE FILED</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                  <div className="absolute bottom-8 left-8">
                    <h2 className="text-3xl font-black text-white">{selectedIssue.category} Complaint</h2>
                    <p className="text-blue-400 font-bold tracking-widest uppercase text-xs">#{selectedIssue.id} • {selectedIssue.location.address}</p>
                  </div>
                </div>

                <div className="p-10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                    <div className="col-span-2">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Description</h4>
                      <p className="text-lg text-slate-600 leading-relaxed font-medium">{selectedIssue.description}</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Priority Reason</h4>
                      <p className="text-sm text-slate-500 italic">"{selectedIssue.priorityReasoning}"</p>
                    </div>
                  </div>

                  {selectedIssue.feedback && (
                    <div className="mb-10 p-8 bg-amber-50 rounded-[2rem] border border-amber-100">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest">Citizen Review</h4>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(s => (
                            <div
                              key={s}
                              className={`w-3 h-3 rounded-full ${(selectedIssue.feedback?.rating || 0) >= s ? 'bg-amber-400' : 'bg-amber-100'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-700 font-bold italic">"{selectedIssue.feedback.comment}"</p>
                    </div>
                  )}

                  <div className="mb-10 p-8 bg-blue-50 rounded-[2rem] border border-blue-100">
                    <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4">Work Progress Log</h4>
                    <div className="space-y-3 mb-6">
                      {selectedIssue.adminNotes ? selectedIssue.adminNotes.split('\n').filter(Boolean).map((note, idx) => (
                        <div key={idx} className="p-4 bg-white rounded-xl shadow-sm text-sm text-slate-700 font-medium">
                          {note}
                        </div>
                      )) : <p className="text-sm text-slate-400 italic">No progress notes added yet.</p>}
                    </div>

                    {selectedIssue.status !== IssueStatus.RESOLVED && selectedIssue.status !== IssueStatus.DISMISSED && (
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={newProgressNote}
                          onChange={(e) => setNewProgressNote(e.target.value)}
                          placeholder="Add new step/update..."
                          className="flex-1 p-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500"
                        />
                        <button onClick={handleAddProgressNote} disabled={!newProgressNote.trim()} className="px-6 bg-blue-600 text-white font-bold rounded-xl shadow hover:bg-blue-700 transition-all">Add Step</button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-6 pt-10 border-t border-slate-100 text-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" /></svg>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reported By</p>
                        <p className="font-bold text-slate-900">{selectedIssue.citizenName}</p>
                      </div>
                    </div>

                    <div className="sm:ml-auto flex items-center gap-4">
                      {selectedIssue.status !== IssueStatus.RESOLVED && selectedIssue.status !== IssueStatus.DISMISSED && (
                        <>
                          <button onClick={() => setShowDismissModal(true)} className="px-6 py-3 text-red-600 font-bold hover:bg-red-50 rounded-2xl transition-all">Dismiss Case</button>
                          <button onClick={() => handleStatusUpdate(selectedIssue.id, IssueStatus.RESOLVED)} className="px-8 py-3 bg-emerald-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-600 transition-all">Mark as Resolved</button>
                        </>
                      )}
                      {!selectedIssue.assignedDepartment && selectedIssue.status !== IssueStatus.RESOLVED && selectedIssue.status !== IssueStatus.DISMISSED && (
                        <button onClick={handleAssignTeam} className="px-8 py-3 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all text-sm md:text-base">Assign Department</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[500px] flex items-center justify-center bg-white border-2 border-dashed border-slate-200 rounded-[3rem] text-slate-300 font-black tracking-widest">
                SELECT A CASE FROM THE QUEUE
              </div>
            )}
          </div>
        </>
      )}

      {showDismissModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-8 bg-slate-50 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">Dismiss Case</h3>
              <p className="text-sm text-slate-500">Provide a reason for the citizen.</p>
            </div>
            <div className="p-8">
              <textarea
                autoFocus
                value={dismissReason}
                onChange={(e) => setDismissReason(e.target.value)}
                rows={4}
                placeholder="Why is this case being dismissed?"
                className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none resize-none text-slate-900"
              />
            </div>
            <div className="p-8 pt-0 flex justify-end gap-3">
              <button onClick={() => setShowDismissModal(false)} className="px-6 py-2 font-bold text-slate-500">Cancel</button>
              <button onClick={handleDismissReport} disabled={!dismissReason.trim()} className="px-8 py-3 bg-red-600 text-white font-black rounded-2xl">Confirm Dismissal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatusDot = ({ status }: { status: IssueStatus }) => {
  const colors = {
    [IssueStatus.PENDING]: 'bg-amber-400',
    [IssueStatus.INVESTIGATING]: 'bg-blue-400',
    [IssueStatus.IN_PROGRESS]: 'bg-indigo-400',
    [IssueStatus.RESOLVED]: 'bg-emerald-500',
    [IssueStatus.CLOSED]: 'bg-slate-400',
    [IssueStatus.DISMISSED]: 'bg-red-500',
  };
  return <div className={`w-3 h-3 rounded-full ${colors[status]} shadow-lg`} />;
};

export default AdminDashboard;
