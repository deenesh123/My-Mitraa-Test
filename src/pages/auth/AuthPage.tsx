import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Building2,
  Shield,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  KeyRound
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MyMitraaLogo } from '../../components/common/MyMitraaLogo';
import { ApiClient } from '../../api/client';
import { UserAccount } from '../../api/types';
import { useToast } from '../../components/common/Toast';

interface AuthPageProps {
  onSuccess: (user: UserAccount) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  // Sign In inputs
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<UserAccount | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Sign Up inputs
  const [signUpFullName, setSignUpFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpDepartment, setSignUpDepartment] = useState('Engineering');
  const [signUpRole, setSignUpRole] = useState('Production Engineer');

  // Terms dialog modal
  const [termsModalOpen, setTermsModalOpen] = useState(false);

  // Sign In Handler with Glassy Animation
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const identifier = userName.trim();
    if (!identifier) {
      setLoginError('User Name or Email is required');
      showToast('Validation Error', 'Please enter your User Name or Email', 'error');
      return;
    }

    if (!password || !password.trim()) {
      setLoginError('Password is required');
      showToast('Validation Error', 'Please enter your password', 'error');
      return;
    }

    if (!agreeTerms) {
      setLoginError('Please agree to the Terms & Conditions to proceed');
      showToast('Terms Required', 'Please check "I Agree To The Terms & Conditions"', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await ApiClient.auth.login(identifier, password);
      setAuthenticatedUser(res.data);

      // Trigger the glassy verification success transition matching the video
      setTimeout(() => {
        setLoading(false);
        setLoginSuccess(true);
        showToast('Verified Successfully', `Welcome back, ${res.data.name}!`);

        // Proceed into dashboard after the green shield check animation
        setTimeout(() => {
          onSuccess(res.data);
        }, 1100);
      }, 700);
    } catch (err: any) {
      setLoading(false);
      const msg = err?.message || 'Authentication failed. Please verify credentials.';
      setLoginError(msg);
      showToast('Login Failed', msg, 'error');
    }
  };

