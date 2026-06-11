import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Mail, Shield, User, HelpCircle, PackageOpen } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LabsList() {
  const [labs, setLabs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLabs = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/labs`);
        setLabs(res.data);
      } catch (err) {
        console.error('Failed to load labs list:', err);
        toast.error('Failed to load physical labs list');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLabs();
  }, []);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading physical labs...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2.5">
          <PackageOpen className="h-8 w-8 text-primary" /> Physical Laboratories
        </h1>
        <p className="text-muted-foreground">
          View available physical labs, hardware component mappings, and contact personnel for assistance or returns.
        </p>
      </div>

      {labs.length === 0 ? (
        <Card className="bg-white/40 dark:bg-slate-950/40 border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center p-12 text-muted-foreground">
            <PackageOpen className="h-12 w-12 mb-4 opacity-50" />
            <p className="font-semibold">No laboratories configured yet.</p>
            <p className="text-sm">Please check back later or contact an administrator.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {labs.map(lab => (
            <Card key={lab._id} className="bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl border-white/20 shadow-xl overflow-hidden flex flex-col justify-between hover:shadow-2xl transition-all">
              <div>
                <CardHeader className="bg-muted/10 border-b pb-4">
                  <CardTitle className="text-xl text-slate-800 dark:text-slate-100">{lab.name}</CardTitle>
                  <CardDescription className="text-slate-500 dark:text-slate-400 mt-1.5">{lab.description || 'No description provided.'}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-5 pt-5">
                  {/* Manager and Assistants Section */}
                  <div className="space-y-3.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Lab Personnel</h4>
                    
                    {/* Manager */}
                    {lab.manager && (
                      <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60">
                        <Shield className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                        <div className="text-xs">
                          <p className="font-bold text-slate-700 dark:text-slate-350">{lab.manager.name} (Manager)</p>
                          <a href={`mailto:${lab.manager.email}`} className="text-primary hover:underline flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3" /> {lab.manager.email}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Assistants */}
                    {lab.assistants && lab.assistants.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-slate-400" /> Lab Assistants / DAs:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {lab.assistants.map(assistant => (
                            <div key={assistant._id} className="p-2 rounded-lg bg-slate-50/70 dark:bg-slate-900/30 border text-[11px]">
                              <p className="font-semibold text-slate-700 dark:text-slate-300">{assistant.name}</p>
                              <a href={`mailto:${assistant.email}`} className="text-slate-500 dark:text-slate-400 hover:underline flex items-center gap-1 mt-0.5">
                                <Mail className="h-2.5 w-2.5" /> {assistant.email}
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Components Section */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Inventory Map</h4>
                    {lab.components && lab.components.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                        {lab.components.map(comp => (
                          <Badge key={comp._id} variant="secondary" className="text-[10px] bg-slate-100 text-slate-700 border dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 py-0.5">
                            {comp.name} ({comp.availableQuantity} available)
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic flex items-center gap-1">
                        <HelpCircle className="h-3.5 w-3.5" /> No components mapped to this lab.
                      </p>
                    )}
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
