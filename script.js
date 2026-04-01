const fs = require('fs');
let content = fs.readFileSync('src/components/EmployeePortal.tsx', 'utf8');
const target = `      </div>
    </div>
  </motion.div>

  {/* React Flow Canvas */}`;
const replacement = `      </div>
    </div>

    {/* Footer Actions */}
    <div className="mt-auto border-t border-white/5 bg-black/40 p-3 shrink-0">
      <div className={\`grid \${isLibraryExpanded ? 'grid-cols-2 gap-2' : 'grid-cols-1 gap-3'} w-full\`}>
        <button 
          onClick={clearMap}
          className={\`flex items-center justify-center gap-2 p-2.5 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/5 text-white/40 hover:text-white transition-all group relative \${!isLibraryExpanded && 'w-10 h-10 mx-auto'}\`}
        >
          <Trash2 size={14} className="shrink-0 group-hover:scale-110 transition-transform" />
          {isLibraryExpanded && <span className="text-[10px] font-mono uppercase tracking-widest truncate">Clear</span>}
          {!isLibraryExpanded && (
            <div className="absolute left-full ml-3 px-3 py-2.5 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-lg opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-200 ease-out pointer-events-none whitespace-nowrap z-50 shadow-2xl shadow-black/50">
              <div className="absolute top-1/2 -left-[5px] -translate-y-1/2 w-2 h-2 bg-[#0a0a0a]/95 border-l border-b border-white/10 rotate-45" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/90">Clear Map</span>
            </div>
          )}
        </button>
        <button 
          onClick={saveChanges}
          className={\`flex items-center justify-center gap-2 p-2.5 rounded-xl border border-transparent hover:border-[#00ff88]/20 hover:bg-[#00ff88]/10 text-[#00ff88]/60 hover:text-[#00ff88] transition-all group relative \${!isLibraryExpanded && 'w-10 h-10 mx-auto'}\`}
        >
          <Save size={14} className="shrink-0 group-hover:scale-110 transition-transform" />
          {isLibraryExpanded && <span className="text-[10px] font-mono uppercase tracking-widest truncate">Save</span>}
          {!isLibraryExpanded && (
            <div className="absolute left-full ml-3 px-3 py-2.5 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-lg opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-200 ease-out pointer-events-none whitespace-nowrap z-50 shadow-2xl shadow-black/50">
              <div className="absolute top-1/2 -left-[5px] -translate-y-1/2 w-2 h-2 bg-[#0a0a0a]/95 border-l border-b border-white/10 rotate-45" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#00ff88]/90">Save Changes</span>
            </div>
          )}
        </button>
        <button 
          onClick={() => setIsMasterPromptOpen(true)}
          className={\`flex items-center justify-center gap-2 p-2.5 rounded-xl border border-transparent hover:border-purple-500/20 hover:bg-purple-500/10 text-purple-400/60 hover:text-purple-400 transition-all group relative \${!isLibraryExpanded && 'w-10 h-10 mx-auto'}\`}
        >
          <Terminal size={14} className="shrink-0 group-hover:scale-110 transition-transform" />
          {isLibraryExpanded && <span className="text-[10px] font-mono uppercase tracking-widest truncate">Prompt</span>}
          {!isLibraryExpanded && (
            <div className="absolute left-full ml-3 px-3 py-2.5 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-lg opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-200 ease-out pointer-events-none whitespace-nowrap z-50 shadow-2xl shadow-black/50">
              <div className="absolute top-1/2 -left-[5px] -translate-y-1/2 w-2 h-2 bg-[#0a0a0a]/95 border-l border-b border-white/10 rotate-45" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400/90">Master Prompt</span>
            </div>
          )}
        </button>
        <button 
          onClick={() => setIsViewingPortal(false)}
          className={\`flex items-center justify-center gap-2 p-2.5 rounded-xl border border-transparent hover:border-red-500/20 hover:bg-red-500/10 text-red-400/60 hover:text-red-400 transition-all group relative \${!isLibraryExpanded && 'w-10 h-10 mx-auto'}\`}
        >
          <LogOut size={14} className="shrink-0 group-hover:scale-110 transition-transform" />
          {isLibraryExpanded && <span className="text-[10px] font-mono uppercase tracking-widest truncate">Exit OS</span>}
          {!isLibraryExpanded && (
            <div className="absolute left-full ml-3 px-3 py-2.5 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-lg opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-200 ease-out pointer-events-none whitespace-nowrap z-50 shadow-2xl shadow-black/50">
              <div className="absolute top-1/2 -left-[5px] -translate-y-1/2 w-2 h-2 bg-[#0a0a0a]/95 border-l border-b border-white/10 rotate-45" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-red-400/90">Exit OS</span>
            </div>
          )}
        </button>
      </div>
    </div>
  </motion.div>

  {/* React Flow Canvas */}`;

content = content.replace(target, replacement);

const target2 = `  {/* Bottom Action Bar */}
  <div className="absolute bottom-8 left-8 z-40 flex gap-4">
  <button 
  onClick={clearMap}
  className="px-6 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-[10px] font-bold tracking-widest uppercase text-white/60 hover:text-white hover:bg-white/20 transition-all flex items-center gap-2"
  >
  <Trash2 size={14} /> Clear Map
  </button>
  <button 
  onClick={saveChanges}
  className="px-6 py-3 bg-[#00ff88]/10 border border-[#00ff88]/20 rounded-xl text-[10px] font-bold tracking-widest uppercase text-[#00ff88] hover:bg-[#00ff88]/20 transition-all flex items-center gap-2"
  >
  <Save size={14} /> Save Changes
  </button>
  <button 
  onClick={() => setIsMasterPromptOpen(true)}
  className="px-6 py-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-[10px] font-bold tracking-widest uppercase text-purple-400 hover:bg-purple-500/20 transition-all flex items-center gap-2"
  >
  <Terminal size={14} /> Master Prompt
  </button>
  <button onClick={() => setIsViewingPortal(false)} className="px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-bold tracking-widest uppercase text-red-400 hover:bg-red-500/20 transition-all flex items-center gap-2">
  <LogOut size={14} /> Exit OS
  </button>
  </div>`;

content = content.replace(target2, '');
fs.writeFileSync('src/components/EmployeePortal.tsx', content);
