import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Upload, FileText, CheckCircle2, AlertCircle, Clock, 
  Search, Filter, ChevronRight, Building2, MapPin, Calendar, 
  MoreHorizontal, Play, Save, X, FileSpreadsheet, Send, Link as LinkIcon,
  Wand2, AlertTriangle, ArrowRight, User, Tag, Quote, ExternalLink, Globe, Activity, Mail
} from 'lucide-react';

// Mock Data
const MOCK_TENDERS = [
  { id: 'TND-001', source: 'L2B', type: 'Commercial', client: 'Apex Developers', title: 'Skyline Office Park Phase 2', location: 'London, UK', closeDate: '2026-04-15', boqStatus: 'Parsed', owner: 'Sarah J.', stage: 'Quoting', value: '$120k' },
  { id: 'TND-002', source: 'Direct', type: 'Residential', client: 'Oakwood Homes', title: 'Greenfield Estate 50 Units', location: 'Manchester, UK', closeDate: '2026-04-02', boqStatus: 'Pending Review', owner: 'Mike R.', stage: 'BOQ Review', value: '$85k' },
  { id: 'TND-003', source: 'GovProcure', type: 'Public', client: 'City Council', title: 'Community Center Renovation', location: 'Birmingham, UK', closeDate: '2026-05-10', boqStatus: 'Missing', owner: 'Unassigned', stage: 'Intake', value: 'TBD' },
];

const MOCK_BOQS = [
  { id: 'BOQ-001', tenderId: 'TND-001', tenderTitle: 'Skyline Office Park', status: 'Mapped', totalLines: 145, mappedLines: 140, unmappedLines: 0, ambiguousLines: 5, uploadedAt: '2 hours ago' },
  { id: 'BOQ-002', tenderId: 'TND-002', tenderTitle: 'Greenfield Estate', status: 'Review Needed', totalLines: 82, mappedLines: 40, unmappedLines: 20, ambiguousLines: 22, uploadedAt: '1 day ago' },
];

const MOCK_QUOTES = [
  { id: 'QT-9001', tenderId: 'TND-001', tenderTitle: 'Skyline Office Park', status: 'Draft', value: '$124,500', margin: '32%', lastUpdated: '1 hour ago' },
  { id: 'QT-9002', tenderId: 'TND-004', tenderTitle: 'Riverside Apartments', status: 'Ready for Review', value: '$45,200', margin: '28%', lastUpdated: 'Yesterday' },
];

const MOCK_SUBMISSIONS = [
  { id: 'SUB-001', tenderId: 'TND-005', tenderTitle: 'Central Station Upgrade', status: 'Submitted', submittedAt: '2026-03-20', responseExpected: '2026-04-05' },
  { id: 'SUB-002', tenderId: 'TND-006', tenderTitle: 'Harbor View Hotel', status: 'Clarification Requested', submittedAt: '2026-03-15', responseExpected: 'Immediate Action' },
];

