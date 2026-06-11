import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { PlayCircle, CheckCircle2, Lock, ArrowRight, Check, Clock, AlertTriangle, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function Lectures() {
  const [lectures, setLectures] = useState([]);
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [verifiers, setVerifiers] = useState([]);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedVerifierIds, setSelectedVerifierIds] = useState([]);
  const [filterLanguage, setFilterLanguage] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const { user, login, addToCart } = useAppContext();

  const renderRequestStatus = (req) => {
    const getBadgeColor = (status) => {
      if (status === 'approved') return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-900/50';
      if (status === 'rejected') return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50';
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50';
    };
    
    return (
      <div className="flex flex-col gap-1.5 p-3 rounded-xl border border-slate-200/50 bg-slate-50/40 dark:bg-slate-900/30 dark:border-slate-800/40 text-xs w-full max-w-xs mt-2 text-left">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground font-semibold">Student DA:</span>
          <Badge variant="outline" className={`text-[10px] px-2 py-0.5 uppercase font-semibold ${getBadgeColor(req.daStatus || 'pending')}`}>
            {req.daStatus === 'approved' ? 'da-verified' : req.daStatus || 'pending'}
          </Badge>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground font-semibold">Teacher:</span>
          <Badge variant="outline" className={`text-[10px] px-2 py-0.5 uppercase font-semibold ${getBadgeColor(req.teacherStatus || 'pending')}`}>
            {req.teacherStatus || 'pending'}
          </Badge>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground font-semibold">Admin:</span>
          <Badge variant="outline" className={`text-[10px] px-2 py-0.5 uppercase font-semibold ${getBadgeColor(req.adminStatus || 'pending')}`}>
            {req.adminStatus || 'pending'}
          </Badge>
        </div>
      </div>
    );
  };

  useEffect(() => {
    fetchLectures();
    if (user) {
      fetchRequests();
      fetchVerifiers();
    }
  }, [user]);

  const fetchLectures = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/lectures`);
      setLectures(res.data);
      if (res.data.length > 0) setSelectedLecture(res.data[0]);
    } catch (error) {
      console.error('Failed to fetch lectures', error);
      toast.error(error.response?.data?.error || 'Failed to fetch lectures');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/lab-requests/my-requests`);
      setRequests(res.data);
    } catch (err) {
      console.error('Failed to fetch requests', err);
    }
  };

  const fetchVerifiers = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/users/verifiers`);
      // Exclude self from verifiers list
      setVerifiers(res.data.filter(v => v._id !== user?._id));
    } catch (err) {
      console.error('Failed to fetch verifiers', err);
    }
  };

  const handleAddAllToCart = (equipmentList) => {
    let addedCount = 0;
    equipmentList.forEach(item => {
      if (item.availableQuantity > 0) {
        addToCart(item, 1, 2); // default 1 qty, 2 hours
        addedCount++;
      }
    });
    if (addedCount > 0) {
      toast.success(`Added ${addedCount} available items to request cart!`);
    } else {
      toast.error('No available items to add.');
    }
  };

  const handleSubmitRequest = async (lectureId) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/lab-requests`, {
        lectureId,
        requestedVerifierIds: selectedVerifierIds
      });
      toast.success('Verification request submitted successfully!');
      fetchRequests();
      setRequestModalOpen(false);
      setSelectedVerifierIds([]);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit verification request.');
    }
  };

  const isLectureUnlocked = (lecture) => {
    if (!lecture) return false;
    if (user?.role === 'admin' || user?.role === 'teacher') return true;
    if (!lecture.prerequisites || lecture.prerequisites.length === 0) return true;
    
    const completedIds = user?.completedLectures || [];
    return lecture.prerequisites.every(prereq => {
      const prereqId = prereq._id ? prereq._id.toString() : prereq.toString();
      return completedIds.includes(prereqId);
    });
  };

  if (isLoading) {
    return <div className="flex justify-center py-20 text-muted-foreground">Loading lectures...</div>;
  }

  const selectedLectureUnlocked = isLectureUnlocked(selectedLecture);
  const isSelectedLectureCompleted = selectedLecture && user?.completedLectures?.includes(selectedLecture._id);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Lectures & Experiments</h1>
        <p className="text-muted-foreground">Watch lectures and easily request the required equipment.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Lectures List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-semibold border-b border-white/10 pb-2">Available Lectures</h2>
          
          {/* Dropdown Filters */}
          <div className="grid grid-cols-1 gap-2 bg-slate-100/50 dark:bg-slate-900/50 p-3 rounded-xl border border-white/10">
            <div className="flex flex-col gap-1">
              <select 
                value={filterLanguage} 
                onChange={e => setFilterLanguage(e.target.value)}
                className="bg-transparent border border-white/10 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Languages</option>
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Telugu">Telugu</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <select 
                value={filterDifficulty} 
                onChange={e => setFilterDifficulty(e.target.value)}
                className="bg-transparent border border-white/10 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <select 
                value={filterDepartment} 
                onChange={e => setFilterDepartment(e.target.value)}
                className="bg-transparent border border-white/10 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
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

          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2">
            {lectures.filter(lecture => {
              if (filterLanguage && lecture.language !== filterLanguage) return false;
              if (filterDifficulty && lecture.difficulty !== filterDifficulty) return false;
              if (filterDepartment && lecture.department !== filterDepartment) return false;
              return true;
            }).map((lecture) => {
              const unlocked = isLectureUnlocked(lecture);
              const isSelected = selectedLecture?._id === lecture._id;
              const isCompleted = user?.completedLectures?.includes(lecture._id);

              return (
                <Card 
                  key={lecture._id} 
                  className={`cursor-pointer transition-all hover:bg-white/80 ${
                    isSelected 
                      ? 'border-primary ring-1 ring-primary shadow-md' 
                      : 'bg-white/40 backdrop-blur-md border-white/20'
                  } ${!unlocked ? 'opacity-65 bg-slate-100/50' : ''}`}
                  onClick={() => setSelectedLecture(lecture)}
                >
                  <CardHeader className="p-4 space-y-2">
                    <CardTitle className="text-base flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 min-w-0">
                        {unlocked ? (
                          <PlayCircle className="h-4 w-4 text-primary flex-shrink-0" />
                        ) : (
                          <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className="truncate">{lecture.title}</span>
                      </span>
                      
                      {isCompleted && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-600 border-green-200 flex-shrink-0">
                          Done
                        </Badge>
                      )}
                      {!unlocked && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-600 border-amber-200 flex-shrink-0">
                          Locked
                        </Badge>
                      )}
                    </CardTitle>

                    {/* Metadata Badges */}
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">{lecture.language || 'English'}</Badge>
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50">{lecture.difficulty || 'Beginner'}</Badge>
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-slate-50 text-slate-600 dark:bg-slate-950/40 dark:text-slate-400 border border-slate-100 dark:border-slate-800/50">{lecture.department || 'Electronics'}</Badge>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
            {lectures.filter(lecture => {
              if (filterLanguage && lecture.language !== filterLanguage) return false;
              if (filterDifficulty && lecture.difficulty !== filterDifficulty) return false;
              if (filterDepartment && lecture.department !== filterDepartment) return false;
              return true;
            }).length === 0 && <p className="text-muted-foreground text-sm p-4 text-center">No lectures found matching the filters.</p>}
          </div>
        </div>

        {/* Right Column: Lecture Details */}
        <div className="lg:col-span-2">
          {selectedLecture ? (
            // Detail Card
            <Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-xl overflow-hidden animate-in slide-in-from-right-8">
                <div className="aspect-video w-full bg-slate-900 relative">
                  {selectedLecture.videoUrl.includes('youtube.com') || selectedLecture.videoUrl.includes('youtu.be') ? (
                    <iframe 
                      width="100%" 
                      height="100%" 
                      src={selectedLecture.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} 
                      title={selectedLecture.title} 
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <video controls className="w-full h-full object-cover">
                      <source src={selectedLecture.videoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>

                {!selectedLectureUnlocked && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border-y border-amber-200 dark:border-amber-900/50 px-4 py-3 flex items-center gap-2 text-amber-800 dark:text-amber-300 text-sm">
                    <Lock className="h-4 w-4 flex-shrink-0 text-amber-500 animate-pulse" />
                    <span><strong>Prerequisites Outstanding:</strong> Equipment requests and verification for this lecture are locked. You can still watch the lecture video.</span>
                  </div>
                )}
                
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl">{selectedLecture.title}</CardTitle>
                    <p className="text-muted-foreground text-sm">{selectedLecture.description}</p>
                  </div>
                  {(user?.role === 'student' || user?.role === 'da') && (
                    <div className="flex-shrink-0">
                      {!selectedLectureUnlocked ? (
                        <Button 
                          size="sm" 
                          disabled 
                          className="shadow-sm bg-slate-200 dark:bg-slate-800 text-muted-foreground flex items-center gap-1.5"
                        >
                          <Lock className="h-4 w-4" /> Request Locked
                        </Button>
                      ) : isSelectedLectureCompleted ? (
                        <div className="flex items-center gap-1.5 text-green-600 bg-green-50 border border-green-200 rounded-full px-3 py-1.5 text-sm font-medium shadow-sm">
                          <Check className="h-4 w-4" /> Completed
                        </div>
                      ) : (
                        (() => {
                          const lectureRequests = requests.filter(r => r.lectureId === selectedLecture._id);
                          const currentReq = lectureRequests[0];
                          if (currentReq && currentReq.status === 'pending') {
                            return (
                              <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5 text-sm font-medium shadow-sm">
                                  <Clock className="h-4 w-4 animate-pulse" /> Pending Verification
                                </div>
                                {renderRequestStatus(currentReq)}
                                 {currentReq.requestedVerifierIds && currentReq.requestedVerifierIds.length > 0 && (
                                   <span className="text-[10px] text-muted-foreground mr-1 mt-1">
                                     Assigned: {currentReq.requestedVerifierIds.map(v => `${v.name} (${v.role.toUpperCase()})`).join(', ')}
                                   </span>
                                 )}
                              </div>
                            );
                          } else if (currentReq && currentReq.status === 'rejected') {
                            return (
                              <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center gap-1.5 text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-2 text-xs max-w-xs">
                                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                                  <span>
                                    <strong>Rejected:</strong> {currentReq.rejectionReason}
                                  </span>
                                </div>
                                <Button 
                                  size="sm" 
                                  onClick={() => setRequestModalOpen(true)}
                                  className="shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary hover:bg-primary/90 text-white text-xs"
                                >
                                  Request Again
                                </Button>
                              </div>
                            );
                          } else {
                            return (
                              <Button 
                                size="sm" 
                                onClick={() => setRequestModalOpen(true)}
                                className="shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" /> Request Verification
                              </Button>
                            );
                          }
                        })()
                      )}
                    </div>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-6 pt-6">
                  {selectedLecture.prerequisites && selectedLecture.prerequisites.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-base flex items-center gap-2 text-slate-700">
                        Prerequisites Completed
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedLecture.prerequisites.map(prereq => (
                          <Badge 
                            key={prereq._id} 
                            variant="secondary" 
                            className="cursor-pointer hover:bg-secondary/80 bg-green-50 text-green-700 border-green-200 border"
                            onClick={() => {
                              const found = lectures.find(l => l._id === prereq._id);
                              if (found) setSelectedLecture(found);
                            }}
                          >
                            <Check className="h-3 w-3 mr-1 text-green-600 inline" /> {prereq.title}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h3 className="font-semibold text-lg text-slate-800">Required Equipment</h3>
                      {selectedLecture.requiredEquipment && selectedLecture.requiredEquipment.length > 0 && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleAddAllToCart(selectedLecture.requiredEquipment)}
                          disabled={!selectedLectureUnlocked}
                        >
                          Add All to Request
                        </Button>
                      )}
                    </div>
                    
                    {selectedLecture.requiredEquipment && selectedLecture.requiredEquipment.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedLecture.requiredEquipment.map(item => (
                          <div key={item._id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200/60 bg-white/50 shadow-sm hover:border-slate-300 transition-colors">
                            <div className="flex items-center gap-3">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.name} className="h-10 w-10 rounded-lg object-cover border" />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] text-muted-foreground border">No img</div>
                              )}
                              <div>
                                <p className="font-semibold text-sm text-slate-800">{item.name}</p>
                                <p className="text-xs text-muted-foreground">Available: {item.availableQuantity}</p>
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-primary hover:bg-primary/5 font-medium"
                              onClick={() => addToCart(item, 1, 2)} 
                              disabled={item.availableQuantity === 0 || !selectedLectureUnlocked}
                            >
                              {!selectedLectureUnlocked ? <Lock className="h-3.5 w-3.5 mr-1 text-muted-foreground" /> : null} Add
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No specific equipment required.</p>
                    )}
                  </div>

                  {/* Verification History Section */}
                  {(user?.role === 'student' || user?.role === 'da') && (
                    <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                      <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200">Verification History</h3>
                      {(() => {
                        const lectureRequests = requests.filter(r => r.lectureId === selectedLecture._id);
                        return lectureRequests.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No verification requests submitted for this lab yet.</p>
                        ) : (
                          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                            {lectureRequests.map((req, idx) => (
                              <div key={req._id} className="p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/30 backdrop-blur-md flex flex-col gap-1.5 text-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-slate-700 dark:text-slate-350">
                                    Attempt #{lectureRequests.length - idx}
                                  </span>
                                  <Badge variant={
                                    req.status === 'approved' ? 'default' :
                                    req.status === 'rejected' ? 'destructive' : 'secondary'
                                  } className="uppercase text-[9px] px-1.5 py-0.5 font-bold">
                                    {req.status}
                                  </Badge>
                                </div>
                                {renderRequestStatus(req)}
                                <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                                  <span>Submitted: {format(new Date(req.createdAt), 'MMM d, yyyy h:mm a')}</span>
                                  {req.requestedVerifierIds && req.requestedVerifierIds.length > 0 && (
                                    <span>Assigned: {req.requestedVerifierIds.map(v => v.name).join(', ')}</span>
                                  )}
                                </div>
                                {req.actionedBy && (
                                  <div className="text-xs text-slate-600 dark:text-slate-400">
                                    Actioned by: <span className="font-medium">{req.actionedBy.name}</span> ({req.actionedBy.role.toUpperCase()})
                                  </div>
                                )}
                                {req.status === 'rejected' && req.rejectionReason && (
                                  <div className="text-xs text-destructive bg-destructive/5 dark:bg-destructive/10 p-2.5 rounded-lg border border-destructive/15 mt-1">
                                    <strong>Rejection Reason:</strong> {req.rejectionReason}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
          ) : (
            <div className="flex items-center justify-center h-full min-h-[300px] border border-dashed rounded-xl border-slate-200 bg-white/20">
              <p className="text-muted-foreground">Select a lecture to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Request Verification Modal */}
      {requestModalOpen && selectedLecture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setRequestModalOpen(false)} />
          <Card className="relative w-full max-w-md shadow-2xl border-white/20 z-10 mx-4 bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setRequestModalOpen(false)}
              className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
            <CardHeader>
              <CardTitle>Request Lab Verification</CardTitle>
              <p className="text-sm text-muted-foreground">
                Submit a request to verify your completion of <strong>{selectedLecture.title}</strong>.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Verifiers (Optional)</label>
                <div className="max-h-48 overflow-y-auto border rounded-xl p-2.5 space-y-1 bg-slate-50/50 dark:bg-slate-900/50">
                  {verifiers.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2 text-center">No other verifiers available.</p>
                  ) : (
                    verifiers.map(v => (
                      <label key={v._id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 cursor-pointer text-sm transition-all">
                        <input
                          type="checkbox"
                          checked={selectedVerifierIds.includes(v._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedVerifierIds([...selectedVerifierIds, v._id]);
                            } else {
                              setSelectedVerifierIds(selectedVerifierIds.filter(id => id !== v._id));
                            }
                          }}
                          className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                        />
                        <span className="font-medium text-slate-700 dark:text-slate-200">{v.name}</span>
                        <Badge variant="secondary" className="text-[9px] uppercase px-1.5 py-0.5 ml-auto bg-slate-100 text-slate-600 border border-slate-250 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                          {v.role}
                        </Badge>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  If you do not select any verifiers, any available DA, Teacher, or Admin can review and approve. Otherwise, only the selected verifiers will see your request.
                </p>
              </div>
            </CardContent>
            <div className="flex justify-end gap-2 p-6 border-t border-white/10">
              <Button variant="outline" onClick={() => setRequestModalOpen(false)}>Cancel</Button>
              <Button onClick={() => handleSubmitRequest(selectedLecture._id)}>Submit Request</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
