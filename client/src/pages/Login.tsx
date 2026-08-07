import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { motion, AnimatePresence, cubicBezier } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import PulseDivider from '../components/PulseDivider';
import type { ApiErrorPayload } from '../types';
 
// Animated Logo Component
function AnimatedLogo() {
  return (
    <Link to="/" className="group inline-flex items-center gap-1 font-display text-xl text-chalk tracking-wider">
      <motion.span 
        whileHover={{ x: -2 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        GYM
      </motion.span>
      <motion.span 
        className="inline-block text-volt font-bold"
        animate={{ 
          opacity: [1, 0.2, 1],
          scale: [1, 1.2, 1],
        }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      >
        _
      </motion.span>
      <motion.span 
        whileHover={{ x: 2 }}
        transition={{ type: "spring", stiffness: 400 }}
        className="text-chalk group-hover:text-volt transition-colors duration-300"
      >
        FREK
      </motion.span>
    </Link>
  );
}
 
// Stagger Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};
 
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: cubicBezier(0.16, 1, 0.3, 1) }
  },
};
 
export default function Login() {
  const { login, sessionEndedReason, clearSessionEndedReason } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(sessionEndedReason);
  const [submitting, setSubmitting] = useState(false);
 
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorPayload>;
      setError(axiosErr.response?.data?.message || 'Unable to log in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
 
  // Show the "signed out elsewhere" message once, then clear it from
  // context so refreshing this page or navigating back doesn't repeat it.
  useEffect(() => {
    if (sessionEndedReason) clearSessionEndedReason();
  }, [sessionEndedReason, clearSessionEndedReason]);
 
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-ink overflow-hidden">
      {/* Left hero panel */}
      <motion.div 
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex flex-col justify-between p-14 border-r border-white/5 relative overflow-hidden"
      >
        {/* Animated Glow Background */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.05, 0.12, 0.05]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-volt blur-3xl pointer-events-none" 
        />
 
        <div>
          <AnimatedLogo />
        </div>
 
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative"
        >
          <motion.p variants={itemVariants} className="font-mono text-xs tracking-[0.3em] text-volt uppercase mb-4">
            Session 01 / Sign in
          </motion.p>
          <motion.h1 variants={itemVariants} className="font-display text-6xl leading-[0.95] text-chalk mb-6">
            TRACK.
            <br />
            TRAIN.
            <br />
            REPEAT.
          </motion.h1>
          <motion.div variants={itemVariants}>
            <PulseDivider className="max-w-xs" />
          </motion.div>
          <motion.p variants={itemVariants} className="text-mist mt-6 max-w-sm">
            Your training log, goals, and progress — all in one place. Sign back in to
            pick up where you left off.
          </motion.p>
        </motion.div>
 
        <p className="text-xs text-mist font-mono">gym_frek © {new Date().getFullYear()}</p>
      </motion.div>
 
      {/* Right form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10 relative">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-sm"
        >
          <motion.div variants={itemVariants} className="lg:hidden mb-8 text-center">
            <AnimatedLogo />
          </motion.div>
 
          <motion.h2 variants={itemVariants} className="font-display text-3xl text-chalk mb-1">
            Welcome back
          </motion.h2>
          <motion.p variants={itemVariants} className="text-mist text-sm mb-8">
            Log in to continue your streak.
          </motion.p>
 
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, x: 0 }}
                animate={{ opacity: 1, y: 0, x: [0, -5, 5, -5, 5, 0] }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                role="alert"
                className="mb-5 rounded-lg border border-pulse/30 bg-pulse/10 px-4 py-3 text-sm text-pulse"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
 
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <motion.div variants={itemVariants}>
              <label htmlFor="email" className="block text-xs font-semibold text-mist uppercase tracking-wide mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field transition-all duration-200 focus:ring-2 focus:ring-volt/50"
                placeholder="you@example.com"
              />
            </motion.div>
 
            <motion.div variants={itemVariants}>
              <label htmlFor="password" className="block text-xs font-semibold text-mist uppercase tracking-wide mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field transition-all duration-200 focus:ring-2 focus:ring-volt/50"
                placeholder="••••••••"
              />
            </motion.div>
 
            <motion.div variants={itemVariants}>
              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                disabled={submitting} 
                className="btn-primary mt-2 relative overflow-hidden disabled:opacity-70"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="inline-block w-4 h-4 border-2 border-chalk border-t-transparent rounded-full"
                    />
                    Signing in…
                  </span>
                ) : (
                  'Sign in'
                )}
              </motion.button>
            </motion.div>
          </form>
 
          <motion.p variants={itemVariants} className="text-sm text-mist mt-8 text-center">
            New to gym_frek?{' '}
            <Link to="/register" className="text-volt font-semibold hover:underline transition-all">
              Create an account
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}