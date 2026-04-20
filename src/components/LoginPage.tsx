import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, ArrowRight, Github, Chrome, LogOut } from 'lucide-react';
import { useVisualLab } from './VisualLabContext';
import { loginSupplierPortal } from '../inventory/api';
import { useNavigate } from 'react-router-dom';
import {
  customerAccountCategoryOptions,
  getCustomerAccountCategoryShortLabel,
  type CustomerAccountCategory,
} from '../customers/accountCategories';

export default function LoginPage() {
  const {
    isLoginPageOpen,
    setIsLoginPageOpen,
    setIsLoggedIn,
    setUserRole,
    isLoggedIn,
    userRole,
    setIsViewingPortal,
    setCurrentSection,
    setCurrentCustomerProfileId,
    postLoginRedirect,
    setPostLoginRedirect,
    customerAccountCategory,
    setCustomerAccountCategory,
  } = useVisualLab();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedCustomerCategory, setSelectedCustomerCategory] = useState<CustomerAccountCategory>('retail');
  const [error, setError] = useState('');
  const [isSupplierDemoLoading, setIsSupplierDemoLoading] = useState(false);

  const finalizeLogin = (role: 'customer' | 'employee' | 'supplier', category: CustomerAccountCategory = 'retail') => {
    setIsLoggedIn(true);
    setUserRole(role);
    setCustomerAccountCategory(role === 'customer' ? category : null);
    setCurrentCustomerProfileId(role === 'customer' ? 'CUST_001' : null);
    setIsViewingPortal(role !== 'customer');
    setCurrentSection('hero');
    setIsLoginPageOpen(false);

    if (postLoginRedirect) {
      const target = postLoginRedirect;
      setPostLoginRedirect(null);
      navigate(target, { replace: true });
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Demo login logic
    if (email === 'customer@brick.com' && password === 'password') {
      finalizeLogin('customer', 'retail');
    } else if (email === 'architect@brick.com' && password === 'password') {
      finalizeLogin('customer', 'architect');
    } else if (email === 'designer@brick.com' && password === 'password') {
      finalizeLogin('customer', 'interior_designer');
    } else if (email === 'contractor@brick.com' && password === 'password') {
      finalizeLogin('customer', 'contractor');
    } else if (email === 'qs@brick.com' && password === 'password') {
      finalizeLogin('customer', 'quantity_surveyor');
    } else if (email === 'employee@brick.com' && password === 'password') {
      finalizeLogin('employee');
    } else if (isRegistering) {
      finalizeLogin('customer', selectedCustomerCategory);
    } else {
      try {
        await loginSupplierPortal({ email, password });
        finalizeLogin('supplier');
      } catch (loginError) {
        setError(
          loginError instanceof Error
            ? loginError.message
            : 'Invalid credentials. Use customer@brick.com, architect@brick.com, employee@brick.com, or a seeded supplier portal account.',
        );
      }
    }
  };

  const handleDemoLogin = (role: 'customer' | 'employee' | 'supplier', category: CustomerAccountCategory = 'retail') => {
    finalizeLogin(role, category);
  };

  const handleSupplierDemoLogin = async () => {
    setError('');
    setIsSupplierDemoLoading(true);

    try {
      await loginSupplierPortal({ email: 'sales@capestone.co.za', password: 'password' });
      finalizeLogin('supplier');
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Supplier demo login failed.');
    } finally {
      setIsSupplierDemoLoading(false);
    }
  };

  if (!isLoginPageOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-[#1a1a1a] w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl border border-white/10 relative custom-scrollbar"
        >
          {/* Close Button */}
          <button 
            onClick={() => setIsLoginPageOpen(false)}
            className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-10"
          >
            <X size={24} />
          </button>

          <div className="p-8 md:p-12">
            <div className="mb-10">
              <h2 className="text-3xl font-serif font-bold text-white tracking-tighter mb-2">
                {isLoggedIn ? 'ACCOUNT ACTIVE' : (isRegistering ? 'CREATE ACCOUNT' : 'WELCOME BACK')}
              </h2>
              <p className="text-white/50 text-xs uppercase tracking-widest">
                {isLoggedIn ? `Logged in as ${userRole}` : (isRegistering ? 'Join the brick revolution' : 'Sign in to your brick studio')}
              </p>
            </div>

            {isLoggedIn ? (
              <div className="space-y-6">
                <div className="p-6 bg-white/5 border border-white/10 rounded-xl text-center">
                  <p className="text-white/60 text-xs uppercase tracking-widest mb-4">You are currently signed in.</p>
                  {userRole === 'customer' ? (
                    <div className="mb-5 space-y-3">
                      <p className="text-[10px] uppercase tracking-widest text-[#22c55e]">
                        {getCustomerAccountCategoryShortLabel(customerAccountCategory)} account
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {customerAccountCategoryOptions.map((category) => (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => setCustomerAccountCategory(category.id)}
                            className={`rounded-xl border px-3 py-2 text-[8px] font-black uppercase tracking-[0.18em] transition-all ${
                              customerAccountCategory === category.id
                                ? 'border-[#22c55e]/40 bg-[#22c55e]/10 text-[#7dffc1]'
                                : 'border-white/10 bg-black/20 text-white/30 hover:text-white'
                            }`}
                          >
                            {category.shortLabel}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <button 
                    onClick={() => {
                      setIsLoggedIn(false);
                      setUserRole(null);
                      setCustomerAccountCategory(null);
                      setCurrentCustomerProfileId(null);
                      setIsLoginPageOpen(false);
                    }}
                    className="w-full bg-red-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-red-600 transition-colors group"
                  >
                    <LogOut size={18} />
                    <span className="uppercase tracking-widest text-sm">Sign Out</span>
                  </button>
                </div>
                <button 
                  onClick={() => setIsLoginPageOpen(false)}
                  className="w-full bg-white/10 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
                >
                  <span className="uppercase tracking-widest text-sm">Return to Portal</span>
                </button>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[10px] uppercase tracking-widest text-center">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                      <input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/10 focus:outline-none focus:border-white/30 transition-colors"
                        placeholder="name@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                      <input 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/10 focus:outline-none focus:border-white/30 transition-colors"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>

                  {!isRegistering && (
                    <div className="flex justify-end">
                      <button type="button" className="text-[10px] uppercase tracking-widest text-white/30 hover:text-white transition-colors">
                        Forgot Password?
                      </button>
                    </div>
                  )}

                  {isRegistering ? (
                    <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Account Category</label>
                        <p className="mt-1 text-[10px] leading-relaxed text-white/30">
                          Studio tools, optical submissions, image generation, and tender access are reserved for member customer accounts.
                        </p>
                      </div>
                      <div className="grid gap-2">
                        {customerAccountCategoryOptions.map((category) => (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => setSelectedCustomerCategory(category.id)}
                            className={`rounded-xl border px-4 py-3 text-left transition-all ${
                              selectedCustomerCategory === category.id
                                ? 'border-[#22c55e]/40 bg-[#22c55e]/10 text-white'
                                : 'border-white/10 bg-black/20 text-white/50 hover:border-white/20 hover:text-white'
                            }`}
                          >
                            <span className="block text-[10px] font-black uppercase tracking-[0.24em]">
                              {category.label}
                            </span>
                            <span className="mt-1 block text-[10px] leading-relaxed text-white/35">
                              {category.description}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <button 
                    type="submit"
                    className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors group"
                  >
                    <span className="uppercase tracking-widest text-sm">
                      {isRegistering ? 'Register' : 'Sign In'}
                    </span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>

                {!isRegistering && (
                  <div className="mt-8 space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="h-[1px] flex-1 bg-white/10"></div>
                      <span className="text-[10px] uppercase tracking-widest text-white/20">Demo Access</span>
                      <div className="h-[1px] flex-1 bg-white/10"></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <button 
                        onClick={() => handleDemoLogin('customer', 'retail')}
                        className="flex flex-col items-center justify-center gap-1 bg-white/5 border border-white/10 py-3 rounded-xl hover:bg-white/10 transition-all hover:border-white/30 group"
                      >
                        <span className="text-[10px] uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">Customer</span>
                        <span className="text-[8px] uppercase tracking-widest text-white/20">Demo Login</span>
                      </button>
                      <button 
                        onClick={() => handleDemoLogin('employee')}
                        className="flex flex-col items-center justify-center gap-1 bg-white/5 border border-white/10 py-3 rounded-xl hover:bg-white/10 transition-all hover:border-white/30 group"
                      >
                        <span className="text-[10px] uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">Owner</span>
                        <span className="text-[8px] uppercase tracking-widest text-white/20">Demo Login</span>
                      </button>
                      <button 
                        onClick={() => void handleSupplierDemoLogin()}
                        disabled={isSupplierDemoLoading}
                        className="flex flex-col items-center justify-center gap-1 bg-white/5 border border-white/10 py-3 rounded-xl hover:bg-white/10 transition-all hover:border-white/30 group disabled:opacity-60"
                      >
                        <span className="text-[10px] uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">Supplier</span>
                        <span className="text-[8px] uppercase tracking-widest text-white/20">
                          {isSupplierDemoLoading ? 'Signing In' : 'Demo Login'}
                        </span>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        ['Architect', 'architect'],
                        ['Designer', 'interior_designer'],
                        ['Contractor', 'contractor'],
                        ['QS', 'quantity_surveyor'],
                      ].map(([label, category]) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => handleDemoLogin('customer', category as CustomerAccountCategory)}
                          className="flex flex-col items-center justify-center gap-1 rounded-xl border border-[#22c55e]/15 bg-[#22c55e]/5 py-3 transition-all hover:border-[#22c55e]/40 hover:bg-[#22c55e]/10"
                        >
                          <span className="text-[10px] uppercase tracking-widest text-[#7dffc1]">{label}</span>
                          <span className="text-[8px] uppercase tracking-widest text-white/25">Member</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-white/25 text-center pt-1">
                      Member demo accounts unlock Studio tools and tender access. Supplier demo uses the seeded Capestone vendor account.
                    </p>
                  </div>
                )}

                <div className="mt-8 flex items-center gap-4">
                  <div className="h-[1px] flex-1 bg-white/10"></div>
                  <span className="text-[10px] uppercase tracking-widest text-white/20">Or continue with</span>
                  <div className="h-[1px] flex-1 bg-white/10"></div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4">
                  <button className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <Chrome size={18} className="text-white" />
                    <span className="text-xs text-white font-medium">Google</span>
                  </button>
                  <button className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <Github size={18} className="text-white" />
                    <span className="text-xs text-white font-medium">GitHub</span>
                  </button>
                </div>

                <div className="mt-10 text-center">
                  <button 
                    onClick={() => setIsRegistering(!isRegistering)}
                    className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                  >
                    {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Register"}
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
