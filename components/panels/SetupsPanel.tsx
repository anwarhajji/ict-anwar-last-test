
import React, { useMemo, useState } from 'react';
import { EntrySignal, ICTSetupType, OverlayState } from '../../types';

interface SetupsPanelProps {
    entries: EntrySignal[];
    overlays: OverlayState;
    setOverlays: (o: OverlayState) => void;
    setClickedEntry: (e: EntrySignal) => void;
    onClose: () => void;
    onViewOnChart: (e: EntrySignal) => void;
}

const MODEL_INFO: Record<string, { desc: string; rules: string[] }> = {
    '2022 Model': {
        desc: "A classic reversal pattern characterized by a Liquidity Sweep followed by a Market Structure Shift (MSS) and a return to a Fair Value Gap.",
        rules: [
            "Identify a liquidity sweep (Stop Hunt) of a Swing High/Low.",
            "Wait for a displacement candle causing a Market Structure Shift (MSS).",
            "Identify a Fair Value Gap (FVG) created during displacement.",
            "Enter on the retracement into the FVG."
        ]
    },
    'Silver Bullet': {
        desc: "A time-based volatility setup occurring during specific 60-minute windows in London and New York sessions.",
        rules: [
            "Time Windows (EST): 3-4 AM, 10-11 AM, 2-3 PM.",
            "Identify a clear draw on liquidity (DOL).",
            "Enter on the first FVG formed towards the DOL within the window.",
            "No MSS required, relies on time-based order flow."
        ]
    },
    'Unicorn': {
        desc: "A high-probability setup formed by the overlap of a Breaker Block and a Fair Value Gap.",
        rules: [
            "Identify a Breaker Block (a failed Order Block).",
            "Look for an FVG that aligns/overlaps with the Breaker.",
            "The confluence of these two PD Arrays creates the 'Unicorn'.",
            "Enter at the overlap area."
        ]
    },
    'OTE': {
        desc: "Optimal Trade Entry based on Fibonacci retracement levels within a defined dealing range.",
        rules: [
            "Identify a clear dealing range (Impulse leg).",
            "Draw Fib from Low to High (Long) or High to Low (Short).",
            "Wait for price to retrace into the 0.62 - 0.79 zone.",
            "Ideally aligns with other PD Arrays (OB/FVG)."
        ]
    },
    'Breaker': {
        desc: "A support-turned-resistance (or vice versa) setup using a failed Order Block.",
        rules: [
            "Price must sweep liquidity and then reverse impulsively.",
            "The Order Block responsible for the sweep is broken.",
            "Wait for price to retest this broken block (the Breaker).",
            "Enter on the retest."
        ]
    },
    'Standard FVG': {
        desc: "The foundational ICT concept representing an imbalance in price delivery.",
        rules: [
            "Identify a three-candle sequence with a gap between candle 1 and 3.",
            "Determine bias (Bullish/Bearish).",
            "Enter when price rebalances the inefficiency (fills the gap).",
            "Stop loss typically below/above the FVG candle."
        ]
    }
};

