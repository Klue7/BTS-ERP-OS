import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Briefcase, DraftingCompass, Brush, PenTool, Truck, ArrowRight, CheckCircle2 } from 'lucide-react';

interface CommunitySignupWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROLES = [
  { id: 'customer', label: 'Customer', icon: User, desc: 'Personal home projects' },
  { id: 'architect', label: 'Architect', icon: DraftingCompass, desc: 'Professional design & spec' },
  { id: 'designer', label: 'Interior Designer', icon: Brush, desc: 'Aesthetic curation' },
  { id: 'contractor', label: 'Contractor', icon: PenTool, desc: 'Building & installation' },
  { id: 'reseller', label: 'Re-Seller', icon: Briefcase, desc: 'Retail & distribution' },
  { id: 'supplier', label: 'Supplier', icon: Truck, desc: 'Materials & fulfillment' }
];

export function CommunitySignupWizard({ isOpen, onClose }: CommunitySignupWizardProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    role: '',
    name: '',
    email: '',
    phone: '',
    company: ''
  });

  const handleNext = () => setStep(prev => Math.min(prev + 1, 3));
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));
  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep(1);
      setFormData({ role: '', name: '', email: '', phone: '', company: '' });
    }, 500); // reset after exit animation
  };

  const isProfessional = formData.role !== 'customer' && formData.role !== '';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" style={{ pointerEvents: 'auto' }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(20px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0 }}
            className="relative w-full max-w-2xl bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-2xl md:rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest font-bold text-[#22c55e]">
                  Join the Community
                </span>
                <span className="text-sm text-white/50">
                  Step {step} of 3
                </span>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 md:p-8 min-h-[400px]">
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col gap-6"
                >
                  <div>
                    <h3 className="text-2xl font-light text-white mb-2">How do you interact with us?</h3>
                    <p className="text-white/50 text-sm">Select the profile type that best describes your needs to unlock specific community features.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    {ROLES.map((role) => {
                      const Icon = role.icon;
                      const isActive = formData.role === role.id;
                      return (
                        <button
                          key={role.id}
                          onClick={() => setFormData({ ...formData, role: role.id })}
                          className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
                            isActive 
                              ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                              : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/50'}`}>
                            <Icon size={20} />
                          </div>
                          <h4 className={`font-medium mb-1 ${isActive ? 'text-white' : 'text-white/80'}`}>{role.label}</h4>
                          <p className="text-xs text-white/40">{role.desc}</p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-auto pt-8 flex justify-end">
                    <button
                      disabled={!formData.role}
                      onClick={handleNext}
                      className="px-8 py-3 rounded-xl bg-white text-black font-bold uppercase tracking-wider text-xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/90 transition-colors"
                    >
                      Next Step <ArrowRight size={16} />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col gap-6 h-full"
                >
                  <div>
                    <h3 className="text-2xl font-light text-white mb-2">Let's get your details</h3>
                    <p className="text-white/50 text-sm">Create your {ROLES.find(r => r.id === formData.role)?.label} profile.</p>
                  </div>

                  <div className="space-y-4 max-w-md w-full mt-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                        placeholder="john@example.com"
                      />
                    </div>
                    {isProfessional && (
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-2">Company Name</label>
                        <input
                          type="text"
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                          placeholder="Your Business Ltd."
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-auto pt-8 flex justify-between">
                    <button
                      onClick={handleBack}
                      className="px-8 py-3 rounded-xl border border-white/10 text-white font-bold uppercase tracking-wider text-xs hover:bg-white/5 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      disabled={!formData.name || !formData.email || (isProfessional && !formData.company)}
                      onClick={handleNext}
                      className="px-8 py-3 rounded-xl bg-[#22c55e] text-black font-bold uppercase tracking-wider text-xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#22c55e]/90 transition-colors shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                    >
                      Complete Profile <CheckCircle2 size={16} />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center text-center h-full pt-12 gap-6"
                >
                  <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                    <CheckCircle2 size={48} className="text-emerald-400" />
                  </div>
                  <h3 className="text-3xl font-light text-white">Welcome aboard!</h3>
                  <p className="text-white/50 max-w-sm">
                    Your {ROLES.find(r => r.id === formData.role)?.label} profile has been successfully created. We'll be in touch shortly with your access credentials.
                  </p>
                  
                  <button
                    onClick={handleClose}
                    className="mt-8 px-8 py-4 rounded-xl bg-white text-black font-bold uppercase tracking-wider text-xs hover:bg-white/90 transition-colors w-full sm:w-auto"
                  >
                    Return to Home
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
