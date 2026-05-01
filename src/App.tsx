/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, type FormEvent } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate,
  Link,
  useLocation
} from 'react-router-dom';
import { 
  Users, 
  LayoutDashboard, 
  UserPlus, 
  LogOut, 
  Search,
  Bell,
  Settings,
  ChevronRight,
  Menu,
  X,
  Briefcase,
  Building2,
  TrendingUp,
  Shield,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, firebaseService } from './firebaseService';
import { onAuthStateChanged, User } from 'firebase/auth';
import { cn } from './utils';
import Dashboard from './pages/Dashboard';
import EmployeeList from './pages/EmployeeList';
import { UserProfile, UserRole } from './types';

// Helper for navigation links
const NavLink = ({ to, icon: Icon, children, onClick }: any) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
        isActive 
          ? "bg-slate-900 text-white shadow-lg shadow-slate-200" 
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-900")} />
      <span className="font-medium">{children}</span>
      {isActive && (
        <motion.div 
          layoutId="nav-active"
          className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
        />
      )}
    </Link>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const profile = await firebaseService.getUserProfile(u.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 font-sans">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl">
            <Users className="text-white w-6 h-6" />
          </div>
          <p className="text-slate-400 font-medium animate-pulse">Initializing CrewTrack...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans overflow-hidden">
        {/* Left Side - Visuals */}
        <div className="hidden lg:flex lg:w-1/2 bg-slate-900 p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
             <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px]" />
             <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[120px]" />
          </div>
          
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <Users className="text-slate-900 w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white italic">CrewTrack</span>
          </div>

          <div className="relative z-10">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl font-light text-white leading-tight mb-6"
            >
              Management <br /> 
              <span className="font-semibold italic italic-serif">Redefined.</span>
            </motion.h1>
            <p className="text-slate-400 text-lg max-w-md">
              The modern standard for high-performance HR teams. Scalable, secure, and purely intuitive.
            </p>
          </div>

          <div className="relative z-10 flex gap-12">
            <div>
              <p className="text-white font-bold text-2xl">2.4k+</p>
              <p className="text-slate-500 text-sm italic serif">Global Teams</p>
            </div>
            <div>
              <p className="text-white font-bold text-2xl">99.9%</p>
              <p className="text-slate-500 text-sm italic serif">Uptime Guarantee</p>
            </div>
          </div>
        </div>

        {/* Right Side - Login */}
        <div className="flex-1 flex items-center justify-center p-8 bg-[#E4E3E0]">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-md p-10 bg-white border border-slate-900/10 shadow-2xl rounded-3xl"
          >
            <LoginForm />
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex min-h-screen bg-[#F5F5F0] font-sans text-slate-900">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200/60 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="h-full flex flex-col p-6">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="text-white w-5 h-5" />
                </div>
                <span className="text-xl font-bold tracking-tight italic">CrewTrack</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-slate-400">
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex-1 space-y-2">
              <NavLink to="/" icon={LayoutDashboard}>Dashboard</NavLink>
              <NavLink to="/employees" icon={Users}>Employee Directory</NavLink>
              {userProfile?.role === 'admin' && (
                <NavLink to="/settings" icon={Settings}>System Settings</NavLink>
              )}
            </nav>

            <div className="mt-auto space-y-4 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-3 px-2">
                <img 
                  src={user.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + user.uid} 
                  className="w-10 h-10 rounded-xl border-2 border-slate-100" 
                  alt={user.displayName || "User"} 
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate uppercase tracking-wide">{userProfile?.displayName || user.email?.split('@')[0]}</p>
                  <p className="text-xs text-amber-600 font-bold truncate tracking-tight italic serif capitalize">{userProfile?.role || 'Guest'}</p>
                </div>
              </div>
              
              <button 
                onClick={() => firebaseService.logout()}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium group"
              >
                <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
          {/* Header */}
          <header className="bg-white/80 backdrop-blur-md border-bottom border-slate-200/60 h-20 px-6 lg:px-10 flex items-center justify-between sticky top-0 z-30 shrink-0">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-500">
                <Menu className="w-6 h-6" />
              </button>
              <div className="hidden md:flex items-center bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2 w-80 group focus-within:ring-2 focus-within:ring-slate-900/5 transition-all">
                <Search className="w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Global search (e.g. employee, dept)" 
                  className="bg-transparent border-none outline-none ml-2 text-sm text-slate-600 placeholder:text-slate-400 w-full"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 md:gap-6">
              <div className="hidden lg:flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-slate-500 font-medium">Server Live: <span className="text-slate-900">SG-01</span></span>
                </div>
              </div>
              <div className="w-px h-6 bg-slate-200 hidden md:block" />
              <button className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              </button>
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-10">
            <Routes>
              <Route path="/" element={<Dashboard userRole={userProfile?.role || 'viewer'} />} />
              <Route path="/employees" element={<EmployeeList userRole={userProfile?.role || 'viewer'} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('viewer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        await firebaseService.signUpWithEmail(email, password, name, role);
      } else {
        await firebaseService.loginWithEmail(email, password);
      }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError("Email/Password authentication is not enabled on this project. Please enable it in the Firebase Console Settings.");
      } else {
        setError(err.message || "Authentication failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2 italic-serif">
          {isSignUp ? "Join CrewTrack" : "Welcome Back"}
        </h2>
        <p className="text-slate-500">
          {isSignUp ? "Create an administrative account" : "Sign in to manage your organization"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 italic serif">Full Name</label>
            <input 
              required
              type="text"
              placeholder="e.g. John Doe"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-900/5 outline-none transition-all text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}

        {isSignUp && (
          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 italic serif">Account Privilege</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={cn(
                  "flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all",
                  role === 'admin' 
                    ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-200" 
                    : "bg-white border-slate-100 text-slate-500 hover:border-slate-300"
                )}
              >
                <Shield className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wide">Admin</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('viewer')}
                className={cn(
                  "flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all",
                  role === 'viewer' 
                    ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-200" 
                    : "bg-white border-slate-100 text-slate-500 hover:border-slate-300"
                )}
              >
                <Eye className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wide">Viewer</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 italic serif leading-tight">
              {role === 'admin' 
                ? "Full control: modify directories, onboarding, and logs." 
                : "Read-only: view employee profiles and data metrics."}
            </p>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-400 italic serif">Email Address</label>
          <input 
            required
            type="email"
            placeholder="admin@crewtrack.hr"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-900/5 outline-none transition-all text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-400 italic serif">Password</label>
          <input 
            required
            type="password"
            placeholder="••••••••"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-900/5 outline-none transition-all text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl italic serif font-medium">
            {error}
          </div>
        )}

        <button 
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all duration-200 shadow-lg shadow-slate-200 active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Authenticating..." : (isSignUp ? "Create Account" : "Sign In")}
        </button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
        <div className="relative flex justify-center text-xs uppercase tracking-widest text-slate-400 font-bold bg-white px-4 italic serif">Or continue with</div>
      </div>

      <button 
        type="button"
        onClick={() => firebaseService.loginWithGoogle()}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-bold hover:bg-slate-50 transition-all duration-200 shadow-sm active:scale-[0.98]"
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" referrerPolicy="no-referrer" />
        Google Identity
      </button>

      <div className="mt-8 pt-6 border-t border-slate-50 text-center">
        <button 
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          {isSignUp ? "Already have an account? Sign in" : "New to CrewTrack? Create an account"}
        </button>
      </div>
    </div>
  );
}
