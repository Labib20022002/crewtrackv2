import { type FormEvent, type ChangeEvent, type MouseEvent, useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Phone, 
  Edit2, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  FilterX,
  Building2,
  Briefcase,
  X,
  Camera,
  Upload,
  RefreshCw,
  Zap,
  ArrowUpAZ,
  ArrowDownAZ,
  ArrowUpDown,
  History,
  FileDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { firebaseService } from '../firebaseService';
import { Employee, EmployeeInput, ActivityLog } from '../types';
import { cn, formatCurrency, formatDate } from '../utils';

export default function EmployeeList({ userRole }: { userRole: string }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const isAdmin = userRole === 'admin';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState<'firstName' | 'lastName' | 'hireDate'>('lastName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [showSystemLogs, setShowSystemLogs] = useState(false);

  useEffect(() => {
    setError(null);
    const unsubscribe = firebaseService.subscribeEmployees(
      (data) => {
        setEmployees(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Subscription Error:", err);
        setError("Missing or insufficient permissions. Please verify your Firestore Security Rules.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = (emp.firstName + ' ' + emp.lastName + emp.email + emp.position)
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesDept = filterDept ? emp.department === filterDept : true;
    const matchesStatus = filterStatus ? emp.status === filterStatus : true;
    return matchesSearch && matchesDept && matchesStatus;
  }).sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'hireDate') {
      const dateA = a.hireDate?.toDate ? a.hireDate.toDate().getTime() : new Date(a.hireDate).getTime();
      const dateB = b.hireDate?.toDate ? b.hireDate.toDate().getTime() : new Date(b.hireDate).getTime();
      comparison = dateA - dateB;
    } else {
      comparison = a[sortBy].localeCompare(b[sortBy]);
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const departments = Array.from(new Set(employees.map(e => e.department)));

  const handleExportCSV = () => {
    if (filteredEmployees.length === 0) return;

    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Department', 'Position', 'Salary', 'Hire Date', 'Status'];
    const rows = filteredEmployees.map(emp => [
      emp.firstName,
      emp.lastName,
      emp.email,
      emp.phone || '',
      emp.department,
      emp.position,
      emp.salary,
      emp.hireDate?.toDate ? emp.hireDate.toDate().toLocaleDateString() : new Date(emp.hireDate).toLocaleDateString(),
      emp.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `nexus_hr_employees_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id: string, e: MouseEvent) => {
    e.stopPropagation();
    setConfirmDelete({ id });
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setDeletingId(id);
    try {
      await firebaseService.deleteEmployee(id);
      setConfirmDelete(null);
    } catch (err: any) {
      console.error("Delete failed:", err);
      setError("Authorization Failure: You do not have permission to delete this record. Please verify your Admin status in the Security Rules.");
      setTimeout(() => setError(null), 5000);
    } finally {
      setDeletingId(null);
    }
  };

  const openForm = (emp: Employee | null = null, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingEmployee(emp);
    setModalOpen(true);
  };

  const openView = (emp: Employee) => {
    setViewingEmployee(emp);
  };

  const toggleSelect = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkStatusUpdate = async (status: Employee['status']) => {
    setIsBulkUpdating(true);
    try {
      await firebaseService.bulkUpdateStatus(selectedIds, status);
      setSelectedIds([]);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Permanently terminate ${selectedIds.length} employee records?`)) {
      setIsBulkUpdating(true);
      try {
        await firebaseService.bulkDelete(selectedIds);
        setSelectedIds([]);
      } finally {
        setIsBulkUpdating(false);
      }
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 italic serif">Organizational Directory</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight italic-serif">Active Personnel</h1>
        </div>
        <div className="flex flex-wrap gap-4">
          {isAdmin && (
            <button 
              onClick={() => setShowSystemLogs(true)}
              className="bg-white text-slate-900 border border-slate-200 px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-slate-50 transition-all active:scale-95 shrink-0"
            >
              <History className="w-5 h-5 text-slate-400" /> Audit Log
            </button>
          )}
          <button 
            onClick={handleExportCSV}
            disabled={filteredEmployees.length === 0}
            className="bg-white text-slate-900 border border-slate-200 px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-slate-50 transition-all active:scale-95 shrink-0 disabled:opacity-50"
          >
            <FileDown className="w-5 h-5 text-slate-400" /> Export CSV
          </button>
          {isAdmin && (
            <button 
              onClick={() => openForm()}
              className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 shrink-0"
            >
              <Plus className="w-5 h-5" /> Add New Employee
            </button>
          )}
        </div>
      </header>

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-4 p-4 bg-white rounded-3xl border border-slate-200/60 shadow-sm items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name, email or position..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-slate-900/5 transition-all text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <select 
            className="flex-1 lg:w-44 bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900/5 text-sm font-medium"
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select 
            className="flex-1 lg:w-44 bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900/5 text-sm font-medium"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="on-leave">On Leave</option>
            <option value="terminated">Terminated</option>
          </select>

          <div className="flex items-center bg-slate-50/50 border border-slate-100 rounded-xl p-1">
            <select 
              className="bg-transparent px-3 py-2 outline-none text-sm font-medium"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="lastName">Sort by Last Name</option>
              <option value="firstName">Sort by First Name</option>
              <option value="hireDate">Sort by Hire Date</option>
            </select>
            <button 
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 hover:bg-white rounded-lg transition-all text-slate-500 hover:text-slate-900"
              title={sortOrder === 'asc' ? 'Sort Descending' : 'Sort Ascending'}
            >
              {sortOrder === 'asc' ? <ArrowUpAZ className="w-4 h-4" /> : <ArrowDownAZ className="w-4 h-4" />}
            </button>
          </div>
          
          {(search || filterDept || filterStatus) && (
            <button 
              onClick={() => { setSearch(''); setFilterDept(''); setFilterStatus(''); }}
              className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Clear filters"
            >
              <FilterX className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid View */}
      {error && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-3xl text-red-600 text-sm font-medium italic-serif flex items-center gap-3">
          <Zap className="w-5 h-5" />
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 animate-pulse">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl" />
                  <div className="space-y-2">
                    <div className="w-32 h-4 bg-slate-100 rounded" />
                    <div className="w-24 h-3 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="w-full h-8 bg-slate-100 rounded-xl" />
                  <div className="w-full h-8 bg-slate-100 rounded-xl" />
                </div>
              </div>
            ))
          ) : filteredEmployees.length === 0 ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 space-y-4">
              <div className="p-6 bg-slate-100 rounded-full">
                <Search className="w-10 h-10" />
              </div>
              <p className="text-lg font-medium italic serif">Nodal match failure. Try a different query.</p>
            </div>
          ) : (
            filteredEmployees.map((emp) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={emp.id} 
                onClick={() => openView(emp)}
                className={cn(
                  "bg-white p-6 rounded-[2rem] border shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all group relative cursor-pointer selection-none",
                  selectedIds.includes(emp.id) ? "border-indigo-500 ring-2 ring-indigo-500/10" : "border-slate-200/60"
                )}
              >
                <div 
                  onClick={(e) => toggleSelect(emp.id, e)}
                  className={cn(
                    "absolute top-6 left-6 w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center",
                    selectedIds.includes(emp.id) ? "bg-indigo-600 border-indigo-600" : "bg-white border-slate-200 group-hover:border-slate-400"
                  )}
                >
                  {selectedIds.includes(emp.id) && <Zap className="w-2.5 h-2.5 text-white fill-current" />}
                </div>

                <div className="absolute top-6 right-6">
                   <div className={cn(
                    "w-2.5 h-2.5 rounded-full",
                    emp.status === 'active' ? 'bg-emerald-500' : emp.status === 'on-leave' ? 'bg-amber-500' : 'bg-red-500'
                   )} />
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <img 
                    src={emp.photoUrl || `https://picsum.photos/seed/${emp.id}/200/200`} 
                    className="w-16 h-16 rounded-2xl object-cover ring-4 ring-slate-50 transition-all group-hover:ring-slate-900/5 shadow-md"
                    alt={emp.firstName}
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-slate-900 transition-colors uppercase tracking-wide">{emp.firstName} {emp.lastName}</h3>
                    <p className="text-xs text-slate-400 font-medium italic serif">{emp.position}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-slate-500 text-sm">
                    <div className="p-2 bg-slate-50 rounded-lg shrink-0">
                      <Building2 className="w-3 h-3" />
                    </div>
                    <span className="font-medium truncate">{emp.department}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 text-sm">
                    <div className="p-2 bg-slate-50 rounded-lg shrink-0">
                      <Mail className="w-3 h-3" />
                    </div>
                    <span className="font-medium truncate underline-offset-4 hover:underline decoration-slate-200 cursor-pointer">{emp.email}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50 font-sans">
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-400 italic serif">
                    Hired {formatDate(emp.hireDate)} 
                  </div>
                  <div className="flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                    {isAdmin && (
                      <>
                        <button 
                          onClick={(e) => openForm(emp, e)}
                          className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => handleDelete(emp.id, e)}
                          disabled={deletingId === emp.id}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                        >
                          {deletingId === emp.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Bulk Actions Floating Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[55] w-full max-w-4xl px-4"
          >
            <div className="bg-slate-900 border border-white/10 rounded-[2rem] shadow-2xl p-6 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                   <h3 className="text-white font-bold italic-serif text-lg">{selectedIds.length} Personnel Selected</h3>
                   <p className="text-[10px] uppercase font-bold tracking-widest text-white/40 italic serif">Batch Authorization Active</p>
                </div>
              </div>

              {isAdmin ? (
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="flex-1 flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
                      <button 
                        onClick={() => handleBulkStatusUpdate('active')}
                        disabled={isBulkUpdating}
                        className="px-4 py-2 hover:bg-white/10 rounded-lg text-[10px] font-bold text-emerald-400 uppercase tracking-tight transition-all disabled:opacity-50"
                      >
                        Make Active
                      </button>
                      <button 
                        onClick={() => handleBulkStatusUpdate('on-leave')}
                        disabled={isBulkUpdating}
                        className="px-4 py-2 hover:bg-white/10 rounded-lg text-[10px] font-bold text-amber-400 uppercase tracking-tight transition-all disabled:opacity-50"
                      >
                        Set Leave
                      </button>
                      <button 
                        onClick={() => handleBulkStatusUpdate('terminated')}
                        disabled={isBulkUpdating}
                        className="px-4 py-2 hover:bg-white/10 rounded-lg text-[10px] font-bold text-red-100 uppercase tracking-tight transition-all disabled:opacity-50"
                      >
                        Terminate
                      </button>
                  </div>
                  <button 
                      onClick={handleBulkDelete}
                      disabled={isBulkUpdating}
                      className="p-3 bg-red-600/20 text-red-500 border border-red-600/20 rounded-xl hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
                    >
                      <Trash2 className="w-5 h-5" />
                  </button>
                  <button 
                      onClick={() => setSelectedIds([])}
                      disabled={isBulkUpdating}
                      className="p-3 bg-white/5 text-white/60 border border-white/10 rounded-xl hover:bg-white/10 transition-all disabled:opacity-50"
                    >
                      <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <p className="text-amber-400 text-xs font-bold italic serif uppercase tracking-widest px-4">Admin Privileges Required for Bulk Modification</p>
                  <button 
                      onClick={() => setSelectedIds([])}
                      className="p-3 bg-white/5 text-white/60 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                    >
                      <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Details View Modal */}
      <AnimatePresence>
        {viewingEmployee && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setViewingEmployee(null)}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#F5F5F0] w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative z-70 overflow-hidden border border-slate-200"
            >
              <EmployeeDetailsView 
                employee={viewingEmployee} 
                onClose={() => setViewingEmployee(null)} 
                onEdit={() => {
                  const emp = viewingEmployee;
                  setViewingEmployee(null);
                  openForm(emp);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Activity Logs */}
      <AnimatePresence>
        {showSystemLogs && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowSystemLogs(false)}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#F5F5F0] w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-70 overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]"
            >
              <div className="p-8 border-b border-slate-200 flex items-center justify-between shrink-0">
                <div>
                   <h2 className="text-2xl font-bold text-slate-900 italic-serif">Organizational Audit Log</h2>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 italic serif">Immutable Trace Records</p>
                </div>
                <button onClick={() => setShowSystemLogs(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-all">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              <div className="p-8 overflow-y-auto">
                <ActivityLogSection entityId={null} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Employee Modal Form */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setModalOpen(false)}
               className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative z-70 overflow-hidden border border-slate-200"
            >
              <EmployeeForm 
                onClose={() => setModalOpen(false)} 
                employee={editingEmployee}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setConfirmDelete(null)}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl relative z-[80] overflow-hidden border border-slate-200 p-8"
            >
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 italic-serif">Confirm Termination</h3>
                  <p className="text-slate-500 mt-2 italic serif">This record will be permanently purged from the organizational directory. This action is irreversible.</p>
                </div>
                <div className="flex gap-4 w-full">
                  <button 
                    onClick={() => setConfirmDelete(null)}
                    className="flex-1 px-6 py-4 bg-slate-50 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={executeDelete}
                    disabled={deletingId !== null}
                    className="flex-1 px-6 py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                  >
                    {deletingId ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Purge Record"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmployeeDetailsView({ employee, onClose, onEdit }: { employee: Employee, onClose: () => void, onEdit: () => void }) {
  const [localSearch, setLocalSearch] = useState('');

  const highlightMatch = (text: string) => {
    if (!localSearch.trim()) return text;
    const parts = text.split(new RegExp(`(${localSearch})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === localSearch.toLowerCase() ? (
            <mark key={i} className="bg-amber-200 text-slate-900 rounded-sm px-0.5">{part}</mark>
          ) : part
        )}
      </>
    );
  };

  return (
    <div className="flex flex-col h-full max-h-[90vh]">
      <div className="relative h-48 bg-slate-900 overflow-hidden shrink-0">
          <div className="absolute inset-0 opacity-20">
             <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-500 rounded-full blur-[100px]" />
             <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-500 rounded-full blur-[100px]" />
          </div>
          
          <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-white transition-colors" />
              <input 
                type="text" 
                placeholder="Find in profile..." 
                className="bg-white/10 hover:bg-white/20 focus:bg-white/20 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/40 outline-none backdrop-blur-md transition-all w-48 focus:w-64"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
              />
            </div>
            <button 
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="absolute -bottom-16 left-10 p-2 bg-[#F5F5F0] rounded-[2.5rem]">
            <img 
              src={employee.photoUrl || `https://picsum.photos/seed/${employee.id}/200/200`} 
              className="w-32 h-32 rounded-[2rem] object-cover border-4 border-white shadow-xl"
              alt={employee.firstName}
              referrerPolicy="no-referrer"
            />
          </div>
      </div>

      <div className="pt-20 px-10 pb-10 flex-1 overflow-y-auto space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-4xl font-bold text-slate-900 italic-serif tracking-tight">
              {highlightMatch(`${employee.firstName} ${employee.lastName}`)}
            </h2>
            <p className="text-lg text-slate-500 font-medium italic serif">
              {highlightMatch(employee.position)} — <span className="text-slate-900">{highlightMatch(employee.department)}</span>
            </p>
          </div>
          <div className={cn(
             "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm",
             employee.status === 'active' ? 'bg-emerald-100 text-emerald-700' : employee.status === 'on-leave' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
          )}>
            {employee.status}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 border-y border-slate-200/60 py-8">
          <div className="space-y-1">
             <p className="text-xs font-bold uppercase tracking-widest text-slate-400 italic serif">Compensation</p>
             <p className="text-2xl font-bold text-slate-900 font-mono tracking-tighter">{formatCurrency(employee.salary)} <span className="text-xs text-slate-400 font-sans">/ year</span></p>
          </div>
          <div className="space-y-1">
             <p className="text-xs font-bold uppercase tracking-widest text-slate-400 italic serif">Tenure</p>
             <p className="text-lg font-bold text-slate-900">Since {formatDate(employee.hireDate)}</p>
          </div>
          <div className="space-y-1">
             <p className="text-xs font-bold uppercase tracking-widest text-slate-400 italic serif">Contact Channel</p>
             <p className="text-sm font-medium text-slate-600">{highlightMatch(employee.email)}</p>
             <p className="text-sm font-medium text-slate-600">{employee.phone ? highlightMatch(employee.phone) : 'No phone recorded'}</p>
          </div>
          <div className="space-y-1">
             <p className="text-xs font-bold uppercase tracking-widest text-slate-400 italic serif">ID Reference</p>
             <p className="text-xs font-mono text-slate-400">{employee.id}</p>
          </div>
        </div>

        <div>
           <p className="text-xs font-bold uppercase tracking-widest text-slate-400 italic serif mb-3">Professional Biography</p>
           <p className="text-slate-600 leading-relaxed italic serif text-lg">
             {employee.bio ? highlightMatch(employee.bio) : "No biography provided for this personnel record. Profile is awaiting administrative update."}
           </p>
        </div>

            <AnimatePresence>
              {isAdmin && (
                <div className="pt-4 border-t border-slate-200/60">
                   <p className="text-xs font-bold uppercase tracking-widest text-slate-400 italic serif mb-4 flex items-center gap-2">
                     <History className="w-3 h-3" /> Personnel Activity Trail
                   </p>
                   <ActivityLogSection entityId={employee.id} />
                </div>
              )}
            </AnimatePresence>

        <div className="pt-6">
          {isAdmin ? (
            <button 
              onClick={onEdit}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-[0.98]"
            >
              <Edit2 className="w-5 h-5" /> Modify Employee Credentials
            </button>
          ) : (
            <div className="w-full p-6 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-center gap-3 text-amber-800 font-bold italic serif text-sm">
              <Shield className="w-5 h-5" />
              Administrative Authorization Required for Modifications
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityLogSection({ entityId }: { entityId: string | null }) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firebaseService.subscribeActivityLogs(entityId, (data) => {
      setLogs(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [entityId]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-white/50 border border-slate-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="py-8 text-center text-slate-400 italic serif text-sm">
        Nodal history is currently empty for this record.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <div key={log.id} className="flex gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all group">
          <div className={cn(
             "p-3 rounded-xl shrink-0 flex items-center justify-center transition-colors",
             log.actionType === 'CREATE' ? 'bg-emerald-50 text-emerald-600' : log.actionType === 'UPDATE' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
          )}>
            {log.actionType === 'CREATE' ? <Plus className="w-4 h-4" /> : log.actionType === 'UPDATE' ? <RefreshCw className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">{log.userName}</span>
              <span className="text-[9px] font-bold text-slate-300 font-sans tracking-tighter">
                {log.timestamp?.toDate ? formatDate(log.timestamp) : 'Processing...'}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed italic serif group-hover:text-slate-900 transition-colors">{log.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function PhotoUploader({ currentUrl, onUpload, userId }: { currentUrl?: string, onUpload: (url: string) => void, userId: string }) {
  const [isCameraOpen, setCameraOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentUrl || '');
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraOpen(true);
        setError('');
      }
    } catch (err) {
      console.error("Camera Error:", err);
      setError("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob(async (blob) => {
          if (blob) {
            await handleImageUpload(blob);
          }
        }, 'image/jpeg', 0.8);
      }
      stopCamera();
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleImageUpload(file);
    }
  };

  const handleImageUpload = async (file: Blob | File) => {
    setUploading(true);
    try {
      const url = await firebaseService.uploadPhoto(file, userId || 'temp');
      setPreviewUrl(url);
      onUpload(url);
      setError('');
    } catch (err) {
      console.error("Upload Error:", err);
      setError("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <div className="w-32 h-32 rounded-3xl overflow-hidden bg-slate-100 border-4 border-white shadow-xl relative">
          {previewUrl ? (
            <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
              <Briefcase className="w-8 h-8 opacity-20" />
            </div>
          )}
          
          {uploading && (
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
        </div>
        
        <div className="absolute -bottom-2 -right-2 flex gap-2">
          <label className="p-2 bg-slate-900 text-white rounded-xl shadow-lg cursor-pointer hover:bg-slate-800 transition-all active:scale-95">
            <Upload className="w-4 h-4" />
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          </label>
          <button 
            type="button"
            onClick={startCamera}
            className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-all active:scale-95"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isCameraOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
          >
            <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl space-y-4 max-w-lg w-full">
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              </div>
              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={capturePhoto}
                  className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" /> Capture Photo
                </button>
                <button 
                  type="button"
                  onClick={stopCamera}
                  className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="text-xs text-red-500 font-medium italic-serif">{error}</p>}
    </div>
  );
}

function EmployeeForm({ onClose, employee }: { onClose: () => void, employee: Employee | null }) {
  const [formData, setFormData] = useState({
    firstName: employee?.firstName || '',
    lastName: employee?.lastName || '',
    email: employee?.email || '',
    department: employee?.department || '',
    position: employee?.position || '',
    status: employee?.status || 'active',
    salary: employee?.salary || 0,
    phone: employee?.phone || '',
    bio: employee?.bio || '',
    photoUrl: employee?.photoUrl || '',
    hireDate: employee?.hireDate?.toDate ? employee.hireDate.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        salary: Number(formData.salary),
        hireDate: new Date(formData.hireDate),
      } as EmployeeInput;

      if (employee) {
        await firebaseService.updateEmployee(employee.id, payload);
      } else {
        await firebaseService.createEmployee(payload);
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[90vh]">
      <div className="p-8 border-bottom border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 italic-serif">{employee ? 'Modify Record' : 'Onboard Talent'}</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest italic serif">CrewTrack Management System</p>
        </div>
        <button 
          type="button"
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl transition-all shadow-sm"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        <PhotoUploader 
          currentUrl={formData.photoUrl} 
          onUpload={(url) => setFormData({...formData, photoUrl: url})}
          userId={employee?.id || 'new'}
        />

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 italic serif">First Name</label>
            <input 
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-900/5 outline-none transition-all text-sm"
              value={formData.firstName}
              onChange={e => setFormData({...formData, firstName: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 italic serif">Last Name</label>
            <input 
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-900/5 outline-none transition-all text-sm"
              value={formData.lastName}
              onChange={e => setFormData({...formData, lastName: e.target.value})}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 italic serif">Work Email</label>
            <input 
              type="email"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-900/5 outline-none transition-all text-sm"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 italic serif">Phone Number</label>
            <input 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-900/5 outline-none transition-all text-sm"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 italic serif">Department</label>
            <input 
              required
              placeholder="e.g. Engineering, Sales"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-900/5 outline-none transition-all text-sm"
              value={formData.department}
              onChange={e => setFormData({...formData, department: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 italic serif">Position</label>
            <input 
              required
              placeholder="e.g. Senior Software Engineer"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-900/5 outline-none transition-all text-sm"
              value={formData.position}
              onChange={e => setFormData({...formData, position: e.target.value})}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 italic serif">Status</label>
            <select 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-900/5 outline-none transition-all text-sm font-medium"
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value as any})}
            >
              <option value="active">Active</option>
              <option value="on-leave">On Leave</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 italic serif">Salary (Annual)</label>
            <input 
              type="number"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-900/5 outline-none transition-all text-sm"
              value={formData.salary}
              onChange={e => setFormData({...formData, salary: Number(e.target.value)})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 italic serif">Hire Date</label>
            <input 
              type="date"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-900/5 outline-none transition-all text-sm font-medium"
              value={formData.hireDate}
              onChange={e => setFormData({...formData, hireDate: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-400 italic serif">Biography / Internal Notes</label>
          <textarea 
            rows={3}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-slate-900/5 outline-none transition-all text-sm"
            value={formData.bio}
            onChange={e => setFormData({...formData, bio: e.target.value})}
          />
        </div>
      </div>

      <div className="p-8 border-t border-slate-100 bg-slate-50/50 shrink-0">
        <button 
          disabled={submitting}
          className="w-full px-6 py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 active:scale-[0.98]"
        >
          {submitting ? (
             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : employee ? 'Update Record' : 'Complete Onboarding'}
        </button>
      </div>
    </form>
  );
}
