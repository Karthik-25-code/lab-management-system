import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { PlayCircle, CheckCircle2, Lock, ArrowRight, Check } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';

export default function Lectures() {
  const [lectures, setLectures] = useState([]);
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, login, addToCart } = useAppContext();

  useEffect(() => {
    fetchLectures();
  }, []);

  const fetchLectures = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/lectures`);
      setLectures(res.data);
      if (res.data.length > 0) setSelectedLecture(res.data[0]);
    } catch (error) {
      console.error('Failed to fetch lectures', error);
    } finally {
      setIsLoading(false);
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

  const handleMarkAsCompleted = async (lectureId) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/lectures/${lectureId}/complete`);
      login(res.data); // Update user profile in context and localStorage
      toast.success('Congratulations! Lecture marked as completed.');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to mark lecture as completed.');
    }
  };

  const isLectureUnlocked = (lecture) => {
    if (!lecture) return false;
    if (user?.role === 'admin') return true;
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
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2">
            {lectures.map((lecture) => {
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
                  <CardHeader className="p-4">
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
                  </CardHeader>
                </Card>
              );
            })}
            {lectures.length === 0 && <p className="text-muted-foreground text-sm">No lectures available.</p>}
          </div>
        </div>

        {/* Right Column: Lecture Details */}
        <div className="lg:col-span-2">
          {selectedLecture ? (
            selectedLectureUnlocked ? (
              // Unlocked Detail Card
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
                
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl">{selectedLecture.title}</CardTitle>
                    <p className="text-muted-foreground text-sm">{selectedLecture.description}</p>
                  </div>
                  {user?.role === 'student' && (
                    <div className="flex-shrink-0">
                      {isSelectedLectureCompleted ? (
                        <div className="flex items-center gap-1.5 text-green-600 bg-green-50 border border-green-200 rounded-full px-3 py-1.5 text-sm font-medium shadow-sm">
                          <Check className="h-4 w-4" /> Completed
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          onClick={() => handleMarkAsCompleted(selectedLecture._id)}
                          className="shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" /> Mark as Completed
                        </Button>
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
                        <Button size="sm" variant="outline" onClick={() => handleAddAllToCart(selectedLecture.requiredEquipment)}>
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
                              disabled={item.availableQuantity === 0}
                            >
                              Add
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No specific equipment required.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              // Locked Detail Card
              <Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-xl overflow-hidden p-8 flex flex-col items-center justify-center text-center min-h-[450px] animate-in zoom-in-95 duration-200">
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-600 rounded-full inline-block shadow-sm">
                  <Lock className="h-10 w-10" />
                </div>
                
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Lecture is Locked</h2>
                <p className="text-slate-600 max-w-md mb-8">
                  This lecture has outstanding prerequisites. Please complete the prerequisite lectures below to unlock access to the material and equipment request list.
                </p>
                
                <div className="w-full max-w-md space-y-3 bg-white/40 border rounded-2xl p-5 backdrop-blur-sm">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 text-left border-b pb-2 mb-2">
                    Prerequisites Required
                  </h3>
                  {selectedLecture.prerequisites && selectedLecture.prerequisites.map(prereq => {
                    const isPrereqDone = user?.completedLectures?.includes(prereq._id);
                    return (
                      <div key={prereq._id} className="flex items-center justify-between p-3 rounded-xl bg-white/70 border border-slate-100 shadow-sm text-left">
                        <span className="font-medium text-sm text-slate-700 truncate mr-2">
                          {prereq.title}
                        </span>
                        {isPrereqDone ? (
                          <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50 font-normal">
                            <Check className="h-3 w-3 mr-1 text-green-600" /> Completed
                          </Badge>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="text-xs text-primary font-medium hover:scale-[1.02] transition-transform flex items-center gap-1"
                            onClick={() => {
                              const found = lectures.find(l => l._id === prereq._id);
                              if (found) setSelectedLecture(found);
                            }}
                          >
                            Go watch <ArrowRight className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )
          ) : (
            <div className="flex items-center justify-center h-full min-h-[300px] border border-dashed rounded-xl border-slate-200 bg-white/20">
              <p className="text-muted-foreground">Select a lecture to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
