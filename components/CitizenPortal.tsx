import React, { useState } from 'react';
import { CivicIssue, IssueCategory, IssueStatus, Location } from '../types';
import { CATEGORY_OPTIONS } from '../constants';
import { api } from '../services/api';
import { analyzeIssuePriority } from '../services/gemini';
import MapView from './MapView';

interface CitizenPortalProps {
  user: { id: string, name: string, email: string };
  issues: CivicIssue[];
  onIssueSubmitted: () => void;
}

const CitizenPortal: React.FC<CitizenPortalProps> = ({ user, issues, onIssueSubmitted }) => {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null);

  const [feedbackIssueId, setFeedbackIssueId] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    category: IssueCategory.DRAINAGE,
    description: '',
    address: '',
    image: '',
    location: { lat: 12.9716, lng: 77.5946 } as Location
  });

  const handleEdit = (issue: CivicIssue) => {
    setEditingIssueId(issue.id);
    setFormData({
      name: issue.citizenName,
      category: issue.category,
      description: issue.description,
      address: issue.location.address || '',
      image: issue.image || '',
      location: issue.location
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this complaint?")) {
      try {
        await api.deleteIssue(id);
        onIssueSubmitted();
        setShowForm(false);
      } catch (err) {
        console.error(err);
        alert('Failed to delete issue');
      }
    }
  };

  const handleRefile = async (id: string) => {
    if (window.confirm("Do you want to refile this issue? It will be sent back to the admin for review.")) {
      try {
        await api.updateIssue(id, { status: IssueStatus.PENDING, dismissalReason: '' });
        onIssueSubmitted();
      } catch (err) {
        console.error(err);
        alert('Failed to refile issue');
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data && data.display_name) {
        setFormData(prev => ({ ...prev, address: data.display_name, location: { lat, lng } }));
      }
    } catch (err) {
      console.log('Reverse geocoding failed', err);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackIssueId || feedbackRating === 0 || !feedbackComment.trim()) return;

    try {
      await api.updateIssue(feedbackIssueId, {
        feedback: { rating: feedbackRating, comment: feedbackComment, timestamp: new Date().toISOString() }
      });
      onIssueSubmitted();
      setFeedbackIssueId(null);
      setFeedbackRating(0);
      setFeedbackComment('');
    } catch (err) {
      console.error(err);
      alert('Failed to submit feedback');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const analysis = await analyzeIssuePriority(
      formData.category,
      formData.description,
      formData.location,
      !!formData.image
    );

    try {
      if (editingIssueId) {
        await api.updateIssue(editingIssueId, {
          category: formData.category,
          description: formData.description,
          image: formData.image,
          location: { ...formData.location, address: formData.address, isSensitive: analysis.detectedSensitiveLocation } as any
        } as any);
      } else {
        await api.createIssue({
          citizenId: user.id,
          category: formData.category,
          description: formData.description,
          image: formData.image,
          location: { ...formData.location, address: formData.address, isSensitive: analysis.detectedSensitiveLocation } as any,
          status: IssueStatus.PENDING,
          priorityScore: analysis.score,
          priorityReasoning: analysis.reasoning
        } as any);
      }
      onIssueSubmitted();
      setShowForm(false);
      setEditingIssueId(null);
    } catch (err) {
      console.error(err);
      alert('Failed to save issue');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Your Community Pulse</h2>
          <p className="text-slate-500 font-medium mt-1">Track and report issues in your neighborhood.</p>
        </div>
        <button
          onClick={() => {
            setEditingIssueId(null);
            setFormData({
              name: '',
              category: IssueCategory.DRAINAGE,
              description: '',
              address: '',
              image: '',
              location: { lat: 12.9716, lng: 77.5946 }
            });
            setShowForm(true);

            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const lat = pos.coords.latitude;
                  const lng = pos.coords.longitude;
                  setFormData(prev => ({
                    ...prev,
                    location: { ...prev.location, lat, lng }
                  }));
                  fetchAddress(lat, lng);
                },
                (err) => console.log('Geolocation disabled or denied', err),
                { enableHighAccuracy: true }
              );
            }
          }}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl flex items-center gap-3 shadow-xl shadow-blue-600/20 transition-all transform hover:-translate-y-1"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          Report New Issue
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl p-10 relative overflow-hidden">

            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-premium"></div>

            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                  {editingIssueId ? "Edit Civic Report" : "New Civic Report"}
                </h3>
                <p className="text-slate-500 font-medium">Please provide accurate details below.</p>
              </div>
              <button onClick={() => setShowForm(false)} className="w-10 h-10 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-full flex items-center justify-center transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-10">

              {/* LEFT SIDE */}
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Reporter Info</label>
                  <input
                    readOnly
                    value={formData.name || user.name}
                    className="w-full border-2 border-slate-100 p-4 rounded-2xl bg-slate-50 text-slate-500 font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        category: e.target.value as IssueCategory
                      }))
                    }
                    className="w-full border-2 border-slate-200 p-4 rounded-2xl font-bold text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                  >
                    {CATEGORY_OPTIONS.map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Image Evidence</label>

                  {formData.image ? (
                    <div className="relative inline-block border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm group">
                      <img src={formData.image} className="w-32 h-32 object-cover" alt="Evidence" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm cursor-pointer hover:bg-black/70">
                        <label className="cursor-pointer text-white text-[10px] font-black uppercase tracking-widest p-2 text-center w-full h-full flex items-center justify-center">
                          <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-md border border-white/30">Change</span>
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className="w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:bg-slate-50 hover:border-blue-400 transition-all text-slate-500 font-bold group">
                      <svg className="w-8 h-8 text-slate-400 group-hover:text-blue-500 mb-2 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span>Click to Upload Photo</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  )}
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Description</label>
                  <textarea
                    required
                    placeholder="Describe the issue in detail..."
                    rows={4}
                    value={formData.description}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, description: e.target.value }))
                    }
                    className="w-full border-2 border-slate-200 p-4 rounded-2xl font-medium text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none resize-none"
                  />
                </div>
              </div>

              {/* RIGHT SIDE - MAP */}
              <div className="space-y-6">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Pin Exact Location</label>

                <div className="rounded-2xl overflow-hidden shadow-sm border-2 border-slate-200">
                  <MapView
                    location={formData.location}
                    onLocationSelect={loc => {
                      setFormData(prev => ({ ...prev, location: loc }));
                      fetchAddress(loc.lat, loc.lng);
                    }}
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Street Address</label>
                  <input
                    required
                    placeholder="Descriptive Address / Nearby Landmark"
                    value={formData.address}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        address: e.target.value
                      }))
                    }
                    className="w-full border-2 border-slate-200 p-4 rounded-2xl font-medium text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                  />
                </div>

                <div className="flex gap-4 pt-4 mt-8 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-black text-lg rounded-2xl shadow-xl shadow-blue-500/30 transform hover:-translate-y-1 transition-all"
                  >
                    {submitting ? 'Processing AI...' : (editingIssueId ? 'Update Report' : 'Submit Formal Report')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
            {editingIssueId && (
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => handleEdit(issues.find(i => i.id === editingIssueId)!)}
                  className="bg-yellow-400 text-black px-4 py-2 rounded-lg"
                >
                  Edit Again
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(editingIssueId)}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {issues.map(issue => (
          <div key={issue.id} className="bg-white border-2 border-slate-100 p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 flex flex-col group">
            <div className="flex justify-between items-start mb-4">
              <span className="px-3 py-1 bg-slate-100 text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-lg">
                {issue.category}
              </span>
              <StatusBadge status={issue.status} />
            </div>

            <h3 className="font-black text-slate-900 text-lg mb-2 truncate group-hover:text-blue-600 transition-colors">{issue.location.address}</h3>
            <p className="text-sm text-slate-500 font-medium line-clamp-2 mb-4 flex-grow">{issue.description}</p>

            {issue.image && (
              <div className="mb-4 rounded-2xl overflow-hidden border border-slate-100">
                <img src={issue.image} className="w-full h-40 object-cover hover:scale-105 transition-transform duration-500" />
              </div>
            )}

            {issue.status === IssueStatus.PENDING && (
              <div className="flex gap-2 mt-auto pt-4 border-t border-slate-100">
                <button
                  onClick={() => handleEdit(issue)}
                  className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold py-2 rounded-xl transition-colors text-sm"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(issue.id)}
                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 rounded-xl transition-colors text-sm"
                >
                  Delete
                </button>
              </div>
            )}

            {issue.status === IssueStatus.RESOLVED && !issue.feedback && (
              <div className="mt-auto pt-4 border-t border-slate-100">
                <button
                  onClick={() => setFeedbackIssueId(issue.id)}
                  className="w-full bg-gradient-to-r from-amber-400 to-amber-500 text-white font-black py-3 rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transform hover:-translate-y-0.5 transition-all text-sm"
                >
                  Rate Resolution
                </button>
              </div>
            )}

            {issue.feedback && (
              <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100/50">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Your Rating</h4>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <div key={s} className={`w-2 h-2 rounded-full ${issue.feedback!.rating >= s ? 'bg-amber-400' : 'bg-amber-100'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-slate-700 font-bold italic text-sm line-clamp-1">"{issue.feedback.comment}"</p>
              </div>
            )}

            {issue.status === IssueStatus.DISMISSED && issue.dismissalReason && (
              <div className="mt-4 p-5 bg-red-50 rounded-2xl border border-red-100">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-black text-red-700 text-xs uppercase tracking-widest flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                    Rejection Reason
                  </h4>
                  <button
                    onClick={() => handleRefile(issue.id)}
                    className="bg-white border-2 border-red-200 text-red-600 font-bold px-4 py-2 rounded-xl hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm text-xs"
                  >
                    Refile Request
                  </button>
                </div>
                <div className="text-sm font-bold text-slate-700 bg-white p-4 rounded-xl border border-red-100 shadow-sm">
                  {issue.dismissalReason}
                </div>
              </div>
            )}

            {issue.adminNotes && (
              <div className="mt-4 p-5 bg-blue-50 rounded-2xl border border-blue-100">
                <h4 className="font-black text-blue-700 text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                  Progress Updates
                </h4>
                <div className="space-y-2">
                  {issue.adminNotes.split('\n').filter(Boolean).map((note, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm text-sm text-slate-700 font-medium">
                      {note}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {issues.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            No issues reported yet
          </div>
        )}
      </div>

      {feedbackIssueId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-8 bg-amber-50 border-b border-amber-100 text-center">
              <h3 className="text-2xl font-black text-amber-900 mb-2">Rate Our Work</h3>
              <p className="text-amber-700 font-medium text-sm">How satisfied are you with the resolution of this issue?</p>
            </div>
            <form onSubmit={handleFeedbackSubmit} className="p-8">
              <div className="flex justify-center gap-4 mb-8">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFeedbackRating(star)}
                    className={`w-12 h-12 rounded-full transition-all flex items-center justify-center transform hover:scale-110 ${feedbackRating >= star ? 'bg-amber-400 text-white shadow-lg shadow-amber-200' : 'bg-slate-100 text-slate-300'}`}
                  >
                    ★
                  </button>
                ))}
              </div>

              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Comments (Required)</label>
              <textarea
                required
                rows={4}
                value={feedbackComment}
                onChange={e => setFeedbackComment(e.target.value)}
                placeholder="Tell us what went well or what could be improved..."
                className="w-full p-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500 mb-8 resize-none text-slate-700"
              />

              <div className="flex gap-4">
                <button type="button" onClick={() => setFeedbackIssueId(null)} className="flex-1 py-4 font-bold text-slate-500 bg-slate-50 rounded-2xl hover:bg-slate-100">Cancel</button>
                <button type="submit" disabled={!feedbackRating || !feedbackComment.trim()} className="flex-1 py-4 font-black text-white bg-amber-500 rounded-2xl shadow-xl shadow-amber-200 hover:bg-amber-600 disabled:opacity-50 transition-all">Submit Feedback</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

const StatusBadge = ({ status }: { status: IssueStatus }) => {
  const styles = {
    [IssueStatus.PENDING]: 'bg-amber-400 text-white',
    [IssueStatus.INVESTIGATING]: 'bg-blue-400 text-white',
    [IssueStatus.IN_PROGRESS]: 'bg-indigo-400 text-white',
    [IssueStatus.RESOLVED]: 'bg-emerald-500 text-white',
    [IssueStatus.CLOSED]: 'bg-slate-500 text-white',
    [IssueStatus.DISMISSED]: 'bg-red-500 text-white'
  };

  return (
    <span className={`px-2 py-1 rounded text-xs ${styles[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

export default CitizenPortal;
