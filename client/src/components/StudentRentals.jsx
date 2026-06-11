import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { format, isPast } from 'date-fns';
import { Package, Clock, AlertCircle, Check, X } from 'lucide-react';

export default function StudentRentals() {
  const { user, refreshUser } = useAppContext();
  const [rentals, setRentals] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingDueRentalId, setEditingDueRentalId] = useState(null);
  const [newDueTime, setNewDueTime] = useState('');
  const [isSavingDue, setIsSavingDue] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [isToppingUp, setIsToppingUp] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleTopUpSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    setIsToppingUp(true);
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/users/wallet/topup`, { amount });
      toast.success('Wallet topped up successfully!');
      setTopUpAmount('');
      setIsTopUpOpen(false);
      await refreshUser();
      await fetchTransactions();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to top up wallet');
    } finally {
      setIsToppingUp(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/users/wallet/my-transactions`);
      setTransactions(res.data);
    } catch (err) {
      console.error('Error fetching wallet transactions:', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rentalsRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/rentals/user/${user._id}`);
        setRentals(rentalsRes.data);
        await fetchTransactions();
      } catch (error) {
        console.error('Error fetching student data:', error);
        toast.error(error.response?.data?.error || 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  const handleSaveDueTime = async (rentalId) => {
    setIsSavingDue(true);
    try {
      await axios.put(`${import.meta.env.VITE_BACKEND_URL}/rentals/${rentalId}/due-date`, {
        dueTime: newDueTime
      });
      toast.success('Due date updated successfully!');
      setEditingDueRentalId(null);
      
      // Reload rentals
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/rentals/user/${user._id}`);
      setRentals(res.data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update due date');
    } finally {
      setIsSavingDue(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading your rentals...</div>;
  }

  const activeRentals = rentals.filter(r => r.status !== 'returned');
  const pastRentals = rentals.filter(r => r.status === 'returned');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">My Rentals</h1>
        <p className="text-muted-foreground">Track your active and past equipment rentals.</p>
      </div>

      <div className="bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl border border-white/20 dark:border-slate-800/45 shadow-lg p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 rounded-2xl">
        <div className="space-y-1.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">My Wallet</h2>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-extrabold tracking-tight ${
              user.walletBalance < 0 ? 'text-destructive animate-pulse' : 'text-green-600 dark:text-green-400'
            }`}>
              ₹{user.walletBalance !== undefined ? user.walletBalance.toFixed(2) : '0.00'}
            </span>
            <span className="text-xs text-muted-foreground">available balance</span>
          </div>
          {user.walletBalance < 0 && (
            <p className="text-xs text-destructive font-medium animate-pulse flex items-center gap-1 mt-1">
              ⚠️ Account locked. Negative balance detected. Please contact a wallet administrator to pay fines.
            </p>
          )}
        </div>
        {user.role === 'admin' || user.canUpdateWallet ? (
          <Button 
            onClick={() => setIsTopUpOpen(true)}
            className="rounded-full px-6 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary hover:bg-primary/95 text-primary-foreground font-semibold"
          >
            Top Up Wallet
          </Button>
        ) : (
          <div className="text-xs text-muted-foreground bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/40 rounded-xl p-3 max-w-sm">
            Please contact an authorized Lab Wallet Administrator (Admin or Teacher) to adjust or top up your wallet balance.
          </div>
        )}
      </div>

      {/* Wallet Transaction logs */}
      <div className="space-y-4 pt-2">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          💸 Wallet Transaction History
        </h2>
        {transactions.length === 0 ? (
          <Card className="bg-white/40 dark:bg-slate-950/40 border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center p-6 text-muted-foreground">
              <p className="text-sm">No wallet transactions logged yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
            {transactions.map(tx => (
              <div key={tx._id} className="flex justify-between items-center p-3.5 rounded-xl border border-slate-200/60 bg-white/40 dark:bg-slate-900/30 backdrop-blur-md hover:bg-white dark:hover:bg-slate-800/20 transition-all text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{tx.type}</span>
                    <span className="text-[10px] text-muted-foreground">{format(new Date(tx.createdAt), 'MMM d, h:mm a')}</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">{tx.description}</p>
                  {tx.updatedBy && (
                    <p className="text-[9px] text-slate-400">Processed by: {tx.updatedBy.name} ({tx.updatedBy.role?.toUpperCase()})</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`font-bold text-sm ${tx.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                    {tx.amount > 0 ? '+' : ''}₹{tx.amount.toFixed(2)}
                  </span>
                  <p className="text-[10px] text-muted-foreground">Bal: ₹{tx.newBalance.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" /> Active Rentals ({activeRentals.length})
        </h2>
        
        {activeRentals.length === 0 ? (
          <Card className="bg-white/40 dark:bg-slate-950/40 border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center p-12 text-muted-foreground">
              <Package className="h-12 w-12 mb-4 opacity-50" />
              <p>You have no active rentals.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeRentals.map((rental) => {
              const dueTime = new Date(rental.dueTime);
              const overdue = isPast(dueTime) && rental.status === 'active';
              let accumulatingFine = 0;
              if (overdue) {
                const hoursLate = Math.max(0, Math.ceil((currentTime - dueTime) / (1000 * 60 * 60)));
                accumulatingFine = hoursLate * 10 * rental.quantityRented;
              }
              return (
                <Card key={rental._id} className="overflow-hidden bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl border-white/20 shadow-lg hover:shadow-xl transition-all">
                  <div className="flex gap-4 p-4">
                    <img src={rental.componentId?.imageUrl || 'https://via.placeholder.com/150'} alt={rental.componentId?.name} className="h-24 w-24 rounded-lg object-cover bg-muted flex-shrink-0" />
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-semibold line-clamp-2 text-sm sm:text-base">{rental.componentId?.name}</h3>
                        <Badge variant={
                          rental.status === 'pending' ? 'secondary' :
                          rental.status === 'rejected' ? 'destructive' :
                          overdue ? 'destructive' : 'default'
                        } className="flex-shrink-0 uppercase text-[9px] px-1.5 py-0.5">
                          {rental.status === 'pending' ? 'Pending' :
                           rental.status === 'rejected' ? 'Rejected' :
                           overdue ? 'Overdue' : 'Active'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Qty: {rental.quantityRented}</p>
                      
                      <div className={`text-xs flex items-center gap-1 mt-2 p-2 rounded-md ${
                        rental.status === 'pending' ? 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400' :
                        rental.status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                        overdue ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                      }`}>
                        {overdue ? <AlertCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                        <span className="font-medium truncate">Due: {format(dueTime, 'MMM d, h:mm a')}</span>
                      </div>

                      {overdue && accumulatingFine > 0 && (
                        <div className="text-xs text-destructive font-bold bg-destructive/10 dark:bg-destructive/20 p-2.5 rounded-lg border border-destructive/15 mt-2 flex justify-between items-center animate-pulse">
                          <span className="flex items-center gap-1">⚠️ Overdue Fine:</span>
                          <span>₹{accumulatingFine.toFixed(2)}</span>
                        </div>
                      )}

                      {rental.status === 'pending' && (
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                          {editingDueRentalId === rental._id ? (
                            <div className="flex items-center gap-1 w-full">
                              <input 
                                type="datetime-local" 
                                className="flex-1 bg-background border border-input rounded px-1.5 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary min-w-0"
                                value={newDueTime}
                                onChange={e => setNewDueTime(e.target.value)}
                                disabled={isSavingDue}
                              />
                              <Button 
                                size="icon" 
                                variant="outline" 
                                className="h-7 w-7 text-green-500 border-green-500/30 hover:bg-green-500/10 flex-shrink-0" 
                                onClick={() => handleSaveDueTime(rental._id)}
                                disabled={isSavingDue}
                              >
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="outline" 
                                className="h-7 w-7 text-destructive border-destructive/30 hover:bg-destructive/10 flex-shrink-0" 
                                onClick={() => setEditingDueRentalId(null)}
                                disabled={isSavingDue}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <span className="text-[11px] text-muted-foreground">Adjust due date?</span>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-[10px] text-primary px-2 hover:bg-primary/10"
                                onClick={() => {
                                  setEditingDueRentalId(rental._id);
                                  setNewDueTime(format(dueTime, "yyyy-MM-dd'T'HH:mm"));
                                }}
                              >
                                Edit
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {pastRentals.length > 0 && (
        <div className="space-y-6 pt-8 border-t border-white/10">
          <h2 className="text-xl font-semibold text-muted-foreground">Past Rentals</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 opacity-80">
            {pastRentals.map((rental) => (
              <Card key={rental._id} className="bg-white/40 dark:bg-slate-950/40 border border-white/10 shadow-sm">
                <div className="p-4 flex items-center gap-3">
                  <Package className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-sm truncate">{rental.componentId?.name || 'Returned Component'}</h4>
                    <p className="text-[11px] text-muted-foreground">Returned: {format(new Date(rental.returnTime), 'MMM d, yyyy')}</p>
                    <p className="text-[11px] text-muted-foreground">Qty: {rental.quantityRented}</p>
                    {rental.fineAmount > 0 ? (
                      <div className="text-[10px] text-destructive bg-destructive/5 dark:bg-destructive/10 px-2 py-0.5 rounded border border-destructive/10 w-fit mt-1 font-semibold">
                        Fine: ₹{rental.fineAmount} (Auto-Paid)
                      </div>
                    ) : (
                      <div className="text-[10px] text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 px-2 py-0.5 rounded border border-green-200/30 w-fit mt-1 font-semibold">
                        No fines
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Top Up Wallet Modal */}
      {isTopUpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setIsTopUpOpen(false)} />
          <Card className="relative w-full max-w-sm shadow-2xl border-white/20 z-10 mx-4 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsTopUpOpen(false)}
              className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 animate-in fade-in duration-200"
            >
              <X className="h-4 w-4" />
            </button>
            <form onSubmit={handleTopUpSubmit}>
              <CardHeader>
                <CardTitle>Top Up Wallet</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Simulate adding money to your wallet balance to pay off fines or enable rentals.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Top Up Amount (₹)</label>
                  <input
                    required
                    type="number"
                    min="1"
                    placeholder="Enter amount (e.g. 500)"
                    value={topUpAmount}
                    onChange={e => setTopUpAmount(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isToppingUp}
                  />
                </div>
              </CardContent>
              <div className="flex justify-end gap-2 p-6 border-t border-white/10">
                <Button variant="outline" type="button" onClick={() => setIsTopUpOpen(false)} disabled={isToppingUp}>Cancel</Button>
                <Button type="submit" disabled={isToppingUp}>
                  {isToppingUp ? 'Processing...' : 'Add Funds'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
