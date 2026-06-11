import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Users, PackageOpen, AlertTriangle, CheckCircle2, Search, Plus, X, Video, Check, XCircle, Pencil, Wallet, Coins, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, isPast } from 'date-fns';
import { useAppContext } from '../context/AppContext';

function UploadComponentModal({ isOpen, onClose, onUpload }) {
  const [formData, setFormData] = useState({
    name: '', category: '', totalQuantity: 1, availableQuantity: 1, description: '', imageUrl: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = { ...formData, availableQuantity: formData.totalQuantity };
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/components`, data);
      toast.success('Component uploaded!');
      onUpload(res.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to upload component');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in">
      <div className="fixed inset-0" onClick={onClose} />
      <Card className="relative w-full max-w-lg shadow-2xl border-white/20 z-10 mx-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
        <button onClick={onClose} className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"><X className="h-4 w-4" /></button>
        <CardHeader><CardTitle>Upload Component</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2"><label className="text-sm font-medium">Name</label><input required className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              <div className="space-y-2"><label className="text-sm font-medium">Category</label><input required className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} /></div>
              <div className="space-y-2"><label className="text-sm font-medium">Quantity</label><input required type="number" min="1" className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm" value={formData.totalQuantity} onChange={e => setFormData({...formData, totalQuantity: parseInt(e.target.value)})} /></div>
              <div className="space-y-2 col-span-2"><label className="text-sm font-medium">Image URL</label><input className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm" placeholder="https://..." value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} /></div>
              <div className="space-y-2 col-span-2"><label className="text-sm font-medium">Description</label><textarea className="flex w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
            </div>
            <div className="flex justify-end gap-2 pt-4"><Button variant="outline" type="button" onClick={onClose}>Cancel</Button><Button type="submit" disabled={isLoading}>Upload</Button></div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function UploadLectureModal({ isOpen, onClose, onUpload, components, lectures, lectureToEdit }) {
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    videoUrl: '', 
    requiredEquipment: [], 
    prerequisites: [],
    language: 'English',
    difficulty: 'Beginner',
    department: 'Electronics'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (lectureToEdit) {
      setFormData({
        title: lectureToEdit.title || '',
        description: lectureToEdit.description || '',
        videoUrl: lectureToEdit.videoUrl || '',
        requiredEquipment: lectureToEdit.requiredEquipment?.map(e => e._id || e) || [],
        prerequisites: lectureToEdit.prerequisites?.map(p => p._id || p) || [],
        language: lectureToEdit.language || 'English',
        difficulty: lectureToEdit.difficulty || 'Beginner',
        department: lectureToEdit.department || 'Electronics'
      });
    } else {
      setFormData({ 
        title: '', 
        description: '', 
        videoUrl: '', 
        requiredEquipment: [], 
        prerequisites: [],
        language: 'English',
        difficulty: 'Beginner',
        department: 'Electronics'
      });
    }
  }, [lectureToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (lectureToEdit) {
        const res = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/lectures/${lectureToEdit._id}`, formData);
        toast.success('Lecture updated!');
        onUpload(res.data);
      } else {
        const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/lectures`, formData);
        toast.success('Lecture uploaded!');
        onUpload(res.data);
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to ${lectureToEdit ? 'update' : 'upload'} lecture`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchMetadata = async () => {
    if (!formData.videoUrl) {
      toast.error('Please enter a video URL first');
      return;
    }
    const loadingToast = toast.loading('Fetching details...');
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/lectures/metadata`, {
        params: { url: formData.videoUrl }
      });
      const { title, description } = res.data;
      setFormData(prev => ({
        ...prev,
        title: title || prev.title,
        description: description || prev.description
      }));
      toast.success('Details fetched!', { id: loadingToast });
    } catch (err) {
      toast.error('Failed to fetch details automatically.', { id: loadingToast });
    }
  };

  const toggleSelection = (id, field) => {
    setFormData(prev => {
      const list = prev[field];
      if (list.includes(id)) return { ...prev, [field]: list.filter(itemId => itemId !== id) };
      return { ...prev, [field]: [...list, id] };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in">
      <div className="fixed inset-0" onClick={onClose} />
      <Card className="relative w-full max-w-2xl shadow-2xl border-white/20 z-10 mx-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"><X className="h-4 w-4" /></button>
        <CardHeader><CardTitle>{lectureToEdit ? 'Edit Lecture' : 'Add New Lecture'}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Video URL (YouTube or MP4)</label>
              <div className="flex gap-2">
                <input required className="flex h-10 flex-1 rounded-md border border-input bg-background/50 px-3 py-2 text-sm" value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} />
                <Button type="button" variant="secondary" onClick={handleFetchMetadata}>Auto-fetch</Button>
              </div>
            </div>
            <div className="space-y-2"><label className="text-sm font-medium">Title</label><input required className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Description</label><textarea className="flex w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Language</label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm" value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})}>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Telugu">Telugu</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty</label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm" value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})}>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}>
                  <option value="Electronics">Electronics</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Civil">Civil</option>
                  <option value="Electrical">Electrical</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/10">
              <label className="text-sm font-medium">Required Equipment</label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-md bg-background/20">
                {components.map(comp => (
                  <Badge 
                    key={comp._id} 
                    variant={formData.requiredEquipment.includes(comp._id) ? 'default' : 'outline'} 
                    className="cursor-pointer" 
                    onClick={() => toggleSelection(comp._id, 'requiredEquipment')}
                  >
                    {comp.name}
                  </Badge>
                ))}
                {components.length === 0 && <span className="text-xs text-muted-foreground">No components available</span>}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/10">
              <label className="text-sm font-medium">Prerequisite Lectures</label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-md bg-background/20">
                {lectures.map(lec => (
                  <Badge 
                    key={lec._id} 
                    variant={formData.prerequisites.includes(lec._id) ? 'default' : 'outline'} 
                    className="cursor-pointer" 
                    onClick={() => toggleSelection(lec._id, 'prerequisites')}
                  >
                    {lec.title}
                  </Badge>
                ))}
                {lectures.length === 0 && <span className="text-xs text-muted-foreground">No lectures available</span>}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4"><Button variant="outline" type="button" onClick={onClose}>Cancel</Button><Button type="submit" disabled={isLoading}>{lectureToEdit ? 'Update' : 'Save'} Lecture</Button></div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAppContext();
  const [rentals, setRentals] = useState([]);
  const [components, setComponents] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [labRequests, setLabRequests] = useState([]);
  const [students, setStudents] = useState([]);
  const [labs, setLabs] = useState([]);
  const [walletLogs, setWalletLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLectureUploadOpen, setIsLectureUploadOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [verifTab, setVerifTab] = useState('pending');
  const [editingDueRentalId, setEditingDueRentalId] = useState(null);
  const [newDueTime, setNewDueTime] = useState('');
  const [isSavingDue, setIsSavingDue] = useState(false);
  const [editingLecture, setEditingLecture] = useState(null);
  const [lectureLanguageFilter, setLectureLanguageFilter] = useState('');
  const [lectureDifficultyFilter, setLectureDifficultyFilter] = useState('');
  const [lectureDepartmentFilter, setLectureDepartmentFilter] = useState('');

  // Wallet adjustment states
  const [isAdjustWalletOpen, setIsAdjustWalletOpen] = useState(false);
  const [adjustWalletUser, setAdjustWalletUser] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState('topup');
  const [adjustDesc, setAdjustDesc] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Labs management states
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [editingLab, setEditingLab] = useState(null);
  const [labName, setLabName] = useState('');
  const [labDesc, setLabDesc] = useState('');
  const [labManager, setLabManager] = useState('');
  const [labAssistants, setLabAssistants] = useState([]);
  const [labComponents, setLabComponents] = useState([]);
  const [isSavingLab, setIsSavingLab] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const promises = [
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/lectures`)
      ];
      
      // If admin or teacher, fetch rentals and components
      if (user?.role === 'admin' || user?.role === 'teacher') {
        promises.push(axios.get(`${import.meta.env.VITE_BACKEND_URL}/rentals/active`));
        promises.push(axios.get(`${import.meta.env.VITE_BACKEND_URL}/components`));
      } else {
        promises.push(Promise.resolve({ data: [] }));
        promises.push(Promise.resolve({ data: [] }));
      }

      // Both admin and teacher fetch pending lab requests and students
      if (user?.role === 'admin' || user?.role === 'teacher') {
        promises.push(axios.get(`${import.meta.env.VITE_BACKEND_URL}/lab-requests`));
        promises.push(axios.get(`${import.meta.env.VITE_BACKEND_URL}/users/students`));
      } else {
        promises.push(Promise.resolve({ data: [] }));
        promises.push(Promise.resolve({ data: [] }));
      }

      // Always fetch labs for authenticated dashboard users
      promises.push(axios.get(`${import.meta.env.VITE_BACKEND_URL}/labs`));

      // Fetch wallet logs if admin or has wallet permission
      const hasWalletPerm = user?.role === 'admin' || user?.canUpdateWallet === true;
      if (hasWalletPerm) {
        promises.push(axios.get(`${import.meta.env.VITE_BACKEND_URL}/users/wallet/all-transactions`));
      } else {
        promises.push(Promise.resolve({ data: [] }));
      }

      const [lecturesRes, rentalsRes, compRes, labRequestsRes, studentsRes, labsRes, walletLogsRes] = await Promise.all(promises);
      
      setLectures(lecturesRes.data);
      setRentals(rentalsRes.data);
      setComponents(compRes.data);
      setLabRequests(labRequestsRes.data);
      setStudents(studentsRes.data);
      setLabs(labsRes.data);
      setWalletLogs(walletLogsRes.data);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to fetch dashboard data');
    }
  };

  const handleMarkReturned = async (rental) => {
    const dueTime = new Date(rental.dueTime);
    const now = new Date();
    let estimatedFine = 0;
    if (now > dueTime) {
      const hoursLate = Math.ceil((now - dueTime) / (1000 * 60 * 60));
      estimatedFine = hoursLate * 10 * rental.quantityRented;
    }

    const input = window.prompt(
      `Marking "${rental.componentId?.name}" as returned.\n` +
      `System calculated late fine: ₹${estimatedFine.toFixed(2)}\n\n` +
      `Enter fine amount to charge (or 0 for no fine):`,
      estimatedFine
    );

    if (input === null) return; // cancelled
    const fineVal = parseFloat(input);
    if (isNaN(fineVal) || fineVal < 0) {
      toast.error('Please enter a valid fine amount');
      return;
    }

    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/return/${rental._id}`, { customFine: fineVal });
      toast.success('Item marked as returned and fine applied!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error returning item');
    }
  };

  const handleImposeManualFine = async (rental) => {
    const input = window.prompt(
      `Impose manual fine on ${rental.userId?.name} for "${rental.componentId?.name}".\n\n` +
      `Enter fine amount in ₹:`
    );
    if (input === null || input.trim() === '') return;
    const fineAmount = parseFloat(input);
    if (isNaN(fineAmount) || fineAmount <= 0) {
      toast.error('Please enter a valid positive fine amount');
      return;
    }
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/rentals/${rental._id}/fine`, { fineAmount });
      toast.success('Manual fine imposed successfully!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to impose manual fine');
    }
  };

  const handleApproveRequest = async (id) => {
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/rentals/${id}/approve`);
      toast.success('Request approved!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error approving request');
    }
  };

  const handleRejectRequest = async (id) => {
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/rentals/${id}/reject`);
      toast.success('Request rejected!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error rejecting request');
    }
  };

  const handleDeleteLecture = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lecture?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/lectures/${id}`);
      toast.success('Lecture deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error deleting lecture');
    }
  };

  const handleActionLabRequest = async (id, action, rejectionReason) => {
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/lab-requests/${id}/action`, {
        action,
        rejectionReason
      });
      toast.success(`Request ${action}d successfully!`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to ${action} request`);
    }
  };

  const handleAssignDA = async (studentId) => {
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/users/${studentId}/assign-da`);
      toast.success('User promoted to DA!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign DA role');
    }
  };

  const handleDemoteDA = async (daId) => {
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/users/${daId}/demote-student`);
      toast.success('DA role removed.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to demote user');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(`${import.meta.env.VITE_BACKEND_URL}/users/${userId}/role`, { role: newRole });
      toast.success('User role updated successfully!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update user role');
    }
  };

  const handleToggleWalletPermission = async (userId, currentValue) => {
    try {
      await axios.put(`${import.meta.env.VITE_BACKEND_URL}/users/${userId}/wallet-permission`, {
        canUpdateWallet: !currentValue
      });
      toast.success('Wallet permission updated successfully!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update wallet permission');
    }
  };

  const handleAdjustWalletSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount === 0) {
      toast.error('Please enter a valid non-zero amount');
      return;
    }
    if (!adjustDesc.trim()) {
      toast.error('Description is required');
      return;
    }
    setIsAdjusting(true);
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/users/wallet/update-balance`, {
        userId: adjustWalletUser._id,
        amount,
        type: adjustType,
        description: adjustDesc
      });
      toast.success('Wallet updated successfully!');
      setIsAdjustWalletOpen(false);
      setAdjustAmount('');
      setAdjustDesc('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update wallet balance');
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleSaveLab = async (e) => {
    e.preventDefault();
    if (!labName.trim() || !labManager) {
      toast.error('Lab name and manager are required');
      return;
    }
    setIsSavingLab(true);
    try {
      const payload = {
        name: labName,
        description: labDesc,
        manager: labManager,
        assistants: labAssistants,
        components: labComponents
      };
      if (editingLab) {
        await axios.put(`${import.meta.env.VITE_BACKEND_URL}/labs/${editingLab._id}`, payload);
        toast.success('Lab updated successfully!');
      } else {
        await axios.post(`${import.meta.env.VITE_BACKEND_URL}/labs`, payload);
        toast.success('Lab created successfully!');
      }
      setIsLabModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save lab');
    } finally {
      setIsSavingLab(false);
    }
  };

  const handleDeleteLab = async (labId) => {
    if (!window.confirm('Are you sure you want to delete this lab?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/labs/${labId}`);
      toast.success('Lab deleted successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete lab');
    }
  };

  const handleSaveDueTime = async (rentalId) => {
    setIsSavingDue(true);
    try {
      await axios.put(`${import.meta.env.VITE_BACKEND_URL}/rentals/${rentalId}/due-date`, { dueTime: newDueTime });
      toast.success('Due date updated successfully!');
      setEditingDueRentalId(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update due date');
    } finally {
      setIsSavingDue(false);
    }
  };

  const filteredRentals = rentals.filter(r => {
    const term = search.toLowerCase();
    return r.userId?.name.toLowerCase().includes(term) || r.componentId?.name.toLowerCase().includes(term);
  });

  const activeCount = rentals.filter(r => r.status === 'active').length;
  const pendingCount = rentals.filter(r => r.status === 'pending').length;
  const overdueCount = rentals.filter(r => r.status === 'active' && isPast(new Date(r.dueTime))).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-wrap gap-4 border-b border-white/20 pb-2">
        {(user?.role === 'admin' || user?.role === 'teacher') && (
          <Button variant={activeTab === 'dashboard' ? 'default' : 'ghost'} onClick={() => setActiveTab('dashboard')}>
            Overview & Rentals
          </Button>
        )}
        <Button variant={activeTab === 'lectures' ? 'default' : 'ghost'} onClick={() => setActiveTab('lectures')}>
          <Video className="mr-2 h-4 w-4" /> Lectures
        </Button>
        <Button variant={activeTab === 'verification' ? 'default' : 'ghost'} onClick={() => setActiveTab('verification')}>
          <CheckCircle2 className="mr-2 h-4 w-4" /> Lab Verification
        </Button>
        <Button variant={activeTab === 'users' ? 'default' : 'ghost'} onClick={() => setActiveTab('users')}>
          <Users className="mr-2 h-4 w-4" /> Manage Users
        </Button>
        {(user?.role === 'admin' || user?.role === 'teacher') && (
          <Button variant={activeTab === 'labs' ? 'default' : 'ghost'} onClick={() => setActiveTab('labs')}>
            <PackageOpen className="mr-2 h-4 w-4" /> Manage Labs
          </Button>
        )}
        {(user?.role === 'admin' || user?.canUpdateWallet === true) && (
          <Button variant={activeTab === 'wallet' ? 'default' : 'ghost'} onClick={() => setActiveTab('wallet')}>
            <Wallet className="mr-2 h-4 w-4" /> Wallet Logs
          </Button>
        )}
      </div>

      {activeTab === 'dashboard' && (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
              <p className="text-muted-foreground">Monitor inventory and active rentals.</p>
            </div>
            <Button onClick={() => setIsUploadOpen(true)} className="shadow-lg"><Plus className="mr-2 h-4 w-4" /> Upload Component</Button>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            <Card className="bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl border-white/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Unique Components</CardTitle><PackageOpen className="h-4 w-4 text-muted-foreground" /></CardHeader>
              <CardContent><div className="text-2xl font-bold">{components.length}</div></CardContent>
            </Card>
            <Card className="bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl border-white/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Pending Requests</CardTitle><Users className="h-4 w-4 text-amber-500" /></CardHeader>
              <CardContent><div className="text-2xl font-bold text-amber-500">{pendingCount}</div></CardContent>
            </Card>
            <Card className="bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl border-white/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Currently Rented</CardTitle><CheckCircle2 className="h-4 w-4 text-green-500" /></CardHeader>
              <CardContent><div className="text-2xl font-bold">{activeCount}</div></CardContent>
            </Card>
            <Card className="bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl border-white/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Overdue Returns</CardTitle><AlertTriangle className="h-4 w-4 text-destructive" /></CardHeader>
              <CardContent><div className="text-2xl font-bold text-destructive">{overdueCount}</div></CardContent>
            </Card>
          </div>

          <Card className="bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl border-white/20 shadow-xl overflow-hidden">
            <CardHeader className="flex flex-row justify-between items-center bg-muted/20 border-b pb-4">
              <div><CardTitle>Rentals & Requests</CardTitle><CardDescription>Manage currently checked out items and pending requests.</CardDescription></div>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="Search student or item..." className="h-9 w-full rounded-full border border-input bg-background/50 pl-9 pr-4 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Item</TableHead><TableHead>Due Time</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredRentals.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center">No active rentals found.</TableCell></TableRow>
              ) : (
                filteredRentals.map((rental) => {
                  const dueTime = new Date(rental.dueTime);
                  const isOverdue = isPast(dueTime);
                  return (
                    <TableRow key={rental._id}>
                      <TableCell className="font-medium">{rental.userId?.name}</TableCell>
                      <TableCell>{rental.componentId?.name} <span className="text-xs text-muted-foreground">(x{rental.quantityRented})</span></TableCell>
                      <TableCell className={isOverdue && rental.status === 'active' ? "text-destructive font-semibold" : ""}>
                        {editingDueRentalId === rental._id ? (
                          <div className="flex items-center gap-2">
                            <input 
                              type="datetime-local" 
                              className="bg-background border border-input rounded p-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                              value={newDueTime}
                              onChange={e => setNewDueTime(e.target.value)}
                              disabled={isSavingDue}
                            />
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-6 w-6 text-green-500 hover:bg-green-500/10" 
                              onClick={() => handleSaveDueTime(rental._id)}
                              disabled={isSavingDue}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-6 w-6 text-destructive hover:bg-destructive/10" 
                              onClick={() => setEditingDueRentalId(null)}
                              disabled={isSavingDue}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group">
                            <span>{format(dueTime, 'MMM d, h:mm a')}</span>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" 
                              onClick={() => {
                                setEditingDueRentalId(rental._id);
                                setNewDueTime(format(dueTime, "yyyy-MM-dd'T'HH:mm"));
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={rental.status === 'pending' ? 'secondary' : (isOverdue && rental.status === 'active') ? "destructive" : "default"}>
                          {rental.status === 'pending' ? 'Pending' : (isOverdue && rental.status === 'active') ? "Overdue" : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right flex justify-end gap-2">
                        {rental.status === 'pending' ? (
                          <>
                            <Button variant="outline" size="sm" onClick={() => handleApproveRequest(rental._id)} className="text-green-500 border-green-500 hover:bg-green-500/10"><Check className="mr-1 h-4 w-4" /> Approve</Button>
                            <Button variant="outline" size="sm" onClick={() => handleRejectRequest(rental._id)} className="text-destructive border-destructive hover:bg-destructive/10"><XCircle className="mr-1 h-4 w-4" /> Reject</Button>
                          </>
                        ) : (
                          <>
                            <Button variant="outline" size="sm" onClick={() => handleImposeManualFine(rental)} className="text-amber-500 border-amber-500 hover:bg-amber-500/10"><AlertTriangle className="mr-1 h-4 w-4" /> Fine</Button>
                            <Button variant="outline" size="sm" onClick={() => handleMarkReturned(rental)}><CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> Mark Returned</Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="col-span-1 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl border-white/20">
        <CardHeader>
          <CardTitle>Inventory Overview</CardTitle>
          <CardDescription>Quick view of lab components and availability.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead className="text-right">Total Owned</TableHead>
                <TableHead className="text-right">Available Now</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {components.map((item) => (
                <TableRow key={item._id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-right">{item.totalQuantity}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={item.availableQuantity > 0 ? 'default' : 'destructive'} className="ml-auto">
                      {item.availableQuantity}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </>
      )}

      {activeTab === 'lectures' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Manage Lectures</h2>
              <p className="text-muted-foreground">Add new lectures and link required components.</p>
            </div>
            <Button onClick={() => { setEditingLecture(null); setIsLectureUploadOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Add Lecture</Button>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-100/50 dark:bg-slate-900/50 p-4 rounded-xl border border-white/10">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Language</label>
              <select 
                value={lectureLanguageFilter}
                onChange={e => setLectureLanguageFilter(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Languages</option>
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Telugu">Telugu</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Difficulty</label>
              <select 
                value={lectureDifficultyFilter}
                onChange={e => setLectureDifficultyFilter(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Department</label>
              <select 
                value={lectureDepartmentFilter}
                onChange={e => setLectureDepartmentFilter(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Departments</option>
                <option value="Electronics">Electronics</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Civil">Civil</option>
                <option value="Electrical">Electrical</option>
              </select>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lectures.filter(lecture => {
              if (lectureLanguageFilter && lecture.language !== lectureLanguageFilter) return false;
              if (lectureDifficultyFilter && lecture.difficulty !== lectureDifficultyFilter) return false;
              if (lectureDepartmentFilter && lecture.department !== lectureDepartmentFilter) return false;
              return true;
            }).map(lecture => (
              <Card key={lecture._id} className="bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl border-white/20 flex flex-col justify-between">
                <div>
                  <CardHeader>
                    <CardTitle className="text-lg flex justify-between items-start gap-2">
                      <span className="line-clamp-2">{lecture.title}</span>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-primary hover:bg-primary/10" onClick={() => { setEditingLecture(lecture); setIsLectureUploadOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteLecture(lecture._id)}><X className="h-4 w-4" /></Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-3">{lecture.description}</p>
                    
                    {/* Metadata Badges */}
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">{lecture.language || 'English'}</Badge>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50">{lecture.difficulty || 'Beginner'}</Badge>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-slate-50 text-slate-600 dark:bg-slate-950/40 dark:text-slate-400 border border-slate-100 dark:border-slate-800/50">{lecture.department || 'Electronics'}</Badge>
                    </div>
                  </CardContent>
                </div>
                <CardContent className="pt-0">
                  <div className="text-xs text-muted-foreground border-t border-white/10 pt-2 mt-1">
                    <strong>Req Equipment:</strong> {lecture.requiredEquipment?.length || 0} items
                  </div>
                </CardContent>
              </Card>
            ))}
            {lectures.filter(lecture => {
              if (lectureLanguageFilter && lecture.language !== lectureLanguageFilter) return false;
              if (lectureDifficultyFilter && lecture.difficulty !== lectureDifficultyFilter) return false;
              if (lectureDepartmentFilter && lecture.department !== lectureDepartmentFilter) return false;
              return true;
            }).length === 0 && <p className="text-muted-foreground col-span-full">No lectures found matching the filters.</p>}
          </div>
        </div>
      )}

      {activeTab === 'verification' && (() => {
        const pending = labRequests.filter(r => r.status === 'pending');
        const history = labRequests.filter(r => r.status !== 'pending');
        const displayed = verifTab === 'pending' ? pending : history;

        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Lab Completion Requests</h2>
                <p className="text-muted-foreground">Approve or reject student requests for lab verifications.</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant={verifTab === 'pending' ? 'default' : 'outline'}
                  onClick={() => setVerifTab('pending')}
                  size="sm"
                  className="rounded-full"
                >
                  Pending ({pending.length})
                </Button>
                <Button 
                  variant={verifTab === 'history' ? 'default' : 'outline'}
                  onClick={() => setVerifTab('history')}
                  size="sm"
                  className="rounded-full"
                >
                  History ({history.length})
                </Button>
              </div>
            </div>

            <Card className="bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl border-white/20 shadow-xl overflow-hidden">
              <CardHeader className="bg-muted/20 border-b pb-4">
                <CardTitle>{verifTab === 'pending' ? 'Verification Queue' : 'Verification History Log'}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Lecture/Lab Title</TableHead>
                      <TableHead>Requested Date</TableHead>
                      {verifTab === 'pending' ? (
                        <TableHead className="text-right">Actions</TableHead>
                      ) : (
                        <>
                          <TableHead>Status</TableHead>
                          <TableHead>Verifier</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayed.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={verifTab === 'pending' ? 5 : 6} className="h-24 text-center text-muted-foreground">
                          No requests found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayed.map(req => (
                        <TableRow key={req._id}>
                          <TableCell className="font-medium">{req.studentId?.name}</TableCell>
                          <TableCell>{req.studentId?.studentId || 'N/A'}</TableCell>
                          <TableCell className="font-semibold">
                            <div>{req.lectureId?.title}</div>
                            <div className="flex gap-2 mt-1.5 flex-wrap">
                              <Badge variant="outline" className={`text-[9px] px-1 py-0 ${
                                req.daStatus === 'approved' ? 'bg-green-50 text-green-600 border-green-200' :
                                req.daStatus === 'rejected' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                              }`}>
                                DA: {req.daStatus === 'approved' ? 'da-verified' : req.daStatus}
                              </Badge>
                              <Badge variant="outline" className={`text-[9px] px-1 py-0 ${
                                req.teacherStatus === 'approved' ? 'bg-green-50 text-green-600 border-green-200' :
                                req.teacherStatus === 'rejected' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                              }`}>
                                Teacher: {req.teacherStatus}
                              </Badge>
                              <Badge variant="outline" className={`text-[9px] px-1 py-0 ${
                                req.adminStatus === 'approved' ? 'bg-green-50 text-green-600 border-green-200' :
                                req.adminStatus === 'rejected' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                              }`}>
                                Admin: {req.adminStatus}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>{format(new Date(req.createdAt), 'MMM d, h:mm a')}</TableCell>
                          {verifTab === 'pending' ? (
                            <TableCell className="text-right flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-green-500 border-green-500 hover:bg-green-500/10"
                                onClick={() => handleActionLabRequest(req._id, 'approve')}
                              >
                                <Check className="mr-1 h-4 w-4" /> Approve
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-destructive border-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  const reason = window.prompt('Enter rejection reason (optional):');
                                  if (reason !== null) {
                                    handleActionLabRequest(req._id, 'reject', reason);
                                  }
                                }}
                              >
                                <X className="mr-1 h-4 w-4" /> Reject
                              </Button>
                            </TableCell>
                          ) : (
                            <>
                              <TableCell>
                                <Badge variant={req.status === 'approved' ? 'default' : 'destructive'} className="uppercase">
                                  {req.status}
                                </Badge>
                                {req.status === 'rejected' && req.rejectionReason && (
                                  <p className="text-[11px] text-destructive mt-1 max-w-xs">{req.rejectionReason}</p>
                                )}
                              </TableCell>
                              <TableCell className="text-xs">
                                {req.actionedBy ? (
                                  <span>{req.actionedBy.name} ({req.actionedBy.role?.toUpperCase()})</span>
                                ) : 'N/A'}
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {activeTab === 'users' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Manage Users & DAs</h2>
            <p className="text-muted-foreground">Assign students as Department Assistants (DAs) once they complete all labs, or update user roles.</p>
          </div>

          <Card className="bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl border-white/20 shadow-xl overflow-hidden">
            <CardHeader className="bg-muted/20 border-b pb-4">
              <CardTitle>{user?.role === 'admin' ? 'All Users' : 'All Students'}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{user?.role === 'admin' ? 'Name' : 'Student Name'}</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Current Role</TableHead>
                    <TableHead>Wallet Balance</TableHead>
                    {user?.role === 'admin' && <TableHead>Wallet Auth</TableHead>}
                    <TableHead>Lab Completion Progress</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={user?.role === 'admin' ? 7 : 6} className="h-24 text-center text-muted-foreground">
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    students.map(student => {
                      const completedCount = student.completedLectures?.length || 0;
                      const totalLectures = lectures.length;
                      const hasCompletedAll = completedCount === totalLectures && totalLectures > 0;
                      
                      return (
                        <TableRow key={student._id}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>
                            <Badge variant={student.role === 'da' ? 'default' : student.role === 'admin' ? 'destructive' : student.role === 'teacher' ? 'outline' : 'secondary'} className="uppercase">
                              {student.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold text-slate-700 dark:text-slate-350">
                            ₹{student.walletBalance !== undefined ? student.walletBalance.toFixed(2) : '0.00'}
                          </TableCell>
                          {user?.role === 'admin' && (
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={student.canUpdateWallet || false}
                                disabled={student.role === 'admin'} // Admin always has permission
                                onChange={() => handleToggleWalletPermission(student._id, student.canUpdateWallet)}
                                className="rounded border-slate-350 text-primary focus:ring-primary h-4 w-4"
                              />
                            </TableCell>
                          )}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{completedCount} / {totalLectures}</span>
                              {hasCompletedAll && (
                                <Badge className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                                  All Labs Completed
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right flex items-center justify-end gap-2">
                            {(user?.role === 'admin' || user?.canUpdateWallet) && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-emerald-600 border-emerald-600/30 hover:bg-emerald-500/10 flex items-center gap-1.5"
                                onClick={() => {
                                  setAdjustWalletUser(student);
                                  setAdjustAmount('');
                                  setAdjustDesc('');
                                  setAdjustType('topup');
                                  setIsAdjustWalletOpen(true);
                                }}
                              >
                                <Coins className="h-3.5 w-3.5" /> Adjust
                              </Button>
                            )}
                            {user?.role === 'admin' ? (
                              <select 
                                value={student.role}
                                onChange={(e) => handleRoleChange(student._id, e.target.value)}
                                className="bg-background border border-input rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                              >
                                <option value="student">Student</option>
                                <option value="da">DA</option>
                                <option value="teacher">Teacher</option>
                                <option value="admin">Admin</option>
                              </select>
                            ) : student.role === 'student' ? (
                              <Button
                                size="sm"
                                disabled={!hasCompletedAll}
                                onClick={() => handleAssignDA(student._id)}
                                className={hasCompletedAll ? "bg-primary text-white" : "bg-muted text-muted-foreground cursor-not-allowed"}
                              >
                                Promote to DA
                              </Button>
                            ) : student.role === 'da' ? (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDemoteDA(student._id)}
                              >
                                Demote to Student
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">No Actions</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'labs' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Manage Labs</h2>
              <p className="text-muted-foreground">Configure physical labs, assign manager/assistants, and map hardware components.</p>
            </div>
            <Button onClick={() => {
              setEditingLab(null);
              setLabName('');
              setLabDesc('');
              setLabManager('');
              setLabAssistants([]);
              setLabComponents([]);
              setIsLabModalOpen(true);
            }} className="shadow-lg">
              <Plus className="mr-2 h-4 w-4" /> Create Lab
            </Button>
          </div>

          <Card className="bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl border-white/20 shadow-xl overflow-hidden">
            <CardHeader className="bg-muted/20 border-b pb-4">
              <CardTitle>All Physical Labs ({labs.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lab Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Assistants (DAs)</TableHead>
                    <TableHead>Mapped Components</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {labs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No labs created yet. Click "Create Lab" to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    labs.map(lab => (
                      <TableRow key={lab._id}>
                        <TableCell className="font-bold">{lab.name}</TableCell>
                        <TableCell className="text-xs max-w-xs truncate">{lab.description || 'N/A'}</TableCell>
                        <TableCell className="text-xs">
                          {lab.manager ? (
                            <div>
                              <p className="font-semibold">{lab.manager.name}</p>
                              <p className="text-slate-400">{lab.manager.email}</p>
                            </div>
                          ) : 'None'}
                        </TableCell>
                        <TableCell className="text-xs">
                          {lab.assistants && lab.assistants.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {lab.assistants.map(a => (
                                <Badge key={a._id} variant="secondary" className="text-[10px]">
                                  {a.name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">None</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {lab.components && lab.components.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {lab.components.map(c => (
                                <Badge key={c._id} variant="outline" className="text-[10px] bg-slate-50 dark:bg-slate-900/50">
                                  {c.name} (x{c.availableQuantity})
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No components mapped</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingLab(lab);
                                setLabName(lab.name);
                                setLabDesc(lab.description || '');
                                setLabManager(lab.manager?._id || '');
                                setLabAssistants(lab.assistants?.map(a => a._id) || []);
                                setLabComponents(lab.components?.map(c => c._id) || []);
                                setIsLabModalOpen(true);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteLab(lab._id)}
                            >
                              <X className="h-3.5 w-3.5 mr-1" /> Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'wallet' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Wallet Transaction Audit Trail</h2>
            <p className="text-muted-foreground">Auditable record of all wallet updates, fines, topups, and manual adjustments.</p>
          </div>

          <Card className="bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl border-white/20 shadow-xl overflow-hidden">
            <CardHeader className="bg-muted/20 border-b pb-4">
              <CardTitle>All Transactions ({walletLogs.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Operator</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Prev &rarr; New Balance</TableHead>
                    <TableHead>Reason/Description</TableHead>
                    <TableHead>Date & Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {walletLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        No transactions logged yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    walletLogs.map(log => (
                      <TableRow key={log._id}>
                        <TableCell className="font-semibold">
                          {log.userId ? (
                            <div>
                              <p className="text-sm font-medium">{log.userId.name}</p>
                              <p className="text-[10px] text-slate-400 uppercase">{log.userId.role}</p>
                            </div>
                          ) : 'Deleted User'}
                        </TableCell>
                        <TableCell className="text-xs">
                          {log.updatedBy ? (
                            <div>
                              <p className="font-semibold">{log.updatedBy.name}</p>
                              <p className="text-[10px] text-slate-400 uppercase">{log.updatedBy.role}</p>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">System Auto</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] uppercase font-bold ${
                            log.type === 'topup' ? 'bg-green-50 text-green-700 border-green-200' :
                            log.type === 'fine' ? 'bg-red-50 text-red-700 border-red-200' :
                            log.type === 'refund' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-slate-50 text-slate-700 border-slate-250'
                          }`}>
                            {log.type}
                          </Badge>
                        </TableCell>
                        <TableCell className={`font-bold ${log.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {log.amount > 0 ? '+' : ''}₹{log.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          ₹{log.previousBalance.toFixed(2)} ➔ ₹{log.newBalance.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-xs max-w-xs">{log.description}</TableCell>
                        <TableCell className="text-xs">
                          {format(new Date(log.createdAt), 'MMM d, yyyy h:mm a')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Adjust Wallet Balance Modal */}
      {isAdjustWalletOpen && adjustWalletUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setIsAdjustWalletOpen(false)} />
          <Card className="relative w-full max-w-md shadow-2xl border-white/20 z-10 mx-4 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsAdjustWalletOpen(false)}
              className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
            <form onSubmit={handleAdjustWalletSubmit}>
              <CardHeader>
                <CardTitle>Adjust Wallet Balance</CardTitle>
                <CardDescription>
                  Modify wallet balance for <strong>{adjustWalletUser.name}</strong>. Current: ₹{adjustWalletUser.walletBalance?.toFixed(2) || '0.00'}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Adjustment Amount (₹)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="e.g. 500 for topup, -200 for fine"
                    value={adjustAmount}
                    onChange={e => setAdjustAmount(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isAdjusting}
                  />
                  <p className="text-[10px] text-muted-foreground">Enter a positive number to add funds, or a negative number to impose fines/deduct funds.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Transaction Type</label>
                  <select
                    value={adjustType}
                    onChange={e => setAdjustType(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isAdjusting}
                  >
                    <option value="topup">Top Up (Add Funds)</option>
                    <option value="fine">Fine (Impose penalty)</option>
                    <option value="refund">Refund (Credit back)</option>
                    <option value="adjustment">General Adjustment</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Reason / Description</label>
                  <input
                    required
                    type="text"
                    placeholder="Describe why balance is being updated"
                    value={adjustDesc}
                    onChange={e => setAdjustDesc(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isAdjusting}
                  />
                </div>
              </CardContent>
              <div className="flex justify-end gap-2 p-6 border-t border-white/10">
                <Button variant="outline" type="button" onClick={() => setIsAdjustWalletOpen(false)} disabled={isAdjusting}>Cancel</Button>
                <Button type="submit" disabled={isAdjusting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {isAdjusting ? 'Updating...' : 'Update Balance'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Create/Edit Lab Modal */}
      {isLabModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setIsLabModalOpen(false)} />
          <Card className="relative w-full max-w-lg shadow-2xl border-white/20 z-10 mx-4 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsLabModalOpen(false)}
              className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
            <form onSubmit={handleSaveLab}>
              <CardHeader>
                <CardTitle>{editingLab ? 'Edit Physical Lab' : 'Create New Physical Lab'}</CardTitle>
                <CardDescription>Configure physical lab hardware map, manager, and assistants.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Lab Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Microprocessors Lab (ECE-302)"
                    value={labName}
                    onChange={e => setLabName(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isSavingLab}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    placeholder="Describe location, hours, or specific lab focus"
                    value={labDesc}
                    onChange={e => setLabDesc(e.target.value)}
                    className="flex w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary h-20"
                    disabled={isSavingLab}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Lab Manager (Admin or Teacher)</label>
                  <select
                    required
                    value={labManager}
                    onChange={e => setLabManager(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isSavingLab}
                  >
                    <option value="">Select Lab Manager</option>
                    {students.filter(s => ['admin', 'teacher'].includes(s.role)).map(m => (
                      <option key={m._id} value={m._id}>
                        {m.name} ({m.role.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Lab Assistants (DAs / Students)</label>
                  <div className="max-h-32 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 space-y-1.5 bg-slate-50/50">
                    {students.filter(s => ['da', 'student'].includes(s.role)).map(a => (
                      <label key={a._id} className="flex items-center gap-2 text-xs font-medium cursor-pointer p-1 rounded hover:bg-white dark:hover:bg-slate-800">
                        <input
                          type="checkbox"
                          checked={labAssistants.includes(a._id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setLabAssistants([...labAssistants, a._id]);
                            } else {
                              setLabAssistants(labAssistants.filter(id => id !== a._id));
                            }
                          }}
                          className="rounded border-slate-350 text-primary focus:ring-primary h-3.5 w-3.5"
                        />
                        <span>{a.name} ({a.role.toUpperCase()})</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Map Lab Components</label>
                  <div className="max-h-32 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 space-y-1.5 bg-slate-50/50">
                    {components.map(comp => (
                      <label key={comp._id} className="flex items-center gap-2 text-xs font-medium cursor-pointer p-1 rounded hover:bg-white dark:hover:bg-slate-800">
                        <input
                          type="checkbox"
                          checked={labComponents.includes(comp._id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setLabComponents([...labComponents, comp._id]);
                            } else {
                              setLabComponents(labComponents.filter(id => id !== comp._id));
                            }
                          }}
                          className="rounded border-slate-350 text-primary focus:ring-primary h-3.5 w-3.5"
                        />
                        <span>{comp.name} ({comp.category})</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
              <div className="flex justify-end gap-2 p-6 border-t border-white/10">
                <Button variant="outline" type="button" onClick={() => setIsLabModalOpen(false)} disabled={isSavingLab}>Cancel</Button>
                <Button type="submit" disabled={isSavingLab}>
                  {isSavingLab ? 'Saving...' : (editingLab ? 'Update Lab' : 'Create Lab')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <UploadComponentModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} onUpload={comp => setComponents([...components, comp])} />
      <UploadLectureModal 
        isOpen={isLectureUploadOpen} 
        onClose={() => { setIsLectureUploadOpen(false); setEditingLecture(null); }} 
        onUpload={() => { fetchData(); }} 
        components={components}
        lectures={lectures}
        lectureToEdit={editingLecture}
      />
    </div>
  );
}