  // Sign Up Handler
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!signUpFullName.trim() || !signUpEmail.trim()) {
      setLoginError('Full name and email are required');
      showToast('Validation Error', 'Name and company email are required', 'error');
      return;
    }

    if (!signUpPassword || signUpPassword.length < 6) {
      setLoginError('Password must be at least 6 characters');
      showToast('Validation Error', 'Password must be at least 6 characters', 'error');
      return;
    }

    if (!agreeTerms) {
      setLoginError('You must agree to the Terms & Conditions');
      showToast('Terms Required', 'Please check "I Agree To The Terms & Conditions"', 'error');
      return;
    }

    setLoading(true);
    try {
      await ApiClient.auth.register(
        signUpFullName.trim(),
        signUpEmail.trim(),
        signUpRole,
        signUpDepartment,
        signUpPassword
      );
      setLoading(false);
      showToast('Account Created!', 'Registration successful. Please sign in with your credentials.', 'success');
      // Direct user to Sign In tab without faking an authenticated session
      setActiveTab('signin');
      setUserName(signUpEmail.trim());
      setPassword('');
    } catch (err: any) {
      setLoading(false);
      const msg = err?.message || 'Registration could not be completed';
      setLoginError(msg);
      showToast('Error', msg, 'error');
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center overflow-x-hidden font-sans select-none bg-black text-white">
      {/* 
        ====================================================================
        LUXURY GLASSY CINEMATIC BACKGROUND (From Video Reference)
        - Pure black dark canvas
        - Golden amber liquid ribbon waves & silk sheen
        - Volumetric warm amber/bronze and violet glows
        - Organic liquid lighting reflections
        ====================================================================
      */}

      {/* 1. Base dark background */}
      <div className="fixed inset-0 z-0 bg-radial from-[#1A1208] via-[#0D0904] to-[#030303]" />

      {/* 2. Flowing Golden Silk Ribbons SVG Graphics (Smooth wave lines) */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40 overflow-hidden">
        <svg
          className="w-full h-full object-cover"
          viewBox="0 0 1440 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="goldSilk1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D97706" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#78350F" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="goldSilk2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.6" />
              <stop offset="40%" stopColor="#B45309" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Wave Curve 1 */}
          <path
            d="M-100,500 C300,300 600,700 1100,400 C1300,280 1500,450 1600,600 L1600,1000 L-100,1000 Z"
            fill="url(#goldSilk1)"
          />
          {/* Wave Curve 2 */}
          <path
            d="M-50,200 C400,100 800,500 1300,250 C1500,150 1600,300 1700,400"
            stroke="url(#goldSilk2)"
            strokeWidth="3"
            opacity="0.6"
          />
          {/* Wave Curve 3 */}
          <path
            d="M0,750 C500,550 900,850 1500,600"
            stroke="url(#goldSilk1)"
            strokeWidth="2"
            opacity="0.4"
          />
        </svg>
      </div>

      {/* 3. Volumetric Amber & Violet Ambient Glows */}
      <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bg-amber-500/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[600px] h-[500px] bg-amber-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="fixed top-[40%] left-[50%] -translate-x-1/2 w-[650px] h-[650px] bg-[#7B3AEC]/10 rounded-full blur-[180px] pointer-events-none" />

      {/* 
        ====================================================================
        TOP BRAND HEADER: MY MiTRAA TaskFlow
        (Optima & Kellton completely removed as requested)
        ====================================================================
      */}
      <header className="relative z-10 w-full pt-8 sm:pt-10 px-6 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center text-center"
        >
          <div className="flex items-center gap-3">
            <MyMitraaLogo size="md" variant="full" inverted={true} />
          </div>
          <p className="text-[11px] text-amber-200/70 font-semibold tracking-widest uppercase mt-1.5 drop-shadow">
            Enterprise TaskFlow &amp; Collaboration Platform
          </p>
        </motion.div>
      </header>

      {/* 
        ====================================================================
        CENTER GLASSY CARD WITH 4 BEVELED FROSTED CORNER BRACKETS
        Directly styled after the "Glassy Otp Animation" video reference:
        - Multi-layer curved frosted glass container
        - 4 distinctive angled corner-glass prisms with highlight edges
        - Sleek golden amber icon & input focus glow
        - Smooth spring state transition between Sign In and Verified
        ====================================================================
      */}
      <main className="relative z-10 w-full flex-1 flex flex-col items-center justify-center px-4 py-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-[430px]"
        >
          {/* Glass Card Outer Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-white/10 to-amber-600/20 rounded-[2.5rem] blur-xl opacity-60 pointer-events-none" />

          {/* MAIN FROSTED GLASS SHELL */}
          <div className="relative rounded-[2.2rem] bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-black/60 backdrop-blur-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.4)] p-7 sm:p-9 overflow-hidden">
            
            {/* 4 SIGNATURE GLASS CORNER PRISMS (From the Video Reference) */}
            {/* Top-Left Corner Glass Bracket */}
            <div className="absolute top-2 left-2 w-10 h-10 border-t-2 border-l-2 border-white/60 rounded-tl-2xl pointer-events-none shadow-[inset_2px_2px_8px_rgba(255,255,255,0.3)] bg-gradient-to-br from-white/20 to-transparent" />
            {/* Top-Right Corner Glass Bracket */}
            <div className="absolute top-2 right-2 w-10 h-10 border-t-2 border-r-2 border-white/60 rounded-tr-2xl pointer-events-none shadow-[inset_-2px_2px_8px_rgba(255,255,255,0.3)] bg-gradient-to-bl from-white/20 to-transparent" />
            {/* Bottom-Left Corner Glass Bracket */}
            <div className="absolute bottom-2 left-2 w-10 h-10 border-b-2 border-l-2 border-white/60 rounded-bl-2xl pointer-events-none shadow-[inset_2px_-2px_8px_rgba(255,255,255,0.3)] bg-gradient-to-tr from-white/20 to-transparent" />
            {/* Bottom-Right Corner Glass Bracket */}
            <div className="absolute bottom-2 right-2 w-10 h-10 border-b-2 border-r-2 border-white/60 rounded-br-2xl pointer-events-none shadow-[inset_-2px_-2px_8px_rgba(255,255,255,0.3)] bg-gradient-to-tl from-white/20 to-transparent" />

            {/* Inner Diagonal Specular Sheen Stripe */}
            <div className="absolute -top-32 -left-32 w-72 h-72 bg-gradient-to-br from-white/25 via-transparent to-transparent rotate-45 pointer-events-none rounded-full blur-sm" />

            <AnimatePresence mode="wait">
              {!loginSuccess ? (
                /* ================= FORM STATE (SIGN IN / SIGN UP) ================= */
                <motion.div
                  key="auth-form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Top Key / Lock Icon with Golden Glow (From Video) */}
                  <div className="flex justify-center mb-3">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)] text-amber-300"
                    >
                      <KeyRound className="w-6 h-6 stroke-[2.2]" />
                    </motion.div>
                  </div>

                  {/* Header Title: SIGN IN */}
                  <div className="text-center mb-5">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-wider text-white">
                      {activeTab === 'signin' ? (
                        <>
                          Sign In to <span className="text-amber-400">MY MiTRAA</span>
                        </>
                      ) : (
                        <>
                          Create <span className="text-amber-400">Account</span>
                        </>
                      )}
                    </h2>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      {activeTab === 'signin'
                        ? 'Enter your enterprise credentials to access TaskFlow'
                        : 'Register your corporate account profile'}
                    </p>

                    {/* Tab Switcher Pills */}
                    <div className="inline-flex items-center gap-1 mt-3.5 p-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('signin');
                          setLoginError(null);
                        }}
                        className={`px-4 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                          activeTab === 'signin'
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold shadow-md shadow-amber-500/30'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('signup');
                          setLoginError(null);
                        }}
                        className={`px-4 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                          activeTab === 'signup'
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold shadow-md shadow-amber-500/30'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Sign Up
                      </button>
                    </div>
                  </div>

                  {/* Validation Error banner */}
                  {loginError && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3 bg-red-950/80 backdrop-blur-md border border-red-500/50 text-red-200 text-xs rounded-xl flex items-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                      <span>{loginError}</span>
                    </motion.div>
                  )}

                  {/* SIGN IN FORM */}
                  {activeTab === 'signin' ? (
                    <form onSubmit={handleSignIn} className="space-y-4">
                      {/* User Name Field */}
                      <div>
                        <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                          User Name
                        </label>
                        <div className="relative group">
                          <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3 transition-colors group-focus-within:text-amber-400" />
                          <input
                            type="text"
                            required
                            value={userName}
                            onChange={e => setUserName(e.target.value)}
                            placeholder="deenesh-sabat"
                            className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/15 rounded-xl text-xs sm:text-sm font-medium text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 focus:bg-black/60 transition-all"
                          />
                        </div>
                      </div>

                      {/* Password Field */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold text-zinc-300">
                            Password
                          </label>
                          <span className="text-[10px] text-amber-400/80 font-medium cursor-pointer hover:underline">
                            Forgot?
                          </span>
                        </div>
                        <div className="relative group">
                          <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3 transition-colors group-focus-within:text-amber-400" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••••"
                            className="w-full pl-10 pr-10 py-2.5 bg-black/40 border border-white/15 rounded-xl text-xs sm:text-sm font-medium text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 focus:bg-black/60 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-zinc-500 hover:text-zinc-300 p-1 absolute right-3 top-2.5 cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Checkbox: I Agree To The Terms & Conditions */}
                      <div className="flex items-center gap-2 pt-1 text-zinc-300">
                        <input
                          id="agreeTerms"
                          type="checkbox"
                          checked={agreeTerms}
                          onChange={e => setAgreeTerms(e.target.checked)}
                          className="w-4 h-4 rounded text-amber-500 border-zinc-600 bg-black/40 focus:ring-amber-400 cursor-pointer"
                        />
                        <label
                          htmlFor="agreeTerms"
                          className="text-xs text-zinc-300 cursor-pointer select-none"
                        >
                          I Agree To The{' '}
                          <button
                            type="button"
                            onClick={() => setTermsModalOpen(true)}
                            className="font-bold text-amber-400 underline hover:text-amber-300 transition-colors cursor-pointer"
                          >
                            Terms &amp; Conditions
                          </button>
                        </label>
                      </div>

                      {/* Solid Golden Action Button Matching Video Proceed Button */}
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 active:brightness-95 text-black rounded-xl text-xs sm:text-sm font-extrabold tracking-wider uppercase shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all cursor-pointer disabled:opacity-75 flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            <span>Verifying Credentials...</span>
                          </>
                        ) : (
                          <>
                            <span>Sign In &amp; Proceed</span>
                            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                          </>
                        )}
                      </motion.button>
                    </form>
                  ) : (
                    /* SIGN UP FORM */
                    <form onSubmit={handleSignUp} className="space-y-3.5">
                      <div>
                        <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={signUpFullName}
                          onChange={e => setSignUpFullName(e.target.value)}
                          placeholder="e.g. Deenesh Sabat"
                          className="w-full px-3.5 py-2 bg-black/40 border border-white/15 rounded-xl text-xs sm:text-sm font-medium text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                          Work Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={signUpEmail}
                          onChange={e => setSignUpEmail(e.target.value)}
                          placeholder="deenesh@mymitraa.internal"
                          className="w-full px-3.5 py-2 bg-black/40 border border-white/15 rounded-xl text-xs sm:text-sm font-medium text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                            Department
                          </label>
                          <select
                            value={signUpDepartment}
                            onChange={e => setSignUpDepartment(e.target.value)}
                            className="w-full px-3 py-2 bg-black/60 border border-white/15 rounded-xl text-xs font-semibold text-zinc-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                          >
                            <option value="Engineering">Engineering</option>
                            <option value="Operations">Operations</option>
                            <option value="Architecture">Architecture</option>
                            <option value="Product">Product</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                            Role
                          </label>
                          <select
                            value={signUpRole}
                            onChange={e => setSignUpRole(e.target.value)}
                            className="w-full px-3 py-2 bg-black/60 border border-white/15 rounded-xl text-xs font-semibold text-zinc-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                          >
                            <option value="Production Engineer">Production Engineer</option>
                            <option value="Super Admin">Super Admin</option>
                            <option value="Architect">Architect</option>
                            <option value="Frontend Engineer">Frontend Engineer</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                          Set Password *
                        </label>
                        <input
                          type="password"
                          required
                          value={signUpPassword}
                          onChange={e => setSignUpPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          className="w-full px-3.5 py-2 bg-black/40 border border-white/15 rounded-xl text-xs sm:text-sm font-medium text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-1 text-zinc-300">
                        <input
                          id="agreeTermsSignUp"
                          type="checkbox"
                          checked={agreeTerms}
                          onChange={e => setAgreeTerms(e.target.checked)}
                          className="w-4 h-4 rounded text-amber-500 border-zinc-600 bg-black/40 focus:ring-amber-400 cursor-pointer"
                        />
                        <label
                          htmlFor="agreeTermsSignUp"
                          className="text-xs text-zinc-300 cursor-pointer select-none"
                        >
                          I Agree To The <b>Terms &amp; Conditions</b>
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-black rounded-xl text-xs sm:text-sm font-bold tracking-wider uppercase shadow-md transition-all cursor-pointer disabled:opacity-75"
                      >
                        {loading ? 'Creating Profile...' : 'Register & Join'}
                      </button>
                    </form>
                  )}

                </motion.div>
              ) : (
                /* ================= VERIFIED SUCCESS STATE (Directly from Video Reference) ================= */
                <motion.div
                  key="auth-success"
                  initial={{ opacity: 0, scale: 0.9, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="py-10 text-center flex flex-col items-center justify-center space-y-4"
                >
                  {/* Glowing Green Shield Check Icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
                    className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_35px_rgba(52,211,153,0.5)] text-emerald-400"
                  >
                    <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                  </motion.div>

                  <div className="space-y-1">
                    <motion.h3
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-2xl font-bold text-emerald-400 tracking-wide"
                    >
                      Verified Successfully
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-xs text-zinc-300"
                    >
                      Your enterprise credentials have been confirmed.
                    </motion.p>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="w-full py-3 px-4 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 rounded-xl text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(52,211,153,0.2)]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verified &amp; Secured</span>
                  </motion.div>

                  <p className="text-[11px] text-zinc-500 font-mono">
                    Redirecting to MY MiTRAA TaskFlow...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>

      {/* 
        ====================================================================
        CLEAN MINIMAL FOOTER: MY MiTRAA TaskFlow
        (Optima & Kellton completely removed)
        ====================================================================
      */}
      <footer className="relative z-10 w-full pb-6 pt-2 flex flex-col items-center justify-center text-center">
        <p className="text-xs text-zinc-400 tracking-wide font-normal">
          Protected by enterprise security protocols. © 2026 <span className="font-semibold text-zinc-200">MY MiTRAA</span>. All rights reserved.
        </p>
      </footer>

      {/* Terms & Conditions Modal */}
      {termsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#141416] text-white rounded-2xl shadow-2xl p-6 border border-white/20 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  MY MiTRAA Workspace Terms &amp; Conditions
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTermsModalOpen(false)}
                className="text-zinc-400 hover:text-white text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-zinc-300 space-y-2.5 max-h-64 overflow-y-auto pr-2">
              <p>
                <b>1. Intellectual Property:</b> MY MiTRAA TaskFlow and all associated task tracking algorithms, workflows, and UI components are proprietary. Unauthorized redistribution or reproduction is prohibited.
              </p>
              <p>
                <b>2. Telemetry &amp; Access Control:</b> Account access is restricted to authorized personnel. Role-based permissions are enforced across all modules.
              </p>
              <p>
                <b>3. Data Protection:</b> User credentials and workspace assets are securely encrypted and retained in compliance with enterprise audit policies.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setAgreeTerms(true);
                  setTermsModalOpen(false);
                }}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-full text-xs shadow-sm cursor-pointer"
              >
                I Understand &amp; Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