const TendersOverview = () => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[
        { label: 'Active Tenders', value: '24', icon: Building2, color: 'text-blue-400' },
        { label: 'BOQs to Review', value: '7', icon: FileSpreadsheet, color: 'text-amber-400' },
        { label: 'Draft Quotes', value: '12', icon: FileText, color: 'text-purple-400' },
        { label: 'Submissions Due (7d)', value: '3', icon: Clock, color: 'text-red-400' },
      ].map((stat, i) => (
        <div key={i} className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2 bg-white/5 rounded-lg ${stat.color} group-hover:bg-white/10 transition-colors`}>
              <stat.icon size={16} />
            </div>
          </div>
          <div className="text-3xl font-bold font-mono tracking-tighter mb-1 text-white">{stat.value}</div>
          <div className="text-[10px] uppercase tracking-widest text-white/40">{stat.label}</div>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/60">Recent Opportunities</h3>
          <button className="text-[10px] text-[#00ff88] uppercase tracking-widest hover:underline font-bold">View All</button>
        </div>
        <div className="divide-y divide-white/5">
          {MOCK_TENDERS.slice(0, 3).map((tender) => (
            <div key={tender.id} className="p-6 hover:bg-white/[0.02] transition-colors flex items-center justify-between group">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded bg-white/5 text-[8px] font-mono text-white/40 uppercase">{tender.source}</span>
                  <span className="text-sm font-bold text-white group-hover:text-[#00ff88] transition-colors">{tender.title}</span>
                </div>
                <div className="text-[10px] text-white/40 flex items-center gap-4">
                  <span className="flex items-center gap-1"><Building2 size={10} /> {tender.client}</span>
                  <span className="flex items-center gap-1"><Clock size={10} /> Closes: {tender.closeDate}</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-white/20 group-hover:text-white transition-colors" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/60">Action Required</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4 p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl">
            <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-bold text-amber-400 mb-1">BOQ Ambiguities Detected</div>
              <div className="text-[10px] text-white/60 leading-relaxed mb-3">Greenfield Estate BOQ has 22 lines with unclear material specifications. Manual review required before quoting.</div>
              <button className="text-[10px] font-bold uppercase tracking-widest text-amber-400 hover:text-amber-300">Review BOQ &rarr;</button>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
            <Clock size={16} className="text-red-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-bold text-red-400 mb-1">Submission Due Tomorrow</div>
              <div className="text-[10px] text-white/60 leading-relaxed mb-3">Central Station Upgrade tender closes in 24 hours. Quote is still in draft state.</div>
              <button className="text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-300">Finalize Quote &rarr;</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const TendersOpportunities = ({ onOpenBOQ, onOpenQuote }: any) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div className="flex gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input 
            type="text" 
            placeholder="Search tenders, clients, or references..." 
            className="bg-[#0f0f0f] border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00ff88]/30 w-80 transition-all" 
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#0f0f0f] border border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white hover:border-white/10 transition-all">
          <Filter size={14} /> Filter
        </button>
      </div>
      <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest text-white/30 font-bold">
        <span>Showing {MOCK_TENDERS.length} Opportunities</span>
      </div>
    </div>

    <div className="space-y-3">
      {MOCK_TENDERS.map(tender => (
        <motion.div 
          key={tender.id} 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-6 hover:border-[#00ff88]/30 transition-all group relative overflow-hidden"
        >
          {/* Subtle background glow on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#00ff88]/0 to-[#00ff88]/0 group-hover:from-[#00ff88]/[0.02] group-hover:to-transparent transition-all pointer-events-none" />
          
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Main Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-white/40 uppercase tracking-wider">{tender.id}</span>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[9px] font-bold text-blue-400 uppercase tracking-widest">
                  <Globe size={10} /> {tender.source}
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-bold text-white/60 uppercase tracking-widest">
                  <Tag size={10} /> {tender.type}
                </div>
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-widest ${
                  tender.stage === 'Quoting' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                  tender.stage === 'BOQ Review' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                  'bg-white/5 border-white/10 text-white/40'
                }`}>
                  <Activity size={10} /> {tender.stage}
                </div>
              </div>
              
              <h3 className="text-xl font-serif font-bold text-white mb-3 group-hover:text-[#00ff88] transition-colors truncate">
                {tender.title}
              </h3>
              
              <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-[11px] text-white/40 font-medium">
                <span className="flex items-center gap-2"><Building2 size={14} className="text-white/20" /> {tender.client}</span>
                <span className="flex items-center gap-2"><MapPin size={14} className="text-white/20" /> {tender.location}</span>
                <span className="flex items-center gap-2 font-mono text-amber-400/80"><Clock size={14} /> Closes: {tender.closeDate}</span>
              </div>
            </div>

            {/* Status & Owner */}
            <div className="flex items-center gap-12 px-8 border-l border-white/5 hidden xl:flex">
              <div className="w-32">
                <div className="text-[9px] uppercase tracking-widest text-white/20 mb-1.5 font-bold">BOQ Status</div>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    tender.boqStatus === 'Parsed' ? 'bg-[#00ff88] shadow-[0_0_5px_rgba(0,255,136,0.3)]' :
                    tender.boqStatus === 'Pending Review' ? 'bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.3)]' : 'bg-red-500'
                  }`} />
                  <span className={`text-[11px] font-bold ${
                    tender.boqStatus === 'Parsed' ? 'text-white' :
                    tender.boqStatus === 'Pending Review' ? 'text-amber-400' : 'text-red-400'
                  }`}>{tender.boqStatus}</span>
                </div>
              </div>
              
              <div className="w-32">
                <div className="text-[9px] uppercase tracking-widest text-white/20 mb-1.5 font-bold">Project Owner</div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <User size={10} className="text-white/40" />
                  </div>
                  <span className="text-[11px] text-white font-medium">{tender.owner}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pl-6 border-l border-white/5">
              <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all group/btn" title="Open Project">
                <ExternalLink size={16} className="group-hover/btn:scale-110 transition-transform" />
              </button>
              <button 
                onClick={onOpenBOQ} 
                className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/10 hover:border-white/20 transition-all"
              >
                <FileSpreadsheet size={14} className="text-white/40" /> BOQ
              </button>
              <button 
                onClick={onOpenQuote} 
                className="flex items-center gap-2 px-5 py-3 bg-[#00ff88]/10 border border-[#00ff88]/20 rounded-xl text-[10px] font-bold uppercase tracking-widest text-[#00ff88] hover:bg-[#00ff88]/20 transition-all shadow-[0_0_15px_rgba(0,255,136,0.05)]"
              >
                <Quote size={14} /> Quote
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

const TendersBOQDesk = ({ onUpload }: any) => (
  <div className="space-y-8">
    {/* Desk Header / Stats */}
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#0f0f0f] border border-white/5 rounded-2xl p-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#00ff88]/[0.02] blur-3xl rounded-full -mr-32 -mt-32" />
      
      <div className="relative">
        <h2 className="text-2xl font-serif font-bold text-white mb-1">BOQ Processing Desk</h2>
        <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Operator Workspace & Material Mapping</p>
      </div>

      <div className="relative flex items-center gap-8">
        <div className="flex gap-8 px-8 border-x border-white/5">
          <div className="text-center">
            <div className="text-2xl font-bold font-mono text-white tracking-tighter">14</div>
            <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Active BOQs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold font-mono text-amber-400 tracking-tighter">32</div>
            <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Review Required</div>
          </div>
        </div>
        <button 
          onClick={onUpload} 
          className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-2"
        >
          <Upload size={14} className="text-[#00ff88]" /> Upload New BOQ
        </button>
      </div>
    </div>

    {/* BOQ Workspace Grid */}
    <div className="grid grid-cols-1 gap-4">
      {MOCK_BOQS.map(boq => (
        <motion.div 
          key={boq.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all group"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            {/* BOQ Identity */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/5 rounded-lg text-white/40 group-hover:text-[#00ff88] transition-colors">
                  <FileSpreadsheet size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white truncate">{boq.tenderTitle}</h3>
                    <span className="text-[9px] font-mono text-white/20 uppercase tracking-wider">{boq.id}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-white/40">Uploaded {boq.uploadedAt}</span>
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[8px] font-bold uppercase tracking-widest ${
                      boq.status === 'Mapped' ? 'bg-[#00ff88]/10 border-[#00ff88]/20 text-[#00ff88]' :
                      'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    }`}>
                      <div className={`w-1 h-1 rounded-full ${boq.status === 'Mapped' ? 'bg-[#00ff88]' : 'bg-amber-400'}`} />
                      {boq.status}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mapping Metrics - The "Desk" Data */}
            <div className="flex items-center gap-12 px-8 border-x border-white/5">
              <div className="grid grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-xl font-bold font-mono text-white tracking-tighter">{boq.totalLines}</div>
                  <div className="text-[8px] uppercase tracking-widest text-white/20 font-bold">Total Lines</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold font-mono text-[#00ff88] tracking-tighter">{boq.mappedLines}</div>
                  <div className="text-[8px] uppercase tracking-widest text-white/20 font-bold">Mapped</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold font-mono text-amber-400 tracking-tighter">{boq.ambiguousLines}</div>
                  <div className="text-[8px] uppercase tracking-widest text-white/20 font-bold">Ambiguous</div>
                </div>
              </div>
            </div>

            {/* Action Required Flags */}
            <div className="flex-1 max-w-xs">
              <div className="space-y-2">
                {boq.ambiguousLines > 0 && (
                  <div className="flex items-center gap-2 text-[10px] text-amber-400 font-bold bg-amber-400/5 border border-amber-400/10 px-3 py-1.5 rounded-lg">
                    <AlertTriangle size={12} />
                    <span>{boq.ambiguousLines} Manual Reviews Needed</span>
                  </div>
                )}
                {boq.unmappedLines > 0 && (
                  <div className="flex items-center gap-2 text-[10px] text-red-400 font-bold bg-red-400/5 border border-red-400/10 px-3 py-1.5 rounded-lg">
                    <AlertCircle size={12} />
                    <span>{boq.unmappedLines} Missing Product Matches</span>
                  </div>
                )}
                {boq.status === 'Mapped' && boq.unmappedLines === 0 && (
                  <div className="flex items-center gap-2 text-[10px] text-[#00ff88] font-bold bg-[#00ff88]/5 border border-[#00ff88]/10 px-3 py-1.5 rounded-lg">
                    <CheckCircle2 size={12} />
                    <span>Ready for Quote Generation</span>
                  </div>
                )}
              </div>
            </div>

            {/* Workspace Entry */}
            <div className="flex items-center gap-2">
              <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-2 group/btn">
                Open Workspace <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>

    {/* Empty State / Dropzone Placeholder */}
    <div className="border-2 border-dashed border-white/5 rounded-3xl p-12 flex flex-col items-center justify-center text-center hover:border-[#00ff88]/20 transition-all cursor-pointer group">
      <div className="p-4 bg-white/5 rounded-full text-white/20 group-hover:text-[#00ff88] group-hover:bg-[#00ff88]/5 transition-all mb-4">
        <Upload size={32} />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">Drop new BOQ file here</h3>
      <p className="text-xs text-white/40 max-w-xs mx-auto">Support for .xlsx, .csv, and .pdf formats. Automated parsing will begin immediately upon upload.</p>
    </div>
  </div>
);

