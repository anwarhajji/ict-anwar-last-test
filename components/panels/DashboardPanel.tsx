
import React, { useState, useMemo } from 'react';
import { BacktestStats, TradeEntry } from '../../types';

interface DashboardPanelProps {
    balance: number;
    backtestStats: BacktestStats | null;
    positions: TradeEntry[];
    tradeHistory: TradeEntry[];
    currentAsset: string;
    onAssetChange: (asset: string) => void;
    onClose?: () => void;
}

export const DashboardPanel: React.FC<DashboardPanelProps> = ({ 
    balance, 
    backtestStats, 
    positions, 
    tradeHistory = [], // Default to empty array
    currentAsset, 
    onAssetChange, 
    onClose 
}) => {
    // Local State for Dashboard Views
    const [subTab, setSubTab] = useState<'OVERVIEW' | 'COMPARE' | '15m' | '5m' | '1m'>('OVERVIEW');

    // --- CALCULATE MANUAL TRADING STATS (Real-time from Paper Trading) ---
    const manualStats = useMemo(() => {
        const closedTrades = tradeHistory.filter(t => t.result !== 'OPEN');
        const wins = closedTrades.filter(t => t.result === 'WIN');
        const losses = closedTrades.filter(t => t.result === 'LOSS');
        const totalTrades = closedTrades.length;
        const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;
        const netPnL = closedTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
        
        const totalWinAmt = wins.reduce((acc, t) => acc + (t.pnl || 0), 0);
        const totalLossAmt = Math.abs(losses.reduce((acc, t) => acc + (t.pnl || 0), 0));
        const avgWin = wins.length > 0 ? totalWinAmt / wins.length : 0;
        const avgLoss = losses.length > 0 ? totalLossAmt / losses.length : 0;
        const profitFactor = totalLossAmt > 0 ? totalWinAmt / totalLossAmt : (totalWinAmt > 0 ? 999 : 0);
        
        // Drawdown Calc (Simplified relative to current balance history)
        let peak = 0;
        let maxDd = 0;
        let run = 0;
        // Reconstruct equity curve roughly
        closedTrades.slice().reverse().forEach(t => { // tradeHistory is usually desc, so reverse for chrono
            run += (t.pnl || 0);
            if (run > peak) peak = run;
            const dd = peak - run;
            if (dd > maxDd) maxDd = dd;
        });

        return { totalTrades, wins: wins.length, losses: losses.length, winRate, netPnL, profitFactor, maxDrawdown: maxDd, avgWin, avgLoss };
    }, [tradeHistory]);

    // --- PERIOD AGGREGATION (Day / Week / Month) ---
    const periodStats = useMemo(() => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000;
        
        // Start of Week (Sunday)
        const day = now.getDay();
        const diff = now.getDate() - day; 
        const startOfWeek = new Date(now.setDate(diff)).setHours(0,0,0,0) / 1000;
        
        // Reset Date for Month calc
        const now2 = new Date();
        const startOfMonth = new Date(now2.getFullYear(), now2.getMonth(), 1).getTime() / 1000;

        let daily = 0, weekly = 0, monthly = 0;

        tradeHistory.forEach(t => {
            if (t.result === 'OPEN') return;
            const time = t.time as number;
            const pnl = t.pnl || 0;

            if (time >= startOfDay) daily += pnl;
            if (time >= startOfWeek) weekly += pnl;
            if (time >= startOfMonth) monthly += pnl;
        });

        return { daily, weekly, monthly };
    }, [tradeHistory]);


    // DECIDE WHICH STATS TO SHOW (Manual vs Backtest)
    // If user has manual trades, show those. Otherwise show Backtest.
    const showManual = tradeHistory.length > 0;
    const activeStats = showManual ? manualStats : (backtestStats || {
        totalTrades: 0, wins: 0, losses: 0, winRate: 0, netPnL: 0, profitFactor: 0, maxDrawdown: 0, equityCurve: []
    });

    const safeWinRateVal = activeStats.winRate || 0;
    const safeProfitFactor = activeStats.profitFactor || 0;
    const safeTotalTrades = activeStats.totalTrades || 0;
    const safePnL = activeStats.netPnL || 0;
    const safeDrawdown = activeStats.maxDrawdown || 0;
    
    // Manual stats have explicit avgWin/Loss, Backtest might not in this shape
    // @ts-ignore
    const avgWin = showManual ? activeStats.avgWin : 0; 
    // @ts-ignore
    const avgLoss = showManual ? activeStats.avgLoss : 0;

    const assets = [
        { id: 'MGC (COMEX)', label: 'Gold (Micro)', icon: '🟡' },
        { id: 'BTCUSDT', label: 'Bitcoin', icon: '₿' },
        { id: 'ETHUSDT', label: 'Ethereum', icon: '⟠' },
        { id: 'SOLUSDT', label: 'Solana', icon: '◎' },
        { id: 'EURUSDT', label: 'Euro', icon: '€' }
    ];

    const MetricCard = ({ title, value, subValue, color }: { title: string, value: string, subValue?: string, color: string }) => (
        <div className="bg-[#1e222d] p-5 rounded-lg border border-gray-800 shadow-sm relative overflow-hidden group hover:border-gray-600 transition-all">
            <div className={`absolute top-0 left-0 w-1 h-full ${color}`}></div>
            <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">{title}</div>
            <div className="text-2xl font-mono font-bold text-white mb-1">{value}</div>
            {subValue && <div className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors">{subValue}</div>}
        </div>
    );

    const ProgressBar = ({ label, value, color }: { label: string, value: number, color: string }) => {
        const cleanValue = Math.min(100, Math.max(0, (isNaN(value) || !isFinite(value)) ? 0 : value));
        return (
            <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">{label}</span>
                    <span className="text-white font-bold">{cleanValue.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div className={`h-full ${color}`} style={{ width: `${cleanValue}%` }}></div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full h-full bg-[#0b0e11] overflow-y-auto custom-scrollbar">
            <div className="max-w-7xl mx-auto p-6 md:p-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-6 border-b border-[#2a2e39] gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Trading Dashboard</h1>
                        <p className="text-gray-500 text-sm">
                            Performance metrics for <span className="text-blue-400 font-bold">{currentAsset}</span> 
                            {showManual ? ' (Paper Trading)' : ' (Algorithm Backtest)'}
                        </p>
                    </div>
                    {/* Date/Status Pill */}
                    <div className="bg-[#151924] border border-[#2a2e39] rounded-full px-4 py-1.5 flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                         <span className="text-xs font-bold text-gray-300">SYSTEM ONLINE</span>
                    </div>
                </div>

                {/* ASSET SUBMENU */}
                <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                    {assets.map(asset => (
                        <button
                            key={asset.id}
                            onClick={() => onAssetChange(asset.id)}
                            className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-bold whitespace-nowrap transition-all border ${
                                currentAsset === asset.id 
                                ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.2)]' 
                                : 'bg-[#151924] border-[#2a2e39] text-gray-400 hover:text-white hover:border-gray-500 hover:bg-[#1e222d]'
                            }`}
                        >
                            <span className="text-base">{asset.icon}</span>
                            {asset.label}
                        </button>
                    ))}
                </div>

                {subTab === 'OVERVIEW' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2">
                        {/* Top Metrics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <MetricCard 
                                title="Account Balance" 
                                value={`$${balance.toLocaleString(undefined, {minimumFractionDigits: 2})}`} 
                                subValue="Simulated Live Account" 
                                color="bg-blue-500" 
                            />
                            <MetricCard 
                                title="Net PnL" 
                                value={`$${safePnL.toLocaleString(undefined, {minimumFractionDigits: 2})}`} 
                                subValue={safePnL >= 0 ? "Profit Target: In Progress" : "Drawdown Active"} 
                                color={safePnL >= 0 ? "bg-green-500" : "bg-red-500"} 
                            />
                            <MetricCard 
                                title="Profit Factor" 
                                value={safeProfitFactor.toFixed(2)} 
                                subValue="Target: > 1.5" 
                                color="bg-purple-500" 
                            />
                            <MetricCard 
                                title="Win Rate" 
                                value={`${safeWinRateVal.toFixed(1)}%`} 
                                subValue={`${activeStats.wins}W - ${activeStats.losses}L`} 
                                color="bg-yellow-500" 
                            />
                        </div>

                        {/* Analysis Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                            
                            {/* Left: Performance Circle */}
                            <div className="bg-[#151924] p-6 rounded-xl border border-[#2a2e39] col-span-1 shadow-lg">
                                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>
                                    Win/Loss Ratio
                                </h3>
                                <div className="flex flex-col items-center justify-center mb-8">
                                    <div className="relative w-40 h-40 flex items-center justify-center rounded-full border-[12px] border-[#1e222d]">
                                        <div className="absolute inset-0 rounded-full border-[12px] border-blue-500 transition-all duration-1000 ease-out" 
                                             style={{ 
                                                 clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%)`, 
                                                 transform: `rotate(${safeWinRateVal ? (safeWinRateVal/100)*360 : 0}deg)`, 
                                                 opacity: 0.8 
                                             }}>
                                        </div>
                                        <div className="text-center z-10">
                                            <div className="text-3xl font-bold text-white">{safeWinRateVal.toFixed(0)}%</div>
                                            <div className="text-[10px] text-gray-500 uppercase tracking-wide">Efficiency</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                     <ProgressBar label="Winning Trades" value={safeWinRateVal} color="bg-blue-500" />
                                     <ProgressBar label="Losing Trades" value={100 - safeWinRateVal} color="bg-red-500" />
                                </div>
                            </div>

                            {/* Right: Detailed Stats Grid */}
                            <div className="bg-[#151924] p-6 rounded-xl border border-[#2a2e39] col-span-1 lg:col-span-2 shadow-lg flex flex-col">
                                 <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                                    Key Performance Indicators
                                 </h3>
                                 
                                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-auto">
                                    <div className="bg-[#0b0e11] p-4 rounded-lg border border-[#2a2e39] hover:border-blue-500/30 transition-colors">
                                        <div className="text-gray-500 text-xs uppercase mb-1">Avg Win</div>
                                        <div className="text-green-400 font-bold font-mono text-lg">${avgWin.toFixed(2)}</div>
                                    </div>
                                    <div className="bg-[#0b0e11] p-4 rounded-lg border border-[#2a2e39] hover:border-blue-500/30 transition-colors">
                                        <div className="text-gray-500 text-xs uppercase mb-1">Avg Loss</div>
                                        <div className="text-red-400 font-bold font-mono text-lg">${avgLoss.toFixed(2)}</div>
                                    </div>
                                    <div className="bg-[#0b0e11] p-4 rounded-lg border border-[#2a2e39] hover:border-blue-500/30 transition-colors">
                                        <div className="text-gray-500 text-xs uppercase mb-1">Reward : Risk</div>
                                        <div className="text-white font-bold font-mono text-lg">
                                            {(avgLoss > 0 ? (avgWin / avgLoss) : 0).toFixed(1)} : 1
                                        </div>
                                    </div>
                                    <div className="bg-[#0b0e11] p-4 rounded-lg border border-[#2a2e39] hover:border-blue-500/30 transition-colors">
                                        <div className="text-gray-500 text-xs uppercase mb-1">Max Drawdown</div>
                                        <div className="text-red-500 font-bold font-mono text-lg">${safeDrawdown.toFixed(2)}</div>
                                    </div>
                                     <div className="bg-[#0b0e11] p-4 rounded-lg border border-[#2a2e39] hover:border-blue-500/30 transition-colors">
                                        <div className="text-gray-500 text-xs uppercase mb-1">Consistency Score</div>
                                        <div className="text-yellow-400 font-bold font-mono text-lg">{showManual ? '7.5' : '8.5'}</div>
                                    </div>
                                     <div className="bg-[#0b0e11] p-4 rounded-lg border border-[#2a2e39] hover:border-blue-500/30 transition-colors">
                                        <div className="text-gray-500 text-xs uppercase mb-1">Total Trades</div>
                                        <div className="text-blue-400 font-bold font-mono text-lg">{safeTotalTrades}</div>
                                    </div>
                                 </div>
                                 
                                 <div className="mt-8 pt-6 border-t border-[#2a2e39]">
                                     <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase">Period Performance (Paper Trading)</h4>
                                     </div>
                                     <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        <div className="bg-[#0b0e11] p-3 rounded border border-[#2a2e39] text-center">
                                            <div className="text-[10px] text-gray-500 mb-1 uppercase">Today</div>
                                            <div className={`font-bold font-mono text-sm ${periodStats.daily >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                ${periodStats.daily.toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="bg-[#0b0e11] p-3 rounded border border-[#2a2e39] text-center">
                                            <div className="text-[10px] text-gray-500 mb-1 uppercase">This Week</div>
                                            <div className={`font-bold font-mono text-sm ${periodStats.weekly >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                ${periodStats.weekly.toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="bg-[#0b0e11] p-3 rounded border border-[#2a2e39] text-center">
                                            <div className="text-[10px] text-gray-500 mb-1 uppercase">This Month</div>
                                            <div className={`font-bold font-mono text-sm ${periodStats.monthly >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                ${periodStats.monthly.toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="bg-[#0b0e11] p-3 rounded border border-[#2a2e39] text-center">
                                            <div className="text-[10px] text-gray-500 mb-1 uppercase">All Time</div>
                                            <div className={`font-bold font-mono text-sm ${manualStats.netPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                ${manualStats.netPnL.toFixed(2)}
                                            </div>
                                        </div>
                                     </div>
                                 </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {onClose && (
                    <button onClick={onClose} className="md:hidden w-full bg-gray-800 text-white py-3 rounded-lg font-bold">
                        Back to Chart
                    </button>
                )}
            </div>
        </div>
    );
};
