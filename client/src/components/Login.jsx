import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { BeakerIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAppContext();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isSignUp) {
        const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/auth/signup`, { 
          name, 
          email, 
          password, 
          studentId 
        });
        login(res.data);
        toast.success(`Successfully registered! Welcome, ${res.data.user.name}!`);
        navigate('/');
      } else {
        const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/auth/login`, { email, password });
        login(res.data);
        toast.success(`Welcome back, ${res.data.user.name}!`);
        
        if (res.data.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent p-4">
      <Card className="w-full max-w-md bg-white/60 backdrop-blur-xl border-white/20 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <BeakerIcon size={32} />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">
              {isSignUp ? 'Create an Account' : 'Welcome Back'}
            </CardTitle>
            <CardDescription>
              {isSignUp ? 'Enter your details to register as a student' : 'Enter your credentials to access the lab'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">Full Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">Student ID</label>
                  <input 
                    type="text" 
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="STU12345"
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" className="w-full shadow-md" disabled={isLoading}>
              {isLoading ? (isSignUp ? 'Creating account...' : 'Signing in...') : (isSignUp ? 'Sign Up' : 'Sign In')}
            </Button>
          </form>
          
          <div className="text-center pt-2">
            <button 
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                // Clear errors and input fields when switching modes
                setName('');
                setStudentId('');
              }}
              className="text-sm text-primary hover:underline font-medium"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
