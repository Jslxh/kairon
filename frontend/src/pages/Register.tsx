import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KMonogramLogo } from '../components/KMonogramLogo';
import { Eye, EyeOff, Lock, Mail, User, ArrowRight } from 'lucide-react';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      setError('You must accept the terms and conditions.');
      return;
    }

    setLoading(true);
    try {
      const success = await register(name, email, password);
      if (success) {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0B0B0F] relative overflow-hidden font-sans px-4">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-brand-wine/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-brand-pink/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md flex flex-col items-center relative z-10">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-wine via-brand-rose to-brand-pink flex items-center justify-center shadow-lg shadow-brand-wine/30 p-1">
            <KMonogramLogo className="w-full h-full text-text-primary" />
          </div>
          <div>
            <span className="font-display font-bold text-2xl tracking-wider text-text-primary">KAIRON</span>
            <div className="text-[10px] text-brand-pink/80 font-mono leading-none tracking-widest mt-0.5">CAR-TWIN AI</div>
          </div>
        </div>

        {/* Card Panel */}
        <div className="w-full p-8 rounded-2xl glass-panel relative overflow-hidden flex flex-col gap-6">
          <div className="flex flex-col gap-1.5 text-center">
            <h1 className="text-xl font-display font-bold text-text-primary">Create Account</h1>
            <p className="text-xs text-text-secondary">Initialize your Career Digital Twin identity</p>
          </div>

          {error && (
            <div className="p-3 bg-brand-wine/10 border border-brand-rose/25 rounded-xl text-xs text-brand-pink text-center font-medium animate-shake leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Full Name Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-text-secondary/70 font-mono tracking-wider font-bold uppercase">Full Name</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-text-secondary/60">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jaya Shree Lakshmi S"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/3 border border-white/5 focus:border-brand-rose/30 text-xs text-text-primary font-sans focus:outline-none transition-all duration-300"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-text-secondary/70 font-mono tracking-wider font-bold uppercase">Email Address</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-text-secondary/60">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. jaya@kairon.ai"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/3 border border-white/5 focus:border-brand-rose/30 text-xs text-text-primary font-sans focus:outline-none transition-all duration-300"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-text-secondary/70 font-mono tracking-wider font-bold uppercase">Password</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-text-secondary/60">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/3 border border-white/5 focus:border-brand-rose/30 text-xs text-text-primary font-sans focus:outline-none transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-text-secondary/60 hover:text-text-primary transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-text-secondary/70 font-mono tracking-wider font-bold uppercase">Confirm Password</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-text-secondary/60">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/3 border border-white/5 focus:border-brand-rose/30 text-xs text-text-primary font-sans focus:outline-none transition-all duration-300"
                />
              </div>
            </div>

            {/* Agree Terms */}
            <div className="flex items-start gap-2 py-1">
              <input
                type="checkbox"
                id="agreeTerms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-3.5 h-3.5 mt-0.5 rounded border-white/10 bg-white/3 text-brand-pink focus:ring-brand-rose/30 cursor-pointer"
              />
              <label htmlFor="agreeTerms" className="text-[10px] text-text-secondary select-none cursor-pointer leading-normal">
                I agree to the{' '}
                <a href="#" className="text-brand-pink hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-brand-pink hover:underline">Privacy Policy</a>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-tr from-brand-wine via-brand-rose to-brand-pink hover:from-brand-rose hover:to-brand-pink text-text-primary text-xs font-semibold rounded-xl transition-all duration-300 shadow flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
              ) : (
                <>
                  Initialize Digital Twin
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Foot note */}
          <div className="text-center text-[11px] text-text-secondary mt-1">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-pink hover:text-brand-pink/80 font-bold hover:underline">
              Log In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