export const SetupsPanel: React.FC<SetupsPanelProps> = ({ entries, overlays, setOverlays, setClickedEntry, onClose, onViewOnChart }) => {
    const [selectedModel, setSelectedModel] = useState<ICTSetupType | string | null>(null);

    // Aggregate Stats
    const stats = useMemo(() => {
        const types = Object.keys(MODEL_INFO);
        return types.map(type => {
            const relevant = entries.filter(e => e.setupName === type && e.backtestResult !== 'PENDING');
            const total = relevant.length;
            const wins = relevant.filter(e => e.backtestResult === 'WIN').length;
            const losses = relevant.filter(e => e.backtestResult === 'LOSS').length;
            const winRate = total > 0 ? (wins / total) * 100 : 0;
            const pnl = relevant.reduce((acc, curr) => acc + (curr.backtestPnL || 0), 0);
            const history = relevant.sort((a,b) => (b.time as number) - (a.time as number)).slice(0, 10);
            
            return { type, total, wins, losses, winRate, pnl, history };
        });
    }, [entries]);

    const activeModelStats = useMemo(() => {
        if (!selectedModel) return null;
        return stats.find(s => s.type === selectedModel);
    }, [selectedModel, stats]);

    const toggleVisibility = (type: string) => {
        setOverlays({
            ...overlays,
            setupFilters: {
                ...overlays.setupFilters,
                [type as ICTSetupType]: !overlays.setupFilters[type as ICTSetupType]
            }
        });
    };

    // --- VIEW 1: CATALOG ---
    if (!selectedModel) {
        return (
            <div className="w-full h-full bg-[#0b0e11] overflow-y-auto custom-scrollbar p-6 md:p-8 animate-in fade-in">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-8 border-b border-[#2a2e39] pb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">ICT Models Dashboard</h1>
                            <p className="text-gray-500">Select a setup to view detailed performance metrics, rules, and trade history.</p>
                        </div>
                        <button onClick={onClose} className="bg-[#151924] hover:bg-[#1e222d] text-white px-4 py-2 rounded border border-[#2a2e39] transition-colors">
                            Exit Dashboard
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {stats.map((stat) => {
                            const info = MODEL_INFO[stat.type] || { desc: "Custom Setup", rules: [] };
                            const isVisible = overlays.setupFilters[stat.type as ICTSetupType] !== false;

                            return (
                                <div 
                                    key={stat.type} 
                                    className="bg-[#151924] border border-[#2a2e39] rounded-xl p-6 hover:border-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all cursor-pointer group flex flex-col"
                                    onClick={() => setSelectedModel(stat.type)}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{stat.type}</h3>
                                        <div className={`w-3 h-3 rounded-full ${isVisible ? 'bg-green-500' : 'bg-gray-600'}`} title={isVisible ? "Visible on Chart" : "Hidden"}></div>
                                    </div>
                                    
                                    <p className="text-sm text-gray-400 mb-6 flex-1 line-clamp-2">{info.desc}</p>
                                    
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-[#0b0e11] p-3 rounded border border-[#2a2e39]">
                                            <div className="text-[10px] text-gray-500 uppercase font-bold">Win Rate</div>
                                            <div className={`text-xl font-bold font-mono ${stat.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                                                {stat.winRate.toFixed(1)}%
                                            </div>
                                        </div>
                                        <div className="bg-[#0b0e11] p-3 rounded border border-[#2a2e39]">
                                            <div className="text-[10px] text-gray-500 uppercase font-bold">PnL</div>
                                            <div className={`text-xl font-bold font-mono ${stat.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                ${stat.pnl.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <button className="w-full bg-blue-600/10 text-blue-400 font-bold py-3 rounded border border-blue-600/30 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                        ANALYZE SETUP
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // --- VIEW 2: DETAIL DASHBOARD ---
    const info = MODEL_INFO[selectedModel as string] || { desc: "No description available.", rules: [] };
    const stat = activeModelStats!;
    const isVisible = overlays.setupFilters[selectedModel as ICTSetupType] !== false;

    return (
        <div className="w-full h-full bg-[#0b0e11] overflow-y-auto custom-scrollbar p-6 md:p-8 animate-in slide-in-from-right-8">
            <div className="max-w-7xl mx-auto">
                {/* HEADER */}
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-[#2a2e39]">
                    <button 
                        onClick={() => setSelectedModel(null)}
                        className="p-2 rounded-full bg-[#151924] text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
                            {selectedModel} 
                            <span className="text-sm font-normal text-gray-500 bg-[#151924] px-2 py-0.5 rounded border border-[#2a2e39]">ICT Concept</span>
                        </h1>
                    </div>
                    <div className="flex-1"></div>
                    
                    {/* Visibility Toggle Switch */}
                    <div className="flex items-center gap-3 bg-[#151924] px-4 py-2 rounded-lg border border-[#2a2e39]">
                        <span className="text-sm font-bold text-gray-300">Chart Overlay</span>
                        <button 
                            onClick={() => toggleVisibility(selectedModel as string)}
                            className={`w-12 h-6 rounded-full relative transition-colors ${isVisible ? 'bg-blue-600' : 'bg-gray-700'}`}
                        >
                            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${isVisible ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* LEFT: EDUCATIONAL CARD */}
                    <div className="lg:col-span-1 bg-[#151924] border border-[#2a2e39] rounded-xl p-6 h-fit">
                        <h3 className="text-lg font-bold text-blue-400 mb-4 uppercase tracking-wider">Setup Logic</h3>
                        <p className="text-gray-300 mb-6 leading-relaxed text-sm">
                            {info.desc}
                        </p>
                        
                        <div className="bg-[#0b0e11] rounded border border-[#2a2e39] p-4">
                            <div className="text-xs font-bold text-gray-500 uppercase mb-3">Identification Rules</div>
                            <ul className="space-y-3">
                                {info.rules.map((rule, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-gray-300">
                                        <span className="text-blue-500 font-bold">{i+1}.</span>
                                        {rule}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* RIGHT: STATS & CHART */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* KPI Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-[#151924] p-4 rounded-lg border border-[#2a2e39]">
                                <div className="text-gray-500 text-xs font-bold uppercase mb-1">Win Rate</div>
                                <div className={`text-2xl font-bold font-mono ${stat.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                                    {stat.winRate.toFixed(1)}%
                                </div>
                            </div>
                            <div className="bg-[#151924] p-4 rounded-lg border border-[#2a2e39]">
                                <div className="text-gray-500 text-xs font-bold uppercase mb-1">Net PnL</div>
                                <div className={`text-2xl font-bold font-mono ${stat.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    ${stat.pnl.toLocaleString()}
                                </div>
                            </div>
                            <div className="bg-[#151924] p-4 rounded-lg border border-[#2a2e39]">
                                <div className="text-gray-500 text-xs font-bold uppercase mb-1">Total Trades</div>
                                <div className="text-2xl font-bold text-white font-mono">
                                    {stat.total}
                                </div>
                            </div>
                            <div className="bg-[#151924] p-4 rounded-lg border border-[#2a2e39]">
                                <div className="text-gray-500 text-xs font-bold uppercase mb-1">Win Streak</div>
                                <div className="text-2xl font-bold text-yellow-400 font-mono">
                                    {/* Simple Calc for Streak */}
                                    {stat.history.reduce((streak, trade) => trade.backtestResult === 'WIN' ? streak + 1 : 0, 0)}
                                </div>
                            </div>
                        </div>

                        {/* Trade History Table */}
                        <div className="bg-[#151924] border border-[#2a2e39] rounded-xl overflow-hidden shadow-lg">
                            <div className="p-4 border-b border-[#2a2e39] bg-[#1e222d] flex justify-between items-center">
                                <h3 className="font-bold text-white">Last 10 Executions</h3>
                                <span className="text-xs text-gray-500">{selectedModel} ONLY</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="text-xs text-gray-500 uppercase bg-[#151924] border-b border-[#2a2e39]">
                                        <tr>
                                            <th className="px-4 py-3">Time</th>
                                            <th className="px-4 py-3">Type</th>
                                            <th className="px-4 py-3 font-mono">Price</th>
                                            <th className="px-4 py-3 text-center">Result</th>
                                            <th className="px-4 py-3 text-right font-mono">PnL</th>
                                            <th className="px-4 py-3 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#2a2e39]">
                                        {stat.history.map((trade, i) => (
                                            <tr key={i} className="hover:bg-[#1e222d] transition-colors">
                                                <td className="px-4 py-3 text-gray-300">
                                                    {new Date((trade.time as number) * 1000).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${trade.type === 'LONG' ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}>
                                                        {trade.type}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-mono text-gray-300">${trade.price.toFixed(2)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`font-bold ${trade.backtestResult === 'WIN' ? 'text-green-500' : 'text-red-500'}`}>
                                                        {trade.backtestResult}
                                                    </span>
                                                </td>
                                                <td className={`px-4 py-3 text-right font-mono font-bold ${trade.backtestPnL && trade.backtestPnL > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {trade.backtestPnL?.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button 
                                                        onClick={() => {
                                                            onViewOnChart(trade);
                                                        }}
                                                        className="text-blue-400 hover:text-white text-xs underline font-bold bg-blue-900/20 px-2 py-1 rounded border border-blue-900/50 hover:bg-blue-600 hover:border-blue-500 transition-all"
                                                    >
                                                        Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {stat.history.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="p-8 text-center text-gray-500">No recent trades found for this setup.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
