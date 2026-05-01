import { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  Building2, 
  UserPlus, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  Briefcase,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { firebaseService } from '../firebaseService';
import { Employee } from '../types';
import { formatCurrency, formatDate } from '../utils';

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all group"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={cn("p-3 rounded-2xl", color)}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {trend && (
        <div className={cn(
          "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
          trend > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
        )}>
          {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div>
      <p className="text-slate-400 text-sm font-medium mb-1 italic serif uppercase tracking-wider">{title}</p>
      <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
    </div>
  </motion.div>
);

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');

export default function Dashboard({ userRole }: { userRole: string }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = userRole === 'admin';

  useEffect(() => {
    setError(null);
    const unsubscribe = firebaseService.subscribeEmployees(
      (data) => {
        setEmployees(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Dashboard Subscription Error:", err);
        setError("Database access restricted. Check permissions.");
        setLoading(false);
      }
    );

    if (isAdmin) {
      firebaseService.getActivityLogs(5).then(setLogs);
    }

    return () => unsubscribe();
  }, [isAdmin]);

  const stats = [
    { 
      title: "Total Headcount", 
      value: employees.length.toString(), 
      icon: Users, 
      trend: 12,
      color: "bg-slate-900" 
    },
    { 
      title: "Active Depts", 
      value: new Set(employees.map(e => e.department)).size.toString(), 
      icon: Building2, 
      color: "bg-blue-600" 
    },
    { 
      title: "Utilization", 
      value: "94.2%", 
      icon: TrendingUp, 
      trend: 4.3,
      color: "bg-indigo-600" 
    },
    { 
      title: "Open Roles", 
      value: "8", 
      icon: Briefcase, 
      color: "bg-emerald-600" 
    }
  ];

  const recentHires = employees.slice(0, 5);

  return (
    <div className="space-y-10 pb-10">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-amber-500/10 text-amber-600 text-[10px] font-bold uppercase tracking-widest rounded-full border border-amber-500/20">System Intelligence</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{isAdmin ? 'Admin Console' : 'Observer Mode'}</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none mb-2">CrewTrack Dashboard</h1>
          <p className="text-slate-500 font-medium italic serif text-lg">Central hub for organizational performance metrics.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-4">
             <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic serif">Access Level</p>
                <p className="text-sm font-black text-slate-900 tracking-tight uppercase">{userRole}</p>
             </div>
             <div className={cn(
               "w-12 h-12 rounded-xl flex items-center justify-center",
               isAdmin ? "bg-slate-900" : "bg-slate-100"
             )}>
                {isAdmin ? <TrendingUp className="text-white w-6 h-6" /> : <div className="w-3 h-3 rounded-full bg-slate-300" />}
             </div>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700 text-sm font-medium italic-serif">
          Warning: {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Hires */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 italic-serif tracking-tight">Personnel Stream</h2>
            <button className="text-sm font-bold text-slate-900 hover:translate-x-1 transition-transform inline-flex items-center gap-2">
              View Directory <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="bg-white rounded-[2rem] border border-slate-200/60 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-bottom border-slate-100 bg-slate-50/50">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest italic serif">Member</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest italic serif px-2">Role/Position</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest italic serif">Integration</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest italic serif text-right">Deployment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4"><div className="h-10 bg-slate-100 rounded-xl" /></td>
                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded-lg w-20" /></td>
                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded-lg w-24" /></td>
                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded-lg w-16 ml-auto" /></td>
                      </tr>
                    ))
                  ) : employees.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center text-slate-400 font-medium italic serif">Unauthorized or No Data Available</td>
                    </tr>
                  ) : (
                    recentHires.map((emp) => (
                      <tr key={emp.id} className="group hover:bg-slate-50/50 transition-colors cursor-pointer">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={emp.photoUrl || `https://picsum.photos/seed/${emp.id}/100/100`} 
                              className="w-10 h-10 rounded-xl object-cover shrink-0 grayscale hover:grayscale-0 transition-all duration-500"
                              alt={emp.firstName}
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <p className="text-sm font-bold text-slate-900 tracking-tight">{emp.firstName} {emp.lastName}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{emp.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-slate-700">{emp.position}</p>
                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{emp.department}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          {formatDate(emp.hireDate)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={cn(
                             "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter",
                             emp.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                          )}>
                             <span className={cn(
                                "w-1.5 h-1.5 rounded-full animate-pulse",
                                emp.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                             )} />
                             {emp.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-8">
          {isAdmin && (
            <div className="bg-white rounded-[2rem] border border-slate-200/60 p-8 shadow-sm">
               <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 italic-serif">
                <Clock className="w-5 h-5 text-amber-500" />
                Audit Trail
              </h3>
              <div className="space-y-6">
                {logs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic serif">No recent activity detected.</p>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="flex gap-4 relative">
                      <div className="shrink-0 flex flex-col items-center">
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-1.5",
                          log.actionType === 'CREATE' ? 'bg-emerald-500' : log.actionType === 'DELETE' ? 'bg-red-500' : 'bg-amber-500'
                        )} />
                        {i < logs.length - 1 && <div className="w-px flex-1 bg-slate-100 my-1" />}
                      </div>
                      <div className="pb-4">
                        <p className="text-xs font-bold text-slate-900 tracking-tight leading-tight">{log.description}</p>
                        <p className="text-[10px] text-slate-400 font-medium italic serif mt-1">{formatDate(log.timestamp)} by {log.userName}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden group shadow-2xl shadow-slate-200">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-4 italic-serif">System Load</h3>
              <p className="text-slate-400 text-sm mb-6 max-w-[200px]">Infrastructure health and synchronization status.</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "88%" }}
                    className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
                  />
                </div>
                <span className="text-xs font-bold font-mono">88%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
