import React, { useState, useEffect } from 'react';
import { UserRole, CivicIssue } from './types';
import CitizenPortal from './components/CitizenPortal';
import AdminDashboard from './components/AdminDashboard';
import { api } from './services/api';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [user, setUser] = useState<{ id: string, name: string, email: string } | null>(null);
  const [issues, setIssues] = useState<CivicIssue[]>([]);

  const [loginMode, setLoginMode] = useState<UserRole | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const fetchIssues = async () => {
    if (!role) return;
    try {
      const data = await api.getIssues(role, user?.id);
      setIssues(data as any);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (role) {
      fetchIssues();
    }
  }, [role, user]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      let dbUser;
      if (isSignUp) {
        dbUser = await api.signup(name, email, loginMode!);
      } else {
        dbUser = await api.login(email, loginMode!);
      }
      setUser(dbUser);
      setRole(loginMode);
      setLoginMode(null);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    }
  };

  const handleLogout = () => {
    setRole(null);
    setUser(null);
    setName('');
    setEmail('');
  };

  // Centered Dashboard Selector Design - Ultra Modern, Dark Mode Inspired
  if (!role && !loginMode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 px-4 relative overflow-hidden font-sans">
        {/* Awesome deep background gradients - central focus */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50rem] h-[50rem] bg-indigo-500 rounded-full mix-blend-screen filter blur-[150px] opacity-20 animate-pulse-glow" />
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-teal-400 rounded-full mix-blend-screen filter blur-[150px] opacity-20 animate-float" />
        <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-blue-600 rounded-full mix-blend-screen filter blur-[150px] opacity-20 animate-float-slow" />

        {/* Glass overlay pattern */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>

        <div className="relative z-10 w-full max-w-2xl text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl transform hover:scale-105 transition-transform duration-500 cursor-pointer">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.1] mb-4">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-blue-300">CivicCare.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 font-medium max-w-lg mx-auto leading-relaxed">
            The intelligent platform for building smarter, cleaner, and strictly governed communities.
          </p>
        </div>

        <div className="relative z-10 w-full max-w-2xl flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-8 duration-1000 mx-auto">

          {/* Citizen Card */}
          <button
            onClick={() => setLoginMode('CITIZEN')}
            className="group relative overflow-hidden bg-white/5 hover:bg-white/10 backdrop-blur-md p-6 sm:p-8 rounded-[2rem] border border-white/10 shadow-2xl hover:border-blue-400/50 transition-all duration-300 hover:-translate-y-2 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-500/20 text-blue-300 rounded-2xl sm:rounded-[1.5rem] flex items-center justify-center shrink-0 border border-blue-500/30 group-hover:bg-blue-500 group-hover:text-white group-hover:scale-110 transition-all shadow-inner relative z-10">
              <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <div className="relative z-10 flex-1">
              <h3 className="font-bold text-xl sm:text-2xl text-white mb-2 group-hover:text-blue-200 transition-colors tracking-tight">Citizen Portal</h3>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">Report and track neighborhood issues. Make your voice heard and contribute directly to a better city.</p>
            </div>
            <div className="hidden sm:flex items-center justify-center shrink-0 w-12 h-12 rounded-full border border-white/10 group-hover:border-blue-400/30 group-hover:bg-blue-500/20 transition-all self-center relative z-10">
              <svg className="w-5 h-5 text-slate-500 group-hover:text-blue-300 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </div>
          </button>

          {/* Admin Card */}
          <button
            onClick={() => setLoginMode('ADMIN')}
            className="group relative overflow-hidden bg-white/5 hover:bg-white/10 backdrop-blur-md p-6 sm:p-8 rounded-[2rem] border border-white/10 shadow-2xl hover:border-teal-400/50 transition-all duration-300 hover:-translate-y-2 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-teal-500/20 text-teal-300 rounded-2xl sm:rounded-[1.5rem] flex items-center justify-center shrink-0 border border-teal-500/30 group-hover:bg-teal-500 group-hover:text-white group-hover:scale-110 transition-all shadow-inner relative z-10">
              <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <div className="relative z-10 flex-1">
              <h3 className="font-bold text-xl sm:text-2xl text-white mb-2 group-hover:text-teal-200 transition-colors tracking-tight">Government Portal</h3>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">Access the operations center. Manage reports, assign teams, and oversee municipal progress in real-time.</p>
            </div>
            <div className="hidden sm:flex items-center justify-center shrink-0 w-12 h-12 rounded-full border border-white/10 group-hover:border-teal-400/30 group-hover:bg-teal-500/20 transition-all self-center relative z-10">
              <svg className="w-5 h-5 text-slate-500 group-hover:text-teal-300 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Centered Login Form - Deep Glassmorphism Design
  if (loginMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 relative overflow-hidden font-sans">
        {/* Background decorative elements */}
        {loginMode === 'ADMIN' ? (
          <>
            <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-teal-600 rounded-full mix-blend-screen filter blur-[150px] opacity-20 animate-float" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-emerald-600 rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-float-slow" />
          </>
        ) : (
          <>
            <div className="absolute top-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-blue-600 rounded-full mix-blend-screen filter blur-[150px] opacity-20 animate-float" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[30rem] h-[30rem] bg-indigo-600 rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-float-slow" />
          </>
        )}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>

        <div className="max-w-[28rem] w-full bg-white/5 backdrop-blur-2xl p-10 rounded-[2.5rem] shadow-2xl border border-white/10 z-10 relative animate-in zoom-in-95 duration-500">
          <button onClick={() => setLoginMode(null)} className="text-sm font-bold text-slate-400 hover:text-white mb-8 inline-flex items-center group transition-colors">
            <span className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mr-3 group-hover:bg-white/10 transition-colors">
              <svg className="w-4 h-4 mr-0.5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
            </span>
            Back
          </button>

          <div className="mb-10 text-center">
            <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-6 shadow-xl border ${loginMode === 'ADMIN' ? 'bg-teal-500/20 text-teal-300 border-teal-500/30' : 'bg-blue-500/20 text-blue-300 border-blue-500/30'}`}>
              {loginMode === 'ADMIN' ?
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> :
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              }
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-slate-400 font-medium mt-2">
              {loginMode === 'ADMIN' ? 'Government Official Access' : 'Citizen Access Portal'}
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 text-red-200 p-4 rounded-xl mb-6 text-sm font-bold border border-red-500/20 flex items-center">
              <svg className="w-5 h-5 mr-3 shrink-0 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            {isSignUp && (
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700/50 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 p-4 rounded-xl text-white font-medium placeholder-slate-500 transition-all outline-none" placeholder="e.g. Jane Doe" />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700/50 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 p-4 rounded-xl text-white font-medium placeholder-slate-500 transition-all outline-none" placeholder="name@example.com" />
            </div>

            <div className="pt-4">
              <button type="submit" className={`w-full py-4 rounded-xl font-black text-lg text-white shadow-xl transition-all transform hover:-translate-y-1 ${loginMode === 'ADMIN' ? 'bg-teal-500 hover:bg-teal-400 shadow-teal-500/20 hover:shadow-teal-500/40' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20 hover:shadow-blue-600/40'}`}>
                {isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </div>

            <div className="text-center mt-6">
              <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-slate-400 text-sm font-medium hover:text-white transition-colors">
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                <span className={`font-bold underline underline-offset-4 ${loginMode === 'ADMIN' ? 'text-teal-400' : 'text-blue-400'}`}>
                  {isSignUp ? 'Log in' : 'Sign up'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Logged-in application shell
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-200 selection:text-blue-900">
      {/* Upgraded App Navigation */}
      <nav className="glass border-b border-slate-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[95rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/20 transform rotate-3 hover:rotate-0 transition-transform cursor-pointer">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="font-black text-2xl text-slate-900 tracking-tight leading-none">CivicCare</h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Portal Interface</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-3 bg-white py-2 px-4 rounded-full border border-slate-200 shadow-sm">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-black text-slate-800 leading-tight">{user?.name}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${role === 'ADMIN' ? 'text-emerald-500' : 'text-blue-500'}`}>
                    {role === 'ADMIN' ? 'Administrator' : 'Verified Citizen'}
                  </span>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg border-2 border-white shadow-md ${role === 'ADMIN' ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white' : 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white'}`}>
                  {user?.name.charAt(0).toUpperCase()}
                </div>
              </div>

              <div className="w-[1px] h-8 bg-slate-200 hidden md:block"></div>

              <button
                onClick={handleLogout}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all"
                title="Logout"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-[95rem] mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-700">
        {role === 'CITIZEN' ? (
          <CitizenPortal issues={issues} onIssueSubmitted={fetchIssues} user={user!} />
        ) : (
          <AdminDashboard issues={issues} onIssueUpdated={fetchIssues} />
        )}
      </main>
    </div>
  );
};

export default App;
