
import React, { useState, useEffect, useCallback } from 'react';
import { ProjectStatus, Estimate, MaterialItem, LaborItem } from './types';
import { Icons, COLORS } from './constants';
import { parseRFPText, getOptimizationSuggestions } from './geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Cell } from 'recharts';

// --- Helper for Indian Currency Formatting ---
const formatINR = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

// --- Components ---

const Sidebar = ({ currentView, setView }: { currentView: string, setView: (v: string) => void }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Command Center', icon: Icons.Layout },
    { id: 'new-rfp', label: 'RFP Analyzer', icon: Icons.Plus },
    { id: 'proposals', label: 'Bid Archive', icon: Icons.History },
    { id: 'settings', label: 'Workspace', icon: Icons.Settings },
  ];

  return (
    <div className="w-64 h-screen glass-panel border-r border-slate-200/50 fixed left-0 top-0 flex flex-col p-6 z-10 hidden md:flex industrial-shadow transition-all duration-500">
      <div className="flex items-center gap-3 px-2 mb-10 group cursor-pointer" onClick={() => setView('dashboard')}>
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:rotate-12 transition-transform">
          <Icons.Zap />
        </div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tighter">Build<span className="text-blue-600">Flow</span></h1>
      </div>
      
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 transform ${
                isActive 
                  ? 'bg-blue-600 text-white font-bold shadow-xl shadow-blue-100 active-nav-glow scale-[1.02]' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto p-4 bg-slate-900 rounded-2xl text-white shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/20 blur-2xl group-hover:bg-blue-600/40 transition-colors"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full border-2 border-blue-400 p-0.5 overflow-hidden">
               <div className="w-full h-full bg-blue-800 rounded-full flex items-center justify-center text-xs font-bold">JD</div>
            </div>
            <div>
              <p className="text-sm font-bold truncate">John Doe</p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Pro Active</p>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Workspace Utilization</p>
          <div className="w-full bg-white/10 h-1.5 rounded-full mb-4">
            <div className="bg-blue-500 h-full w-[85%] rounded-full"></div>
          </div>
          <button className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold transition-all">Upgrade Plan</button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, trend, icon: Icon, color, sublabel }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 industrial-shadow hover:-translate-y-1 transition-all cursor-default group">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
        <Icon />
      </div>
      {trend && (
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
    </div>
    <p className="text-slate-500 text-sm font-semibold mb-1 uppercase tracking-tight">{label}</p>
    <p className="text-2xl font-black text-slate-800 tracking-tight">{value}</p>
    {sublabel && <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest">{sublabel}</p>}
  </div>
);

const Dashboard = ({ estimates, onSelect }: { estimates: Estimate[], onSelect: (e: Estimate) => void }) => {
  const totalValue = estimates.reduce((sum, e) => sum + e.totalCost, 0);
  
  const activityData = [
    { name: 'Mon', bids: 420000, won: 240000 },
    { name: 'Tue', bids: 850000, won: 139800 },
    { name: 'Wed', bids: 320000, won: 980000 },
    { name: 'Thu', bids: 678000, won: 390800 },
    { name: 'Fri', bids: 1200000, won: 480000 },
  ];

  return (
    <div className="space-y-8 animate-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded uppercase">Optimization Active</span>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">BuildFlow v2.4</span>
          </div>
          <h2 className="text-4xl font-black tracking-tight text-slate-900 gradient-text">Command Center</h2>
          <p className="text-slate-500 font-medium">Powering precision estimates for industrial electrical contracts.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-3 glass-panel border border-slate-200 rounded-2xl hover:bg-white transition text-slate-700 font-bold text-sm industrial-shadow">
            <Icons.Download /> Export Pipeline
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-500 transition shadow-xl shadow-blue-100 font-bold text-sm group">
            <span className="group-hover:rotate-90 transition-transform"><Icons.Plus /></span> New RFP Analysis
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Pipeline Value" value={formatINR(totalValue)} trend={12} icon={Icons.TrendingUp} color="bg-blue-600" sublabel="Live Estimations" />
        <StatCard label="Time Saved" value="142 Hours" trend={8} icon={Icons.Zap} color="bg-indigo-600" sublabel="This Quarter" />
        <StatCard label="Bid Win Rate" value="64%" trend={5} icon={Icons.Check} color="bg-emerald-500" sublabel="Vs Local Avg (42%)" />
        <StatCard label="Pending RFPs" value="5" icon={Icons.History} color="bg-orange-500" sublabel="Awaiting Analysis" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 industrial-shadow hover:border-blue-100 transition-colors">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-black text-slate-800 text-lg uppercase tracking-wider">Proposal Velocity</h3>
              <p className="text-xs text-slate-400 font-bold">Estimated value of submitted bids vs target conversion.</p>
            </div>
            <div className="flex gap-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Submitted</span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Closed</span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorBids" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} />
                <Tooltip 
                  formatter={(value: number) => [formatINR(value), 'Value']}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} 
                />
                <Area type="monotone" dataKey="bids" stroke={COLORS.primary} strokeWidth={4} fillOpacity={1} fill="url(#colorBids)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl flex flex-col justify-between group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/30 blur-3xl rounded-full"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Icons.Shield />
            </div>
            <h3 className="text-xl font-black mb-2">BuildFlow Intelligence</h3>
            <p className="text-slate-400 text-sm font-medium leading-relaxed mb-6">
              Our AI is currently benchmarking your data center bids against current copper and aluminum futures in the Indian market.
            </p>
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                 <p className="text-xs font-bold text-slate-300">GST Compliance Verified</p>
               </div>
               <div className="flex items-center gap-3">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                 <p className="text-xs font-bold text-slate-300">BoQ Auto-Mapping Active</p>
               </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 relative z-10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-400">COMPETITIVE ACCURACY</span>
              <span className="text-xs font-black text-emerald-400">98.4%</span>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-400 h-full w-[98%] animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 industrial-shadow overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Industrial Bid Pipeline</h3>
          <button className="px-5 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-100 transition-colors border border-slate-100 uppercase tracking-tighter">View Full Archive</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
              <tr>
                <th className="px-8 py-4">Ref #</th>
                <th className="px-8 py-4">Contract Entity</th>
                <th className="px-8 py-4">Project Valuation</th>
                <th className="px-8 py-4">Bid Health</th>
                <th className="px-8 py-4">Target Date</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {estimates.map((e, idx) => (
                <tr key={e.id} className="group hover:bg-blue-50/30 transition-all cursor-pointer" onClick={() => onSelect(e)}>
                  <td className="px-8 py-5 font-mono text-xs text-slate-400">BF-{1000 + idx}</td>
                  <td className="px-8 py-5">
                    <p className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{e.projectName}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{e.projectType} • {e.location}</p>
                  </td>
                  <td className="px-8 py-5 font-black text-slate-900 text-sm">{formatINR(e.totalCost)}</td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                      e.status === ProjectStatus.WON ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' :
                      e.status === ProjectStatus.PENDING ? 'bg-orange-100 text-orange-600 border border-orange-200' :
                      'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-xs font-bold text-slate-500">{e.deadline}</td>
                  <td className="px-8 py-5 text-right">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-12 transition-all">
                      <Icons.Zap />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const RFPProcessor = ({ onComplete }: { onComplete: (e: Partial<Estimate>) => void }) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcess = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    try {
      const result = await parseRFPText(inputText);
      onComplete(result);
    } catch (error) {
      alert("Analysis engine failure. Please ensure your document text is valid.");
    } finally {
      setIsProcessing(false);
    }
  };

  const sampleRFP = `PROJECT: Adani Data Center - HYD Phase 1
LOCATION: Hyderabad, TS, India
DEADLINE: Dec 20, 2024
SCOPE: Complete electrical fit-out for server hall A. 
MATERIALS: 
- 8x 2500kVA Cast Resin Transformers
- 1500m of 11kV HT XLPE Cable
- 500x 63A Commando Sockets
LABOR: 15 Journeymen, 10 Helpers for 12 weeks.`;

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 fade-in">
      <div className="text-center mb-16">
        <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white mx-auto mb-8 shadow-2xl shadow-blue-100 animate-pulse">
          <Icons.Zap />
        </div>
        <h2 className="text-5xl font-black text-slate-900 tracking-tight mb-4">RFP Intelligence Hub</h2>
        <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">Upload complex industrial specifications. BuildFlow analyzes thousands of pages to build your precision estimate instantly.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-6">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-500 rounded-[2.5rem] blur opacity-10 group-hover:opacity-30 transition duration-1000"></div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste RFP scope, specifications text or drop documents here..."
              className="relative w-full h-[500px] p-8 bg-white border border-slate-200 rounded-[2.5rem] focus:ring-4 focus:ring-blue-100 focus:outline-none text-slate-700 font-mono text-sm leading-relaxed industrial-shadow transition-all"
            />
            <button 
              onClick={() => setInputText(sampleRFP)}
              className="absolute bottom-8 right-8 text-[10px] font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors uppercase tracking-widest border border-blue-100"
            >
              Load Sample Data Center RFP
            </button>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl flex flex-col justify-between h-full group overflow-hidden">
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-600/10 blur-3xl rounded-full group-hover:bg-blue-600/20 transition-all"></div>
            <div className="relative z-10">
              <h4 className="font-black text-sm mb-8 uppercase tracking-[0.2em] text-blue-400">Analysis Engine v2</h4>
              <ul className="space-y-6">
                {[
                  "Automatic Bill of Quantities (BoQ)",
                  "Material Type Categorization",
                  "Labor Hour Calculation",
                  "Competitive Strategy Insights"
                ].map((item, i) => (
                  <li key={i} className="flex gap-4 text-sm font-medium text-slate-300">
                    <div className="w-5 h-5 bg-blue-600/20 rounded flex items-center justify-center text-blue-400 mt-0.5"><Icons.Check /></div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <button
              onClick={handleProcess}
              disabled={isProcessing || !inputText}
              className={`w-full py-6 rounded-2xl font-black text-lg shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 transform relative z-10 ${
                isProcessing || !inputText 
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700' 
                  : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/40 hover:-translate-y-1'
              }`}
            >
              {isProcessing ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>START ANALYSIS <Icons.Zap /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EstimateEditor = ({ estimate, onSave, onCancel }: { estimate: Estimate, onSave: (e: Estimate) => void, onCancel: () => void }) => {
  const [localEstimate, setLocalEstimate] = useState<Estimate>(estimate);
  const [aiSuggestions, setAiSuggestions] = useState<string>('');
  const [isOptimizing, setIsOptimizing] = useState(false);

  const calculateTotals = useCallback((est: Estimate) => {
    const matTotal = est.materials.reduce((sum, m) => sum + (m.quantity * m.unitPrice), 0);
    const labTotal = est.labor.reduce((sum, l) => sum + (l.hours * l.rate), 0);
    const subtotal = matTotal + labTotal;
    
    const overhead = subtotal * (est.overheadPercentage / 100);
    const contingency = subtotal * (est.contingencyPercentage / 100);
    const profit = subtotal * (est.profitPercentage / 100);

    return {
      ...est,
      totalCost: Math.round(subtotal + overhead + contingency + profit)
    };
  }, []);

  useEffect(() => {
    setLocalEstimate(prev => calculateTotals(prev));
  }, [localEstimate.materials, localEstimate.labor, localEstimate.overheadPercentage, localEstimate.contingencyPercentage, localEstimate.profitPercentage, calculateTotals]);

  const handleOptimization = async () => {
    setIsOptimizing(true);
    try {
      const suggestions = await getOptimizationSuggestions(localEstimate);
      setAiSuggestions(suggestions);
    } catch (e) {
      alert("Error.");
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="space-y-10 pb-24 animate-in">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <button onClick={onCancel} className="group text-slate-400 hover:text-slate-800 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] mb-4 transition-all">
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Command Center
          </button>
          <div className="flex items-center gap-5">
             <div className="w-16 h-16 bg-blue-50 rounded-[1.5rem] flex items-center justify-center text-blue-600 shadow-inner border border-blue-100">
                <Icons.Zap />
             </div>
             <div>
               <h2 className="text-4xl font-black text-slate-900 tracking-tight">{localEstimate.projectName}</h2>
               <div className="flex items-center gap-4 mt-2">
                 <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 uppercase tracking-widest">Active Draft</span>
                 <p className="text-slate-400 text-xs font-bold flex items-center gap-1.5 uppercase tracking-tighter"><Icons.Map /> {localEstimate.location}</p>
                 <p className="text-slate-400 text-xs font-bold flex items-center gap-1.5 uppercase tracking-tighter"><Icons.History /> Due {localEstimate.deadline}</p>
               </div>
             </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleOptimization}
            className="group relative px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center gap-3 hover:bg-slate-800 transition shadow-2xl overflow-hidden border border-slate-700"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            {isOptimizing ? "ANALYZING MARKET..." : <><Icons.Zap /> AI OPTIMIZER</>}
          </button>
          <button 
            onClick={() => onSave(localEstimate)}
            className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-200 hover:bg-blue-500 active:scale-95 transition-all hover:-translate-y-1"
          >
            PUBLISH BID
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        <div className="xl:col-span-8 space-y-10">
          <section className="bg-white rounded-[2.5rem] border border-slate-100 industrial-shadow overflow-hidden group">
            <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center group-hover:bg-slate-100/50 transition-colors">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm flex items-center gap-3">
                <Icons.FileText /> Bill of Quantities (BoQ)
              </h3>
              <button className="text-blue-600 text-xs font-black bg-white px-4 py-2 rounded-xl hover:bg-blue-50 transition shadow-sm border border-blue-100">ADD LINE ITEM</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] uppercase font-black text-slate-400 tracking-widest bg-white">
                  <tr>
                    <th className="px-8 py-5">Component Specifications</th>
                    <th className="px-8 py-5">Qty</th>
                    <th className="px-8 py-5">Unit Rate</th>
                    <th className="px-8 py-5 text-right">Ext. Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {localEstimate.materials.map(item => (
                    <tr key={item.id} className="hover:bg-blue-50/20 transition-colors">
                      <td className="px-8 py-6">
                        <input 
                          type="text" 
                          value={item.name} 
                          onChange={(e) => {
                            const newMat = localEstimate.materials.map(m => m.id === item.id ? { ...m, name: e.target.value } : m);
                            setLocalEstimate({ ...localEstimate, materials: newMat });
                          }}
                          className="bg-transparent border-none focus:ring-2 focus:ring-blue-100 rounded px-3 py-1.5 w-full text-sm font-bold text-slate-800"
                        />
                      </td>
                      <td className="px-8 py-6">
                        <input 
                          type="number" 
                          value={item.quantity} 
                          className="w-20 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-black text-center focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                          onChange={(e) => {
                            const newMat = localEstimate.materials.map(m => m.id === item.id ? { ...m, quantity: parseFloat(e.target.value) } : m);
                            setLocalEstimate({ ...localEstimate, materials: newMat });
                          }}
                        />
                      </td>
                      <td className="px-8 py-6">
                        <div className="relative">
                           <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                           <input 
                            type="number" 
                            value={item.unitPrice} 
                            className="w-28 bg-slate-50 border border-slate-200 rounded-xl p-2.5 pl-8 text-xs font-black text-center focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            onChange={(e) => {
                              const newMat = localEstimate.materials.map(m => m.id === item.id ? { ...m, unitPrice: parseFloat(e.target.value) } : m);
                              setLocalEstimate({ ...localEstimate, materials: newMat });
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right font-black text-slate-900 text-sm">
                        {formatINR(item.quantity * item.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {aiSuggestions && (
            <div className="bg-blue-600 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group hover:shadow-blue-200/50 transition-all">
              <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 blur-[120px] -mr-40 -mt-40 group-hover:bg-white/20 transition-all duration-1000"></div>
              <h4 className="font-black text-2xl mb-8 flex items-center gap-3">
                <Icons.Zap /> Competitive Bid Strategy
              </h4>
              <div className="text-blue-50 whitespace-pre-wrap text-sm font-medium leading-[2] opacity-90 tracking-wide">
                {aiSuggestions}
              </div>
              <div className="mt-10 pt-10 border-t border-white/10 flex justify-between items-center">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">BuildFlow Optimized Intelligence for Indian Bidding</p>
                 <div className="flex gap-2">
                   <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><Icons.Check /></div>
                   <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><Icons.Shield /></div>
                 </div>
              </div>
            </div>
          )}
        </div>

        <div className="xl:col-span-4 space-y-8">
          <section className="bg-white p-8 rounded-[3rem] border border-slate-200 industrial-shadow sticky top-8 hover:border-blue-100 transition-colors">
            <h3 className="font-black text-slate-800 mb-10 text-lg uppercase tracking-widest border-b border-slate-50 pb-6">Proposal Financials</h3>
            
            <div className="space-y-8">
              {[
                { label: 'Operational Overhead', val: localEstimate.overheadPercentage, key: 'overheadPercentage' },
                { label: 'Project Contingency', val: localEstimate.contingencyPercentage, key: 'contingencyPercentage' },
                { label: 'Target Margin (Profit)', val: localEstimate.profitPercentage, key: 'profitPercentage' }
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center group">
                  <span className="text-xs font-black text-slate-500 group-hover:text-blue-600 transition-colors uppercase tracking-widest">{row.label} (%)</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      value={row.val}
                      onChange={(e) => setLocalEstimate({ ...localEstimate, [row.key]: parseFloat(e.target.value) })}
                      className="w-20 bg-slate-50 border border-slate-200 rounded-xl p-3 text-right text-sm font-black focus:ring-2 focus:ring-blue-100 outline-none group-hover:bg-blue-50 transition-all"
                    />
                  </div>
                </div>
              ))}
              
              <div className="pt-10 mt-6 border-t border-slate-100 space-y-5">
                <div className="flex justify-between text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                  <span>Direct Materials</span>
                  <span>{formatINR(localEstimate.materials.reduce((s, m) => s + m.quantity * m.unitPrice, 0))}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                  <span>Direct Labor</span>
                  <span>{formatINR(localEstimate.labor.reduce((s, l) => s + l.hours * l.rate, 0))}</span>
                </div>
                <div className="pt-8 mt-4 border-t-2 border-slate-900/5">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest">Final Contract Bid</p>
                    <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 bg-slate-50 rounded">GST Incl (Assumed)</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{formatINR(localEstimate.totalCost)}</span>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">INR</span>
                  </div>
                </div>
              </div>

              <div className="mt-12">
                <button className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black text-sm tracking-[0.2em] uppercase shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-4 hover:-translate-y-1 transform">
                  <Icons.Download /> Generate Bid PDF
                </button>
                <div className="flex items-center justify-center gap-2 mt-8">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Estimated Processing Time Saved: 8h 45m</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [activeEstimate, setActiveEstimate] = useState<Estimate | null>(null);

  useEffect(() => {
    const dummy: Estimate[] = [
      {
        id: '1',
        projectName: 'Reliance Jamnagar Data Center B-4',
        projectType: 'Industrial',
        location: 'Jamnagar, GJ',
        deadline: '2024-12-15',
        materials: [
          { id: 'm1', name: '6" Galvanized Rigid Conduit', quantity: 500, unit: 'm', unitPrice: 2400, total: 1200000, category: 'Conduit' },
          { id: 'm2', name: '400 Sq.mm Al XLPE HT Cable', quantity: 1800, unit: 'm', unitPrice: 3800, total: 6840000, category: 'Cable' },
          { id: 'm3', name: 'Cable Tray - Perforated 600mm', quantity: 300, unit: 'm', unitPrice: 1100, total: 330000, category: 'Support' },
        ],
        labor: [
          { id: 'l1', role: 'Cable Specialist', hours: 240, rate: 1200, total: 288000 },
          { id: 'l2', role: 'Electrician (Grade A)', hours: 600, rate: 650, total: 390000 },
        ],
        overheadPercentage: 12,
        contingencyPercentage: 5,
        profitPercentage: 18,
        status: ProjectStatus.PENDING,
        createdAt: '2024-10-12',
        totalCost: 11400000,
        notes: 'Critical cooling infrastructure upgrade for Tier IV hall.'
      },
      {
        id: '2',
        projectName: 'Adani One BKC Fit-out',
        projectType: 'Commercial',
        location: 'Mumbai, MH',
        deadline: '2024-11-01',
        materials: [],
        labor: [],
        overheadPercentage: 10,
        contingencyPercentage: 3,
        profitPercentage: 15,
        status: ProjectStatus.WON,
        createdAt: '2024-09-20',
        totalCost: 24500000,
        notes: 'High-end architectural electrical installation.'
      }
    ];
    setEstimates(dummy);
  }, []);

  const handleRFPProcessingComplete = (data: Partial<Estimate>) => {
    const newEstimate: Estimate = {
      id: Date.now().toString(),
      projectName: data.projectName || 'Untitled Proposal',
      projectType: data.projectType || 'Industrial',
      location: data.location || 'Site Location TBD',
      deadline: data.deadline || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      materials: data.materials || [],
      labor: data.labor || [],
      overheadPercentage: 12,
      contingencyPercentage: 5,
      profitPercentage: 15,
      status: ProjectStatus.DRAFT,
      createdAt: new Date().toISOString().split('T')[0],
      totalCost: data.totalCost || 0,
      notes: data.notes || ''
    };
    setActiveEstimate(newEstimate);
    setCurrentView('edit-estimate');
  };

  const saveEstimate = (updated: Estimate) => {
    setEstimates(prev => {
      const exists = prev.find(e => e.id === updated.id);
      if (exists) return prev.map(e => e.id === updated.id ? updated : e);
      return [updated, ...prev];
    });
    setActiveEstimate(null);
    setCurrentView('dashboard');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex selection:bg-blue-600 selection:text-white">
      <Sidebar currentView={currentView} setView={setCurrentView} />
      
      <main className="flex-1 md:ml-64 p-8 md:p-12 overflow-x-hidden">
        <div className="max-w-[1400px] mx-auto">
          {currentView === 'dashboard' && (
            <Dashboard 
              estimates={estimates} 
              onSelect={(e) => { setActiveEstimate(e); setCurrentView('edit-estimate'); }}
            />
          )}

          {currentView === 'new-rfp' && (
            <RFPProcessor onComplete={handleRFPProcessingComplete} />
          )}

          {currentView === 'edit-estimate' && activeEstimate && (
            <EstimateEditor 
              estimate={activeEstimate} 
              onSave={saveEstimate} 
              onCancel={() => { setActiveEstimate(null); setCurrentView('dashboard'); }} 
            />
          )}

          {currentView === 'proposals' && (
            <div className="bg-white p-12 rounded-[3rem] industrial-shadow animate-in border border-slate-50">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-3xl font-black mb-2 tracking-tight">Bid Archive</h2>
                  <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Historical Contract Intelligence</p>
                </div>
                <div className="flex gap-2">
                   <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs border border-blue-100 uppercase">Recent</div>
                   <div className="px-4 py-2 bg-slate-50 text-slate-400 rounded-xl font-bold text-xs border border-slate-100 uppercase">Archived</div>
                </div>
              </div>
              <div className="relative mb-12">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400">
                    <Icons.Search />
                  </span>
                  <input type="text" placeholder="Search by project name, entity or location..." className="w-full pl-16 pr-8 py-5 bg-slate-50 border border-slate-100 rounded-[2.5rem] text-sm font-bold focus:ring-4 focus:ring-blue-50 focus:outline-none transition-all shadow-inner" />
              </div>
              <div className="space-y-6">
                {estimates.map(e => (
                  <div key={e.id} className="p-8 border border-slate-100 rounded-[2.5rem] hover:bg-slate-50 flex items-center justify-between transition-all group hover:border-blue-100 cursor-pointer">
                    <div className="flex items-center gap-8">
                       <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-300 border border-slate-100 group-hover:text-blue-600 group-hover:border-blue-100 group-hover:bg-blue-50 transition-all shadow-sm">
                          <Icons.FileText />
                       </div>
                       <div>
                         <p className="font-black text-slate-800 tracking-tight text-xl mb-1">{e.projectName}</p>
                         <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em]">{e.projectType} • {e.location}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-12">
                      <div className="text-right">
                        <p className="font-black text-slate-900 text-xl mb-1">{formatINR(e.totalCost)}</p>
                        <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Submitted {e.createdAt}</p>
                      </div>
                      <button 
                        onClick={() => { setActiveEstimate(e); setCurrentView('edit-estimate'); }}
                        className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg hover:bg-blue-600"
                      >
                        <Icons.Zap />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentView === 'settings' && (
            <div className="max-w-3xl bg-white p-12 rounded-[3.5rem] industrial-shadow animate-in border border-slate-50">
              <div className="mb-12">
                <h2 className="text-4xl font-black mb-2 tracking-tight">System Workspace</h2>
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Global Account Configurations</p>
              </div>
              <div className="space-y-12">
                <section>
                  <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-blue-600 mb-8 flex items-center gap-3">
                    <div className="w-1 h-1 bg-blue-600 rounded-full"></div> Contractor Profile
                  </h3>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Legal Entity</label>
                      <input type="text" defaultValue="BuildFlow Industrial India Pvt Ltd." className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">GSTIN (India)</label>
                      <input type="text" defaultValue="22AAAAA0000A1Z5" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all" />
                    </div>
                  </div>
                </section>
                <section>
                  <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-blue-600 mb-8 flex items-center gap-3">
                    <div className="w-1 h-1 bg-blue-600 rounded-full"></div> Security & Access
                  </h3>
                  <div className="p-8 bg-slate-900 rounded-[2.5rem] flex items-center justify-between text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-2xl group-hover:bg-blue-600/20 transition-all"></div>
                    <div className="flex items-center gap-6 relative z-10">
                      <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-xl">ME</div>
                      <div>
                        <p className="font-black text-xl tracking-tight mb-1">BuildFlow Master Access</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Global Controller Status</p>
                      </div>
                    </div>
                    <div className="relative z-10 p-3 bg-white/5 rounded-2xl group-hover:rotate-12 transition-transform">
                      <Icons.Shield />
                    </div>
                  </div>
                </section>
                <button className="w-full py-5 bg-slate-50 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-100 hover:bg-slate-100 transition-colors">
                  System Re-Sync Core
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <button 
        onClick={() => setCurrentView('new-rfp')}
        className="md:hidden fixed bottom-10 right-10 w-16 h-16 bg-blue-600 rounded-[1.5rem] shadow-2xl flex items-center justify-center text-white z-50 hover:bg-blue-500 active:scale-90 transition-all shadow-blue-200"
      >
        <Icons.Plus />
      </button>
    </div>
  );
}