const TendersQuoteDesk = ({ onGenerate }: any) => (
  <div className="space-y-8">
    {/* Desk Header */}
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#0f0f0f] border border-white/5 rounded-2xl p-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/[0.02] blur-3xl rounded-full -mr-32 -mt-32" />
      
      <div className="relative">
        <h2 className="text-2xl font-serif font-bold text-white mb-1">Quote Generation Desk</h2>
        <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Drafting, Pricing & Margin Analysis</p>
      </div>

      <div className="relative flex items-center gap-4">
        <button 
          onClick={onGenerate} 
          className="px-6 py-3 bg-[#00ff88]/10 border border-[#00ff88]/20 rounded-xl text-[10px] font-bold uppercase tracking-widest text-[#00ff88] hover:bg-[#00ff88]/20 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,136,0.05)]"
        >
          <Wand2 size={14} /> Auto-Draft from BOQ
        </button>
      </div>
    </div>

    {/* Quote List */}
    <div className="space-y-6">
      {MOCK_QUOTES.map(quote => (
        <motion.div 
          key={quote.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0f0f0f] border border-white/5 rounded-2xl overflow-hidden group hover:border-white/10 transition-all"
        >
          {/* Quote Header */}
          <div className="p-6 border-b border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/[0.01]">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/5 rounded-xl text-white/40 group-hover:text-purple-400 transition-colors">
                <Quote size={20} />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-bold text-white">{quote.tenderTitle}</h3>
                  <span className="text-[10px] font-mono text-white/20 uppercase tracking-wider">{quote.id}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-white/40 font-medium flex items-center gap-1.5">
                    <Clock size={12} /> Updated {quote.lastUpdated}
                  </span>
                  <div className={`px-2 py-0.5 rounded border text-[8px] font-bold uppercase tracking-widest ${
                    quote.status === 'Ready for Review' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                    'bg-white/5 border-white/10 text-white/40'
                  }`}>
                    {quote.status}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="text-right">
                <div className="text-[9px] uppercase tracking-widest text-white/20 mb-1 font-bold">Est. Value</div>
                <div className="text-xl font-bold font-mono text-white tracking-tighter">{quote.value}</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] uppercase tracking-widest text-white/20 mb-1 font-bold">Net Margin</div>
                <div className="text-xl font-bold font-mono text-[#00ff88] tracking-tighter">{quote.margin}</div>
              </div>
              <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all">
                Edit Draft
              </button>
            </div>
          </div>

          {/* Quote Details Grid */}
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Mapped Materials */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Mapped Materials & BOQ Lines</h4>
                <span className="text-[10px] text-white/20">12 Items Mapped</span>
              </div>
              <div className="bg-black/40 rounded-xl border border-white/5 overflow-hidden">
                <table className="w-full text-left text-[10px]">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <th className="px-4 py-3 font-bold uppercase tracking-widest text-white/20">BOQ Description</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-widest text-white/20">BTS Product Match</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-widest text-white/20 text-right">Qty</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-widest text-white/20 text-right">Unit Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[
                      { boq: 'Face Brick - Red Rustic', bts: 'Heritage Red Multi', qty: '12,500', cost: '$0.82' },
                      { boq: 'Mortar - Dark Grey', bts: 'Premium Anthracite Mortar', qty: '45 Bags', cost: '$12.50' },
                      { boq: 'Wall Ties - Stainless', bts: 'Standard 225mm Ties', qty: '500', cost: '$0.45' },
                    ].map((item, i) => (
                      <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                        <td className="px-4 py-3 text-white/60">{item.boq}</td>
                        <td className="px-4 py-3 text-[#00ff88] font-medium">{item.bts}</td>
                        <td className="px-4 py-3 text-right font-mono text-white/60">{item.qty}</td>
                        <td className="px-4 py-3 text-right font-mono text-white/60">{item.cost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-3 bg-white/[0.01] text-center border-t border-white/5">
                  <button className="text-[9px] uppercase tracking-widest text-white/30 hover:text-white transition-colors font-bold">View All 12 Items &rarr;</button>
                </div>
              </div>
            </div>

            {/* Exclusions & Notes */}
            <div className="space-y-6">
              <div>
                <h4 className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-3">Exclusions & Assumptions</h4>
                <div className="space-y-2">
                  {[
                    'Delivery to site included (standard access)',
                    'Offloading by others',
                    'Subject to stock availability at time of order',
                    'Valid for 30 days'
                  ].map((note, i) => (
                    <div key={i} className="flex items-start gap-2 text-[10px] text-white/60 leading-relaxed">
                      <div className="w-1 h-1 rounded-full bg-white/20 mt-1.5 shrink-0" />
                      {note}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                <h4 className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-3">Margin Preview</h4>
                <div className="bg-black/40 rounded-xl border border-white/5 p-4 space-y-3">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/40">Product Cost</span>
                    <span className="text-white font-mono">$84,200.00</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/40">Logistics Est.</span>
                    <span className="text-white font-mono">$4,500.00</span>
                  </div>
                  <div className="h-px bg-white/5" />
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-white">Total Cost</span>
                    <span className="text-white font-mono">$88,700.00</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold text-[#00ff88]">
                    <span>Net Margin (32%)</span>
                    <span className="font-mono">+$35,800.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

const TendersSubmissionTracker = ({ onSubmit }: any) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-bold text-white">Submission Tracker</h2>
      <button onClick={onSubmit} className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all flex items-center gap-2">
        <Send size={14} /> New Submission
      </button>
    </div>

    <div className="grid grid-cols-1 gap-4">
      {MOCK_SUBMISSIONS.map(sub => (
        <div key={sub.id} className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-white/10 transition-all group">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{sub.tenderTitle}</span>
              <span className="text-[10px] font-mono text-white/40">{sub.id}</span>
            </div>
            <div className="text-[10px] text-white/40 flex items-center gap-4">
              <span>Submitted: {sub.submittedAt}</span>
              <span className={`px-2 py-0.5 rounded border text-[8px] font-bold uppercase tracking-widest ${
                sub.status === 'Clarification Requested' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                'bg-[#00ff88]/10 border-[#00ff88]/20 text-[#00ff88]'
              }`}>{sub.status}</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Response Expected</div>
              <div className={`text-xs font-bold ${sub.responseExpected === 'Immediate Action' ? 'text-amber-400' : 'text-white'}`}>{sub.responseExpected}</div>
            </div>
            <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all">
              Update Status
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// --- WIZARDS ---

const WizardModal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-3xl bg-[#0a0a0a] border border-white/[0.08] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
          <h2 className="text-xl font-serif font-bold text-white tracking-tight">{title}</h2>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

const NewTenderWizard = ({ onClose }: any) => {
  const [step, setStep] = useState(1);
  return (
    <WizardModal isOpen={true} onClose={onClose} title="New Tender Intake">
      <div className="space-y-8">
        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {[
            { num: 1, label: 'Core Details' },
            { num: 2, label: 'Documents' },
            { num: 3, label: 'Assignment' }
          ].map((s, i) => (
            <div key={s.num} className="flex flex-col items-center gap-2 flex-1 relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-colors ${step >= s.num ? 'bg-[#00ff88] text-black shadow-[0_0_10px_rgba(0,255,136,0.15)]' : 'bg-[#0f0f0f] border border-white/10 text-white/40'}`}>
                {step > s.num ? <CheckCircle2 size={14} /> : s.num}
              </div>
              <span className={`text-[10px] uppercase tracking-widest font-bold ${step >= s.num ? 'text-white' : 'text-white/40'}`}>{s.label}</span>
              {i < 2 && <div className={`absolute top-4 left-1/2 w-full h-px -z-0 ${step > s.num ? 'bg-[#00ff88]/30' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Source Type</label>
                  <select className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00ff88]/50 transition-colors">
                    <option>Manual Entry</option>
                    <option>Leads2Business Connector</option>
                    <option>GovProcure Portal</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Project Type</label>
                  <select className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00ff88]/50 transition-colors">
                    <option>Commercial</option>
                    <option>Residential</option>
                    <option>Public / Infrastructure</option>
                  </select>
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Project Title</label>
                  <input type="text" className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00ff88]/50 transition-colors" placeholder="e.g. Skyline Office Park Phase 2" />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Client / Authority</label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                    <input type="text" className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#00ff88]/50 transition-colors" placeholder="Search existing clients or enter new..." />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Close Date</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                    <input type="date" className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#00ff88]/50 transition-colors" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Expected Award Date</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                    <input type="date" className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#00ff88]/50 transition-colors" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Tender Documents</label>
                <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center hover:border-[#00ff88]/30 hover:bg-[#00ff88]/5 transition-all cursor-pointer group">
                  <div className="p-4 bg-white/5 rounded-full text-white/20 group-hover:text-[#00ff88] group-hover:bg-[#00ff88]/10 transition-all mb-4">
                    <Upload size={24} />
                  </div>
                  <div className="text-sm font-bold text-white mb-1">Drag & Drop Files</div>
                  <div className="text-[10px] text-white/40 uppercase tracking-widest">PDF, Excel, Word (Max 50MB)</div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between border-b border-white/5 pb-4">
                  <span className="text-xs text-white/40 uppercase tracking-widest font-bold">Project</span>
                  <span className="text-sm font-bold text-white">Skyline Office Park Phase 2</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-4">
                  <span className="text-xs text-white/40 uppercase tracking-widest font-bold">Client</span>
                  <span className="text-sm font-bold text-white">Apex Developers</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-white/40 uppercase tracking-widest font-bold">Close Date</span>
                  <span className="text-sm font-bold text-amber-400">2026-04-15</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Assign Project Owner</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                  <select className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#00ff88]/50 transition-colors appearance-none">
                    <option>Sarah J. (Senior Estimator)</option>
                    <option>Mike R. (Commercial Manager)</option>
                    <option>Unassigned</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between pt-6 border-t border-white/5 mt-8">
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)} className="px-6 py-3 bg-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all">Back</button>
          ) : <div />}
          
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)} className="px-6 py-3 bg-[#00ff88] text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#00cc6e] transition-all flex items-center gap-2 shadow-[0_0_10px_rgba(0,255,136,0.15)]">Next <ArrowRight size={14} /></button>
          ) : (
            <button onClick={onClose} className="px-6 py-3 bg-[#00ff88] text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#00cc6e] transition-all flex items-center gap-2 shadow-[0_0_10px_rgba(0,255,136,0.15)]"><Save size={14} /> Intake Tender</button>
          )}
        </div>
      </div>
    </WizardModal>
  );
};

const BOQUploadWizard = ({ onClose }: any) => {
  const [step, setStep] = useState(1);
  return (
    <WizardModal isOpen={true} onClose={onClose} title="BOQ Processing">
      <div className="space-y-8">
        <div className="flex items-center justify-between mb-8">
          {[
            { num: 1, label: 'Upload & Parse' },
            { num: 2, label: 'Line Mapping' },
            { num: 3, label: 'Review' }
          ].map((s, i) => (
            <div key={s.num} className="flex flex-col items-center gap-2 flex-1 relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-colors ${step >= s.num ? 'bg-amber-400 text-black shadow-[0_0_10px_rgba(251,191,36,0.15)]' : 'bg-[#0f0f0f] border border-white/10 text-white/40'}`}>
                {step > s.num ? <CheckCircle2 size={14} /> : s.num}
              </div>
              <span className={`text-[10px] uppercase tracking-widest font-bold ${step >= s.num ? 'text-white' : 'text-white/40'}`}>{s.label}</span>
              {i < 2 && <div className={`absolute top-4 left-1/2 w-full h-px -z-0 ${step > s.num ? 'bg-amber-400/30' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="p-10 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center hover:border-amber-400/30 hover:bg-amber-400/5 transition-all cursor-pointer group">
                <div className="p-4 bg-white/5 rounded-full text-white/20 group-hover:text-amber-400 group-hover:bg-amber-400/10 transition-all mb-4">
                  <FileSpreadsheet size={32} />
                </div>
                <div className="text-base font-bold text-white mb-2">Drop BOQ Excel/PDF</div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest">Will be parsed automatically</div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Parsing Engine</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-xl border border-amber-400/30 bg-amber-400/5 cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 blur-xl rounded-full -mr-12 -mt-12" />
                    <div className="flex items-center justify-between mb-2 relative">
                      <span className="text-sm font-bold text-amber-400">AI Assisted</span>
                      <Wand2 size={16} className="text-amber-400" />
                    </div>
                    <div className="text-[10px] text-white/50 relative">Auto-maps lines to BTS catalog using semantic matching.</div>
                  </div>
                  <div className="p-5 rounded-xl border border-white/10 bg-[#0f0f0f] cursor-pointer hover:border-white/20 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-white">Manual Mapping</span>
                      <FileText size={16} className="text-white/40" />
                    </div>
                    <div className="text-[10px] text-white/50">Extracts raw text, operator maps lines manually.</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Line Item Mapping</h3>
                <div className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">140/145 Mapped</div>
              </div>
              <div className="bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 bg-white/[0.02] text-[9px] font-bold uppercase tracking-widest text-white/40">
                  <div className="col-span-1">Ref</div>
                  <div className="col-span-4">BOQ Description</div>
                  <div className="col-span-1">Qty</div>
                  <div className="col-span-5">BTS Product Match</div>
                  <div className="col-span-1">Status</div>
                </div>
                <div className="divide-y divide-white/5 max-h-80 overflow-y-auto custom-scrollbar">
                  {[
                    { ref: '2.1', desc: 'Face Brick, Red, 222x106x73mm', qty: '12,000', match: 'Classic Red Clay Brick (SKU-101)', status: 'Mapped' },
                    { ref: '2.2', desc: 'Paving, Grey Slate 400x400', qty: '450 m2', match: 'Grey Slate Paver (SKU-304)', status: 'Mapped' },
                    { ref: '2.3', desc: 'Special Feature Tile, Blue Glaze', qty: '50 m2', match: 'None', status: 'Ambiguous' },
                  ].map((row, i) => (
                    <div key={i} className="grid grid-cols-12 gap-4 p-4 text-xs items-center hover:bg-white/[0.02] transition-colors">
                      <div className="col-span-1 font-mono text-white/40">{row.ref}</div>
                      <div className="col-span-4 text-white/80">{row.desc}</div>
                      <div className="col-span-1 font-mono text-white/60">{row.qty}</div>
                      <div className="col-span-5">
                        {row.status === 'Mapped' ? (
                          <div className="flex items-center gap-2 text-[#00ff88] bg-[#00ff88]/5 px-2 py-1 rounded border border-[#00ff88]/10 w-fit">
                            <LinkIcon size={12} /> <span className="font-medium">{row.match}</span>
                          </div>
                        ) : (
                          <button className="text-[10px] font-bold uppercase tracking-widest text-amber-400 border border-amber-400/30 px-3 py-1.5 rounded-lg hover:bg-amber-400/10 transition-colors">Search Catalog</button>
                        )}
                      </div>
                      <div className="col-span-1">
                        {row.status === 'Mapped' ? <CheckCircle2 size={16} className="text-[#00ff88]" /> : <AlertTriangle size={16} className="text-amber-400" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-amber-400/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={32} className="text-amber-400" />
                </div>
                <h3 className="text-xl font-serif font-bold text-amber-400 mb-2">5 Lines Require Manual Review</h3>
                <p className="text-sm text-white/60 leading-relaxed max-w-md mx-auto">The BOQ has been saved to the opportunity. You can generate a draft quote, but it will be flagged as incomplete until the ambiguous lines are resolved.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between pt-6 border-t border-white/5 mt-8">
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)} className="px-6 py-3 bg-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all">Back</button>
          ) : <div />}
          
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)} className="px-6 py-3 bg-amber-400 text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-amber-500 transition-all flex items-center gap-2 shadow-[0_0_10px_rgba(251,191,36,0.15)]">Next <ArrowRight size={14} /></button>
          ) : (
            <button onClick={onClose} className="px-6 py-3 bg-amber-400 text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-amber-500 transition-all flex items-center gap-2 shadow-[0_0_10px_rgba(251,191,36,0.15)]"><Save size={14} /> Save to Desk</button>
          )}
        </div>
      </div>
    </WizardModal>
  );
};

const QuoteGenerationWizard = ({ onClose }: any) => {
  const [step, setStep] = useState(1);
  return (
    <WizardModal isOpen={true} onClose={onClose} title="Quote Generation">
      <div className="space-y-8">
        <div className="flex items-center justify-between mb-8">
          {[
            { num: 1, label: 'Select Opportunity' },
            { num: 2, label: 'Pricing & Margin' },
            { num: 3, label: 'Exclusions & Notes' }
          ].map((s, i) => (
            <div key={s.num} className="flex flex-col items-center gap-2 flex-1 relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-colors ${step >= s.num ? 'bg-[#00ff88] text-black shadow-[0_0_10px_rgba(0,255,136,0.15)]' : 'bg-[#0f0f0f] border border-white/10 text-white/40'}`}>
                {step > s.num ? <CheckCircle2 size={14} /> : s.num}
              </div>
              <span className={`text-[10px] uppercase tracking-widest font-bold ${step >= s.num ? 'text-white' : 'text-white/40'}`}>{s.label}</span>
              {i < 2 && <div className={`absolute top-4 left-1/2 w-full h-px -z-0 ${step > s.num ? 'bg-[#00ff88]/30' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Search Opportunities</label>
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                  <input type="text" placeholder="Project name, reference, or client..." className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#00ff88]/50 transition-colors" />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Ready for Quote</label>
                <div className="space-y-2">
                  {MOCK_TENDERS.filter(t => t.boqStatus === 'Parsed').map((tender, i) => (
                    <div key={tender.id} className={`p-4 rounded-xl border cursor-pointer transition-all ${i === 0 ? 'border-[#00ff88]/30 bg-[#00ff88]/5' : 'border-white/10 bg-[#0f0f0f] hover:border-white/20'}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-white">{tender.title}</span>
                        <span className="text-[10px] font-mono text-[#00ff88]">BOQ Ready</span>
                      </div>
                      <div className="text-xs text-white/50">{tender.client}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-5 rounded-xl border border-white/10 bg-[#0f0f0f]">
                  <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1 font-bold">Total Cost</div>
                  <div className="text-lg font-mono text-white">$84,200</div>
                </div>
                <div className="p-5 rounded-xl border border-white/10 bg-[#0f0f0f]">
                  <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1 font-bold">Quote Value</div>
                  <div className="text-lg font-mono text-white">$124,500</div>
                </div>
                <div className="p-5 rounded-xl border border-[#00ff88]/30 bg-[#00ff88]/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#00ff88]/10 blur-xl rounded-full -mr-12 -mt-12" />
                  <div className="text-[10px] uppercase tracking-widest text-[#00ff88]/60 mb-1 font-bold relative">Est. Margin</div>
                  <div className="text-lg font-mono text-[#00ff88] relative">32.3%</div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Global Adjustments</label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-white/60">Discount (%)</label>
                    <input type="number" defaultValue="0" className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl p-3 text-sm text-white font-mono focus:outline-none focus:border-[#00ff88]/50 transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-white/60">Markup (%)</label>
                    <input type="number" defaultValue="25" className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl p-3 text-sm text-white font-mono focus:outline-none focus:border-[#00ff88]/50 transition-colors" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Standard Exclusions</label>
                <div className="space-y-2">
                  {['Delivery to Site', 'Offloading', 'Breakage Allowance', 'Pallet Returns'].map((exc, i) => (
                    <label key={i} className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-[#0f0f0f] cursor-pointer hover:bg-white/[0.02] transition-colors">
                      <input type="checkbox" defaultChecked className="accent-[#00ff88]" />
                      <span className="text-sm text-white/80">{exc}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Custom Notes</label>
                <textarea rows={4} placeholder="Add specific terms or notes for this quote..." className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-[#00ff88]/50 transition-colors resize-none custom-scrollbar" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between pt-6 border-t border-white/5 mt-8">
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)} className="px-6 py-3 bg-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all">Back</button>
          ) : <div />}
          
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)} className="px-6 py-3 bg-[#00ff88] text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#00cc6a] transition-all flex items-center gap-2 shadow-[0_0_10px_rgba(0,255,136,0.15)]">Next <ArrowRight size={14} /></button>
          ) : (
            <button onClick={onClose} className="px-6 py-3 bg-[#00ff88] text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#00cc6a] transition-all flex items-center gap-2 shadow-[0_0_10px_rgba(0,255,136,0.15)]"><Save size={14} /> Save Draft Quote</button>
          )}
        </div>
      </div>
    </WizardModal>
  );
};

const SubmissionWizard = ({ onClose }: any) => {
  const [step, setStep] = useState(1);
  return (
    <WizardModal isOpen={true} onClose={onClose} title="Tender Submission">
      <div className="space-y-8">
        <div className="flex items-center justify-between mb-8">
          {[
            { num: 1, label: 'Select Quote & Docs' },
            { num: 2, label: 'Submission Channel' }
          ].map((s, i) => (
            <div key={s.num} className="flex flex-col items-center gap-2 flex-1 relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-colors ${step >= s.num ? 'bg-blue-400 text-black shadow-[0_0_10px_rgba(96,165,250,0.15)]' : 'bg-[#0f0f0f] border border-white/10 text-white/40'}`}>
                {step > s.num ? <CheckCircle2 size={14} /> : s.num}
              </div>
              <span className={`text-[10px] uppercase tracking-widest font-bold ${step >= s.num ? 'text-white' : 'text-white/40'}`}>{s.label}</span>
              {i < 1 && <div className={`absolute top-4 left-1/2 w-full h-px -z-0 ${step > s.num ? 'bg-blue-400/30' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Select Approved Quote</label>
                <div className="space-y-2">
                  {MOCK_QUOTES.filter(q => q.status === 'Ready for Review').map((quote, i) => (
                    <div key={quote.id} className={`p-4 rounded-xl border cursor-pointer transition-all ${i === 0 ? 'border-blue-400/30 bg-blue-400/5' : 'border-white/10 bg-[#0f0f0f] hover:border-white/20'}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-white">{quote.tenderTitle}</span>
                        <span className="text-xs font-mono text-blue-400">{quote.value}</span>
                      </div>
                      <div className="text-[10px] text-white/50">{quote.id}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Additional Documents</label>
                <div className="p-6 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-center hover:border-blue-400/30 hover:bg-blue-400/5 transition-all cursor-pointer group">
                  <div className="p-3 bg-white/5 rounded-full text-white/20 group-hover:text-blue-400 group-hover:bg-blue-400/10 transition-all mb-3">
                    <Upload size={24} />
                  </div>
                  <div className="text-sm font-bold text-white mb-1">Attach Specs, Certs, or Cover Letter</div>
                  <div className="text-[10px] text-white/40 uppercase tracking-widest">PDF, DOCX up to 20MB</div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Submission Method</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-xl border border-blue-400/30 bg-blue-400/5 cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-400/10 blur-xl rounded-full -mr-12 -mt-12" />
                    <div className="flex items-center justify-between mb-2 relative">
                      <span className="text-sm font-bold text-blue-400">Direct Email</span>
                      <Mail size={16} className="text-blue-400" />
                    </div>
                    <div className="text-[10px] text-white/50 relative">Sends via BTS CRM with tracking.</div>
                  </div>
                  <div className="p-5 rounded-xl border border-white/10 bg-[#0f0f0f] cursor-pointer hover:border-white/20 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-white">Portal Upload</span>
                      <Globe size={16} className="text-white/40" />
                    </div>
                    <div className="text-[10px] text-white/50">Marks as submitted externally.</div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Response Expected By</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                  <input type="date" className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between pt-6 border-t border-white/5 mt-8">
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)} className="px-6 py-3 bg-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all">Back</button>
          ) : <div />}
          
          {step < 2 ? (
            <button onClick={() => setStep(s => s + 1)} className="px-6 py-3 bg-blue-400 text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center gap-2 shadow-[0_0_10px_rgba(96,165,250,0.15)]">Next <ArrowRight size={14} /></button>
          ) : (
            <button onClick={onClose} className="px-6 py-3 bg-blue-400 text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center gap-2 shadow-[0_0_10px_rgba(96,165,250,0.15)]"><Send size={14} /> Submit Tender</button>
          )}
        </div>
      </div>
    </WizardModal>
  );
};

export const CRMProjectsTenders = () => {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Opportunities' | 'BOQDesk' | 'QuoteDesk' | 'SubmissionTracker'>('Overview');
  const [isNewTenderWizardOpen, setIsNewTenderWizardOpen] = useState(false);
  const [isBOQUploadWizardOpen, setIsBOQUploadWizardOpen] = useState(false);
  const [isQuoteWizardOpen, setIsQuoteWizardOpen] = useState(false);
  const [isSubmissionWizardOpen, setIsSubmissionWizardOpen] = useState(false);

  return (
    <div className="h-full flex flex-col space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tighter text-white uppercase mb-1">Projects & Tenders</h1>
          <p className="text-[10px] font-mono text-[#00ff88] uppercase tracking-widest">Procurement & Bidding Engine</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsNewTenderWizardOpen(true)} className="px-6 py-3 bg-[#00ff88] text-black font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-[#00cc6e] transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,136,0.2)]">
            <Plus size={14} /> New Tender
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-4 overflow-x-auto custom-scrollbar">
        {[
          { id: 'Overview', label: 'Overview' },
          { id: 'Opportunities', label: 'Opportunities' },
          { id: 'BOQDesk', label: 'BOQ Desk' },
          { id: 'QuoteDesk', label: 'Quote Desk' },
          { id: 'SubmissionTracker', label: 'Submission Tracker' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === tab.id 
              ? 'bg-white/10 text-white border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]' 
              : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === 'Overview' && <TendersOverview />}
            {activeTab === 'Opportunities' && <TendersOpportunities onOpenBOQ={() => setIsBOQUploadWizardOpen(true)} onOpenQuote={() => setIsQuoteWizardOpen(true)} />}
            {activeTab === 'BOQDesk' && <TendersBOQDesk onUpload={() => setIsBOQUploadWizardOpen(true)} />}
            {activeTab === 'QuoteDesk' && <TendersQuoteDesk onGenerate={() => setIsQuoteWizardOpen(true)} />}
            {activeTab === 'SubmissionTracker' && <TendersSubmissionTracker onSubmit={() => setIsSubmissionWizardOpen(true)} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Wizards */}
      <AnimatePresence>
        {isNewTenderWizardOpen && <NewTenderWizard onClose={() => setIsNewTenderWizardOpen(false)} />}
        {isBOQUploadWizardOpen && <BOQUploadWizard onClose={() => setIsBOQUploadWizardOpen(false)} />}
        {isQuoteWizardOpen && <QuoteGenerationWizard onClose={() => setIsQuoteWizardOpen(false)} />}
        {isSubmissionWizardOpen && <SubmissionWizard onClose={() => setIsSubmissionWizardOpen(false)} />}
      </AnimatePresence>
    </div>
  );
};
