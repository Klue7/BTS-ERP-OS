import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, User, LogOut, LayoutDashboard, ChevronDown, Sparkles, Menu, X } from 'lucide-react';
import { useVisualLab } from './VisualLabContext';
import { motion, AnimatePresence } from 'motion/react';

export function NavigationBar() {
  const { setIsLoginPageOpen, isLoggedIn, userRole, setIsLoggedIn, setUserRole, cart, setIsCartWizardOpen } = useVisualLab();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleUserClick = () => {
    if (isLoggedIn) {
      setIsDropdownOpen(!isDropdownOpen);
    } else {
      setIsLoginPageOpen(true);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const handleViewPortal = () => {
    navigate('/portal');
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  const isCustomize = location.pathname.startsWith('/customize');
  const isCommunity = location.pathname === '/community';
  const activeColorClass = 'text-[#22c55e]';
  const hoverColorClass = 'hover:text-[#22c55e]';
  const bgClass = 'bg-[#22c55e]';

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50 px-6 md:px-16 py-8 flex justify-between items-center backdrop-blur-xl bg-black/40 border-b border-white/[0.03] shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
        {/* Logo */}
        <Link 
          to="/"
          className="flex items-center gap-3 cursor-pointer z-50" 
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <svg viewBox="0 0 100 100" className="w-8 h-8 md:w-10 md:h-10" fill="none" strokeWidth="6" strokeLinecap="square">
            <g className="text-gray-400" stroke="currentColor">
              <line x1="40" y1="10" x2="10" y2="40" />
              <line x1="50" y1="20" x2="20" y2="50" />
              <line x1="60" y1="30" x2="30" y2="60" />
              <line x1="70" y1="40" x2="40" y2="70" />
              <polyline points="50,10 90,50 50,90" />
            </g>
            <g className="text-white" stroke="currentColor">
              <polygon points="40,30 70,60 40,90 10,60" />
              <polygon points="40,70 55,85 40,100 25,85" />
            </g>
          </svg>
          <div className="flex flex-col justify-center items-start">
            <span className="font-serif text-xl md:text-2xl leading-none tracking-widest font-bold text-white">BRICK</span>
            <span className="font-serif text-[0.5rem] md:text-[0.6rem] leading-none tracking-widest font-bold mt-[2px] text-white">TILE SHOP</span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex gap-8 items-center">
          <Link to="/" className={`text-sm font-medium transition-colors ${location.pathname === '/' ? activeColorClass : `text-white/80 ${hoverColorClass}`}`}>Home</Link>
          <Link to="/products" className={`text-sm font-medium transition-colors ${location.pathname === '/products' ? activeColorClass : `text-white/80 ${hoverColorClass}`}`}>Products</Link>
          <Link to="/community" className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${location.pathname === '/community' ? activeColorClass : `text-white/80 ${hoverColorClass}`}`}>
            <Sparkles size={14} />
            Community
          </Link>
          <Link to="/customize" className={`text-sm font-medium transition-colors ${location.pathname === '/customize' ? activeColorClass : `text-white/80 ${hoverColorClass}`}`}>Studio</Link>
        </div>

        {/* Icons & Mobile Menu Toggle */}
        <div className="flex gap-4 md:gap-6 items-center relative z-50">
          <button className={`text-white transition-colors ${hoverColorClass} hidden sm:block`}>
            <Search size={20} />
          </button>
          <button 
            className={`text-white transition-colors relative ${hoverColorClass}`}
            onClick={() => setIsCartWizardOpen(true)}
          >
            <ShoppingCart size={20} />
            {cart.length > 0 && (
              <span className={`absolute -top-2 -right-2 w-4 h-4 rounded-full text-[10px] flex items-center justify-center text-white font-bold ${bgClass}`}>
                {cart.length}
              </span>
            )}
          </button>
          
          <div className="relative hidden md:block">
            <button 
              onClick={handleUserClick}
              className={`text-white transition-colors flex items-center gap-2 ${hoverColorClass}`}
            >
              <User size={20} className={isLoggedIn ? (userRole === 'employee' ? "text-blue-400" : "text-green-400") : ""} />
              {isLoggedIn && (
                <>
                  <span className="text-[10px] uppercase tracking-widest hidden sm:inline">
                    {userRole === 'employee' ? 'Employee' : 'Customer'}
                  </span>
                  <ChevronDown size={12} className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>

            <AnimatePresence>
              {isLoggedIn && isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-4 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50"
                >
                  <div className="p-2">
                    <button 
                      onClick={handleViewPortal}
                      className="w-full flex items-center gap-3 px-4 py-3 text-[10px] uppercase tracking-widest text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    >
                      <LayoutDashboard size={14} />
                      View Portal
                    </button>
                    <div className="h-px bg-white/5 my-1"></div>
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-[10px] uppercase tracking-widest text-red-400 hover:text-red-300 hover:bg-red-500/5 rounded-lg transition-all"
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-white p-1"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(40px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            className="fixed inset-0 z-40 bg-black/80 pt-32 px-12 pb-12 flex flex-col"
          >
            <div className="flex flex-col gap-6 text-2xl font-serif tracking-wide">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className={location.pathname === '/' ? activeColorClass : 'text-white'}>Home</Link>
              <Link to="/products" onClick={() => setIsMobileMenuOpen(false)} className={location.pathname === '/products' ? activeColorClass : 'text-white'}>Products</Link>
              <Link to="/community" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 ${location.pathname === '/community' ? activeColorClass : 'text-white'}`}>
                <Sparkles size={24} /> Community
              </Link>
              <Link to="/customize" onClick={() => setIsMobileMenuOpen(false)} className={location.pathname === '/customize' ? activeColorClass : 'text-white'}>Studio</Link>
            </div>

            <div className="mt-auto pt-8 border-t border-white/10 flex flex-col gap-4">
              {isLoggedIn ? (
                <>
                  <div className="flex items-center gap-3 text-white/60 text-sm uppercase tracking-widest mb-2">
                    <User size={16} className={userRole === 'employee' ? "text-blue-400" : "text-green-400"} />
                    Logged in as {userRole}
                  </div>
                  <button 
                    onClick={handleViewPortal}
                    className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-white/5 text-white rounded-xl font-bold uppercase tracking-widest text-sm"
                  >
                    <LayoutDashboard size={18} />
                    View Portal
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-red-500/10 text-red-400 rounded-xl font-bold uppercase tracking-widest text-sm"
                  >
                    <LogOut size={18} />
                    Sign Out
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsLoginPageOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-[#22c55e] text-black rounded-xl font-bold uppercase tracking-widest text-sm"
                >
                  <User size={18} />
                  Sign In
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
