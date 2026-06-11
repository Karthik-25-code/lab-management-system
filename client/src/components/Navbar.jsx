import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BeakerIcon, ShoppingCart, LogOut, Package, Menu, Sun, Moon } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAppContext } from '../context/AppContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, cart, setIsCartOpen } = useAppContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize theme from localStorage or system preferences
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // Apply theme to document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-white/10 bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl supports-[backdrop-filter]:bg-white/40 shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md">
            <BeakerIcon size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">
            LabManager
          </span>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Theme Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full h-9 w-9 sm:h-10 sm:w-10 text-slate-700 dark:text-slate-300 transition-all duration-300 transform hover:rotate-12"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-[18px] w-[18px] text-yellow-400" />
            ) : (
              <Moon className="h-[18px] w-[18px] text-indigo-600 dark:text-slate-300" />
            )}
          </Button>

          {user && (
          <div className="flex items-center gap-2 sm:gap-6">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              {(user.role === 'admin' || user.role === 'teacher') ? (
                <Link
                  to="/admin"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    location.pathname === '/admin' ? "text-primary font-semibold" : "text-muted-foreground"
                  )}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/"
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary",
                      location.pathname === '/' ? "text-primary font-semibold" : "text-muted-foreground"
                    )}
                  >
                    Catalog
                  </Link>
                  <Link
                    to="/lectures"
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary",
                      location.pathname === '/lectures' ? "text-primary font-semibold" : "text-muted-foreground"
                    )}
                  >
                    Lectures
                  </Link>
                  <Link
                    to="/labs"
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary",
                      location.pathname === '/labs' ? "text-primary font-semibold" : "text-muted-foreground"
                    )}
                  >
                    Labs
                  </Link>
                  <Link
                    to="/rentals"
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary flex items-center gap-1",
                      location.pathname === '/rentals' ? "text-primary font-semibold" : "text-muted-foreground"
                    )}
                  >
                    <Package className="h-4 w-4" /> My Rentals
                  </Link>
                  {(user.role === 'da' || user.role === 'student') && (
                    <Link
                      to="/verify-labs"
                      className={cn(
                        "text-sm font-medium transition-colors hover:text-primary",
                        location.pathname === '/verify-labs' ? "text-primary font-semibold" : "text-muted-foreground"
                      )}
                    >
                      Verify Labs
                    </Link>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-1 sm:gap-3 pl-2 sm:pl-4 border-l border-white/20">
              {/* Mobile Menu Toggle */}
              <div className="md:hidden flex items-center mr-1">
                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                  <Menu className="h-5 w-5" />
                </Button>
              </div>

              {(user.role === 'student' || user.role === 'da') && (
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="relative rounded-full h-9 w-9 sm:h-10 sm:w-10"
                  onClick={() => setIsCartOpen(true)}
                >
                  <ShoppingCart className="h-4 w-4" />
                  {cart.length > 0 && (
                    <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center rounded-full p-0 text-[10px]">
                      {cart.reduce((a, b) => a + b.quantity, 0)}
                    </Badge>
                  )}
                </Button>
              )}
              
              {(user.role === 'student' || user.role === 'da') && (
                <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 px-2 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold select-none">
                  <span className="text-muted-foreground hidden xs:inline">Wallet:</span>
                  <span className={user.walletBalance < 0 ? "text-destructive font-bold animate-pulse" : "text-green-600 dark:text-green-400 font-bold"}>
                    ₹{user.walletBalance !== undefined ? user.walletBalance.toFixed(2) : '0.00'}
                  </span>
                </div>
              )}

              <div className="hidden sm:flex flex-col text-right mr-2">
                <span className="text-sm font-semibold leading-none">{user.name}</span>
                <span className="text-xs text-muted-foreground uppercase">{user.role}</span>
              </div>
              
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-destructive hover:text-destructive-foreground" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && user && (
        <div className="md:hidden absolute top-16 left-0 right-0 border-b border-white/10 bg-background/95 backdrop-blur-xl p-4 flex flex-col gap-4 shadow-lg animate-in slide-in-from-top-2">
          {(user.role === 'admin' || user.role === 'teacher') ? (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className={cn("p-2 rounded-md hover:bg-muted font-medium", location.pathname === '/admin' ? "text-primary bg-muted/50" : "text-muted-foreground")}
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={cn("p-2 rounded-md hover:bg-muted font-medium", location.pathname === '/' ? "text-primary bg-muted/50" : "text-muted-foreground")}
              >
                Catalog
              </Link>
              <Link
                to="/lectures"
                onClick={() => setMobileMenuOpen(false)}
                className={cn("p-2 rounded-md hover:bg-muted font-medium", location.pathname === '/lectures' ? "text-primary bg-muted/50" : "text-muted-foreground")}
              >
                Lectures
              </Link>
              <Link
                to="/labs"
                onClick={() => setMobileMenuOpen(false)}
                className={cn("p-2 rounded-md hover:bg-muted font-medium", location.pathname === '/labs' ? "text-primary bg-muted/50" : "text-muted-foreground")}
              >
                Labs
              </Link>
              <Link
                to="/rentals"
                onClick={() => setMobileMenuOpen(false)}
                className={cn("p-2 rounded-md hover:bg-muted font-medium flex items-center gap-2", location.pathname === '/rentals' ? "text-primary bg-muted/50" : "text-muted-foreground")}
              >
                <Package className="h-4 w-4" /> My Rentals
              </Link>
              {(user.role === 'da' || user.role === 'student') && (
                <Link
                  to="/verify-labs"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn("p-2 rounded-md hover:bg-muted font-medium", location.pathname === '/verify-labs' ? "text-primary bg-muted/50" : "text-muted-foreground")}
                >
                  Verify Labs
                </Link>
              )}
              {(user.role === 'student' || user.role === 'da') && (
                <div className="mx-2 p-2.5 rounded-lg bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between text-xs font-semibold mt-2 select-none">
                  <span className="text-muted-foreground">Wallet Balance:</span>
                  <span className={user.walletBalance < 0 ? "text-destructive font-bold animate-pulse" : "text-green-600 dark:text-green-400 font-bold"}>
                    ₹{user.walletBalance !== undefined ? user.walletBalance.toFixed(2) : '0.00'}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </nav>
  );
}
