
import React, { useState, useMemo } from 'react';
import { BacktestStats, EntrySignal, TradeEntry, ICTSetupType } from '../../types';

interface StatsPanelProps {
    backtestStats: BacktestStats;
    recentHistory: EntrySignal[];
    tradeHistory?: TradeEntry[]; // Manual Trades
    setClickedEntry: (e: EntrySignal) => void;
    onFocusEntry?: (e: EntrySignal) => void;
    focusedEntry?: EntrySignal | null;
    onReplay?: (e: EntrySignal) => void;
}

type SortKey = 'time' | 'type' | 'price' | 'pnl' | 'result' | 'setup' | 'score';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
    key: SortKey;
    direction: SortDirection;
}

interface FilterState {
    type: 'ALL' | 'LONG' | 'SHORT';
    result: 'ALL' | 'WIN' | 'LOSS' | 'OPEN';
    setup: 'ALL' | string;
    dateRange: 'ALL' | 'TODAY' | 'WEEK' | 'MONTH';
    timeframe: 'ALL' | string;
}

const SETUP_TYPES: string[] = ['2022 Model', 'Silver Bullet', 'Unicorn', 'OTE', 'Breaker', 'Standard FVG', '8 AM Hour'];

export const StatsPanel: React.FC<StatsPanelProps> = ({ backtestStats, recentHistory, tradeHistory = [], setClickedEntry, onFocusEntry, focusedEntry, onReplay }) => {
    const [viewMode, setViewMode] = useState<'MANUAL' | 'ALGO'>('ALGO');
    
    // Filter & Sort State
    const [filters, setFilters] = useState<FilterState>({ type: 'ALL', result: 'ALL', setup: 'ALL', dateRange: 'ALL', timeframe: 'ALL' });
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'time', direction: 'desc' });

    // --- DATA PROCESSING (Filter & Sort) ---
    const processedData = useMemo(() => {
        let data: any[] = viewMode === 'MANUAL' ? tradeHistory.filter(t => !t.id.startsWith('algo-')) : [...recentHistory];

        // 1. FILTER
        if (filters.type !== 'ALL') {
            data = data.filter(item => item.type === filters.type);
        }
        if (filters.result !== 'ALL') {
            data = data.filter(item => {
                const res = viewMode === 'MANUAL' ? (item as TradeEntry).result : (item as EntrySignal).backtestResult;
                return res === filters.result;
            });
        }
        if (filters.setup !== 'ALL' && viewMode === 'ALGO') {
            data = data.filter(item => (item as EntrySignal).setupName === filters.setup);
        }
        if (filters.timeframe !== 'ALL') {
            data = data.filter(item => {
                const tf = viewMode === 'MANUAL' ? (item as TradeEntry).timeframe : (item as EntrySignal).timeframe;
                return tf === filters.timeframe;
            });
        }

        // Date Range Filter
        if (filters.dateRange !== 'ALL') {
            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000;
            
            // Get Monday of current week
            const dayOfWeek = now.getDay();
            const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // adjust when day is sunday
            const startOfWeek = new Date(now.setDate(diff)).setHours(0,0,0,0) / 1000;
            
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000;

            data = data.filter(item => {
                const itemTime = item.time as number;
                if (filters.dateRange === 'TODAY') return itemTime >= startOfToday;
                if (filters.dateRange === 'WEEK') return itemTime >= startOfWeek;
                if (filters.dateRange === 'MONTH') return itemTime >= startOfMonth;
                return true;
            });
        }

        // 2. SORT
        data.sort((a, b) => {
            let valA: any;
            let valB: any;

            switch (sortConfig.key) {
                case 'time':
                    valA = a.time; valB = b.time;
                    break;
                case 'type':
                    valA = a.type; valB = b.type;
                    break;
                case 'price':
                    valA = a.price; valB = b.price;
                    break;
                case 'pnl':
                    valA = viewMode === 'MANUAL' ? (a as TradeEntry).pnl || 0 : (a as EntrySignal).backtestPnL || 0;
                    valB = viewMode === 'MANUAL' ? (b as TradeEntry).pnl || 0 : (b as EntrySignal).backtestPnL || 0;
                    break;
                case 'result':
                    valA = viewMode === 'MANUAL' ? (a as TradeEntry).result : (a as EntrySignal).backtestResult;
                    valB = viewMode === 'MANUAL' ? (b as TradeEntry).result : (b as EntrySignal).backtestResult;
                    break;
                case 'setup':
                     valA = (a as EntrySignal).setupName || '';
                     valB = (b as EntrySignal).setupName || '';
                     break;
                default:
                    return 0;
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return data;
    }, [tradeHistory, recentHistory, viewMode, filters, sortConfig]);

    // Calculate Filtered Stats
    const filteredStats = useMemo(() => {
        const wins = processedData.filter(t => (viewMode === 'MANUAL' ? t.result === 'WIN' : t.backtestResult === 'WIN')).length;
        const losses = processedData.filter(t => (viewMode === 'MANUAL' ? t.result === 'LOSS' : t.backtestResult === 'LOSS')).length;
        const total = wins + losses;
        const winRate = total > 0 ? (wins / total) * 100 : 0;
        const pnl = processedData.reduce((acc, t) => acc + (viewMode === 'MANUAL' ? (t.pnl || 0) : (t.backtestPnL || 0)), 0);
        
        return { wins, losses, total, winRate, pnl };
    }, [processedData, viewMode]);

    // --- SORTING HANDLER ---
    const handleSort = (key: SortKey) => {
        let direction: SortDirection = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ column }: { column: SortKey }) => {
        if (sortConfig.key !== column) return <span className="text-gray-600 ml-1 opacity-50">⇅</span>;
        return <span className="text-blue-400 ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
    };


    return (
        <div className="w-full h-full bg-[#0b0e11] overflow-y-auto custom-scrollbar flex flex-col">
            <div className="max-w-7xl mx-auto w-full p-6 md:p-8 flex-1 flex flex-col">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-6 border-b border-[#2a2e39] gap-4 shrink-0">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Trade History Journal</h1>
                        <p className="text-gray-500 text-sm">Detailed record of <span className="text-blue-400 font-bold">{viewMode === 'MANUAL' ? 'Paper Trading' : 'Algorithmic'}</span> executions.</p>
                    </div>
                    
                    {/* Toggle Switch */}
                    <div className="bg-[#151924] p-1 rounded-lg border border-[#2a2e39] flex">
                        <button 
                            onClick={() => setViewMode('MANUAL')}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${viewMode === 'MANUAL' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                        >
                            Paper Trades
                        </button>
                        <button 
                            onClick={() => setViewMode('ALGO')}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${viewMode === 'ALGO' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                        >
                            Algo Signals
                        </button>
                    </div>
                </div>
                
                {/* Summary Cards */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 shrink-0">
                    <div className="bg-[#151924] p-5 rounded-lg border border-[#2a2e39] shadow-sm">
                        <div className="text-gray-500 text-xs uppercase font-bold mb-1">Win Rate</div>
                        <div className="text-2xl font-bold text-white font-mono">
                            {filteredStats.winRate.toFixed(1)}%
                        </div>
                    </div>
                    <div className="bg-[#151924] p-5 rounded-lg border border-[#2a2e39] shadow-sm">
                        <div className="text-gray-500 text-xs uppercase font-bold mb-1">Net PnL</div>
                        <div className={`text-2xl font-bold font-mono ${filteredStats.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ${filteredStats.pnl.toLocaleString()}
                        </div>
                    </div>
                    <div className="bg-[#151924] p-5 rounded-lg border border-[#2a2e39] shadow-sm">
                        <div className="text-gray-500 text-xs uppercase font-bold mb-1">Total Trades</div>
                        <div className="text-2xl font-bold text-white font-mono">
                            {filteredStats.total}
                        </div>
                    </div>
                    <div className="bg-[#151924] p-5 rounded-lg border border-[#2a2e39] shadow-sm">
                        <div className="text-gray-500 text-xs uppercase font-bold mb-1">Performance</div>
                        <div className={`text-2xl font-bold font-mono ${filteredStats.pnl > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                             {filteredStats.pnl > 0 ? 'PROFITABLE' : 'NEUTRAL'}
                        </div>
                    </div>
                 </div>

                 {/* FILTER BAR */}
                 <div className="flex flex-wrap gap-4 mb-4 items-center">
                    <div className="flex items-center gap-1 bg-[#151924] p-1 rounded-lg border border-[#2a2e39]">
                        {(['ALL', 'TODAY', 'WEEK', 'MONTH'] as const).map(period => (
                            <button
                                key={period}
                                onClick={() => setFilters({...filters, dateRange: period})}
                                className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${filters.dateRange === period ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                            >
                                {period === 'ALL' ? 'All Time' : period === 'TODAY' ? 'Daily' : period === 'WEEK' ? 'Weekly' : 'Monthly'}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500 uppercase">Type:</span>
                        <select 
                            value={filters.type} 
                            onChange={(e) => setFilters({...filters, type: e.target.value as any})}
                            className="bg-[#151924] text-white text-sm border border-gray-700 rounded px-2 py-1 outline-none focus:border-blue-500"
                        >
                            <option value="ALL">All</option>
                            <option value="LONG">Long</option>
                            <option value="SHORT">Short</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500 uppercase">Result:</span>
                        <select 
                            value={filters.result} 
                            onChange={(e) => setFilters({...filters, result: e.target.value as any})}
                            className="bg-[#151924] text-white text-sm border border-gray-700 rounded px-2 py-1 outline-none focus:border-blue-500"
                        >
                            <option value="ALL">All</option>
                            <option value="WIN">Win</option>
                            <option value="LOSS">Loss</option>
                            {viewMode === 'MANUAL' && <option value="OPEN">Open</option>}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500 uppercase">TF:</span>
                        <select 
                            value={filters.timeframe} 
                            onChange={(e) => setFilters({...filters, timeframe: e.target.value})}
                            className="bg-[#151924] text-white text-sm border border-gray-700 rounded px-2 py-1 outline-none focus:border-blue-500"
                        >
                            <option value="ALL">All</option>
                            <option value="1m">1m</option>
                            <option value="5m">5m</option>
                            <option value="15m">15m</option>
                            <option value="1H">1H</option>
                            <option value="4H">4H</option>
                            <option value="1D">1D</option>
                        </select>
                    </div>
                    {viewMode === 'ALGO' && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-500 uppercase">Setup:</span>
                            <select 
                                value={filters.setup} 
                                onChange={(e) => setFilters({...filters, setup: e.target.value as any})}
                                className="bg-[#151924] text-white text-sm border border-gray-700 rounded px-2 py-1 outline-none focus:border-blue-500"
                            >
                                <option value="ALL">All Models</option>
                                {SETUP_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    )}
                    <div className="flex-1"></div>
                    <div className="text-xs text-gray-500 italic">
                        Showing {processedData.length} records
                    </div>
                 </div>

                 {/* TABLE CONTAINER */}
                 <div className="flex-1 min-h-0 bg-[#151924] rounded-xl border border-[#2a2e39] shadow-lg flex flex-col overflow-hidden">
                    
                    <div className="flex-1 overflow-auto custom-scrollbar relative">
                        {viewMode === 'MANUAL' ? (
                            // MANUAL TRADES TABLE
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead className="sticky top-0 z-30">
                                    <tr className="bg-[#1e222d] text-xs text-gray-400 uppercase border-b border-[#2a2e39] shadow-sm">
                                        <th className="p-4 font-bold whitespace-nowrap cursor-pointer hover:bg-[#2a2e39]" onClick={() => handleSort('time')}>
                                            Date & Time <SortIcon column="time" />
                                        </th>
                                        <th className="p-4 font-bold cursor-pointer hover:bg-[#2a2e39]" onClick={() => handleSort('type')}>
                                            Type <SortIcon column="type" />
                                        </th>
                                        <th className="p-4 font-bold font-mono">Algo Signal</th>
                                        <th className="p-4 font-bold font-mono">TF</th>
                                        <th className="p-4 font-bold font-mono">Lot Size</th>
                                        <th className="p-4 font-bold font-mono cursor-pointer hover:bg-[#2a2e39]" onClick={() => handleSort('price')}>
                                            Entry Price <SortIcon column="price" />
                                        </th>
                                        <th className="p-4 font-bold font-mono">Stop / TP</th>
                                        <th className="p-4 font-bold text-center cursor-pointer hover:bg-[#2a2e39]" onClick={() => handleSort('result')}>
                                            Result <SortIcon column="result" />
                                        </th>
                                        <th className="p-4 font-bold font-mono text-right cursor-pointer hover:bg-[#2a2e39]" onClick={() => handleSort('pnl')}>
                                            PnL <SortIcon column="pnl" />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-[#2a2e39]">
                                    {processedData.map((trade: TradeEntry) => {
                                        const isWin = trade.result === 'WIN';
                                        const isLoss = trade.result === 'LOSS';
                                        const pnlColor = isWin ? 'text-green-400' : isLoss ? 'text-red-400' : 'text-gray-400';
                                        
                                        return (
                                            <tr key={trade.id} className="hover:bg-[#1f2937] transition-colors">
                                                <td className="p-4 text-gray-300 font-mono text-xs whitespace-nowrap">
                                                    <div className="font-bold">{new Date((trade.time as number) * 1000).toLocaleDateString()}</div>
                                                    <div className="text-gray-500">{new Date((trade.time as number) * 1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-md border ${trade.type === 'LONG' ? 'bg-green-900/20 text-green-400 border-green-900/50' : 'bg-red-900/20 text-red-400 border-red-900/50'}`}>
                                                        {trade.type}
                                                    </span>
                                                </td>
                                                <td className="p-4 font-mono text-xs text-blue-400">{trade.algoSignal || '-'}</td>
                                                <td className="p-4 font-mono text-xs text-gray-400">{trade.timeframe || '-'}</td>
                                                <td className="p-4 font-mono text-xs text-gray-300">{(trade.lotSize || 0).toFixed(2)}</td>
                                                <td className="p-4 font-mono text-xs text-white">{trade.price.toFixed(2)}</td>
                                                <td className="p-4 font-mono text-xs text-gray-400">
                                                    <div className="flex flex-col">
                                                        <span className="text-red-400/80">SL: {trade.stopLoss.toFixed(2)}</span>
                                                        <span className="text-green-400/80">TP: {trade.takeProfit.toFixed(2)}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`font-bold text-xs px-2 py-1 rounded ${isWin ? 'bg-green-500/10 text-green-500' : isLoss ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                                        {trade.result || 'OPEN'}
                                                    </span>
                                                </td>
                                                <td className={`p-4 font-mono font-bold text-right text-base ${pnlColor}`}>
                                                    {trade.pnl ? (trade.pnl > 0 ? '+' : '') + trade.pnl.toFixed(2) : '--'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {processedData.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="p-12 text-center text-gray-500">
                                                <div className="text-lg mb-2">No trades match your filters.</div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            // ALGO TRADES TABLE (Existing)
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead className="sticky top-0 z-30">
                                    <tr className="bg-[#1e222d] text-xs text-gray-400 uppercase border-b border-[#2a2e39] shadow-sm">
                                        <th className="p-4 font-bold text-center sticky left-0 bg-[#1e222d] border-r border-[#2a2e39] shadow-[4px_0_8px_rgba(0,0,0,0.2)] w-28 z-40">Actions</th>
                                        <th className="p-4 font-bold whitespace-nowrap cursor-pointer hover:bg-[#2a2e39]" onClick={() => handleSort('time')}>
                                            Date & Time <SortIcon column="time" />
                                        </th>
                                        <th className="p-4 font-bold cursor-pointer hover:bg-[#2a2e39]" onClick={() => handleSort('type')}>
                                            Type <SortIcon column="type" />
                                        </th>
                                        <th className="p-4 font-bold cursor-pointer hover:bg-[#2a2e39]" onClick={() => handleSort('setup')}>
                                            Setup <SortIcon column="setup" />
                                        </th>
                                        <th className="p-4 font-bold font-mono">TF</th>
                                        <th className="p-4 font-bold font-mono cursor-pointer hover:bg-[#2a2e39]" onClick={() => handleSort('price')}>
                                            Entry Price <SortIcon column="price" />
                                        </th>
                                        <th className="p-4 font-bold font-mono">Stop Loss</th>
                                        <th className="p-4 font-bold font-mono">Take Profit</th>
                                        <th className="p-4 font-bold text-center cursor-pointer hover:bg-[#2a2e39]" onClick={() => handleSort('result')}>
                                            Result <SortIcon column="result" />
                                        </th>
                                        <th className="p-4 font-bold font-mono text-right cursor-pointer hover:bg-[#2a2e39]" onClick={() => handleSort('pnl')}>
                                            PnL <SortIcon column="pnl" />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-[#2a2e39]">
                                    {processedData.map((entry: EntrySignal, i) => {
                                        const isFocused = focusedEntry && entry.time === focusedEntry.time;
                                        const isWin = entry.backtestResult === 'WIN';
                                        const isLoss = entry.backtestResult === 'LOSS';
                                        const pnlColor = isWin ? 'text-green-400' : isLoss ? 'text-red-400' : 'text-gray-400';
                                        
                                        return (
                                            <tr 
                                                key={i} 
                                                className={`hover:bg-[#1f2937] transition-colors cursor-pointer group ${isFocused ? 'bg-blue-900/10' : 'bg-[#151924]'}`}
                                                onClick={() => setClickedEntry(entry)}
                                            >
                                                <td className="p-3 sticky left-0 bg-[#151924] group-hover:bg-[#1f2937] border-r border-[#2a2e39] shadow-[4px_0_8px_rgba(0,0,0,0.2)] z-20">
                                                    <div className="flex items-center justify-center gap-3">
                                                        {onReplay && (
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); onReplay(entry); }}
                                                                className="p-1.5 rounded bg-gray-700 text-gray-300 hover:text-blue-400 hover:bg-gray-600 border border-gray-600 transition-all shadow-sm"
                                                                title="Replay this Trade"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                                            </button>
                                                        )}
                                                        {onFocusEntry && (
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); onFocusEntry(entry); }} 
                                                                className={`p-1.5 rounded transition-all border shadow-sm ${isFocused ? 'bg-blue-600 text-white border-blue-500' : 'bg-gray-700 text-gray-300 hover:text-white hover:bg-gray-600 border-gray-600'}`} 
                                                                title={isFocused ? "Currently Viewing" : "View on Chart"}
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="22" y1="12" x2="18" y2="12"></line><line x1="6" y1="12" x2="2" y2="12"></line><line x1="12" y1="6" x2="12" y2="2"></line><line x1="12" y1="22" x2="12" y2="18"></line></svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="p-4 text-gray-300 font-mono text-xs whitespace-nowrap">
                                                    <div className="font-bold">{new Date((entry.time as number) * 1000).toLocaleDateString()}</div>
                                                    <div className="text-gray-500">{new Date((entry.time as number) * 1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-md border ${entry.type === 'LONG' ? 'bg-green-900/20 text-green-400 border-green-900/50' : 'bg-red-900/20 text-red-400 border-red-900/50'}`}>
                                                        {entry.type}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-white text-xs font-medium">{entry.setupName || 'Standard Entry'}</div>
                                                    <div className="text-[10px] text-gray-500">Grade: {entry.setupGrade || 'N/A'}</div>
                                                </td>
                                                <td className="p-4 font-mono text-xs text-gray-400">{entry.timeframe || '-'}</td>
                                                <td className="p-4 font-mono text-xs text-white opacity-90">{entry.price.toFixed(2)}</td>
                                                <td className="p-4 font-mono text-xs text-gray-400">{entry.sl.toFixed(2)}</td>
                                                <td className="p-4 font-mono text-xs text-gray-400">{entry.tp.toFixed(2)}</td>
                                                <td className="p-4 text-center">
                                                    <span className={`font-bold text-xs px-2 py-1 rounded ${isWin ? 'bg-green-500/10 text-green-500' : isLoss ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                                        {entry.backtestResult}
                                                    </span>
                                                </td>
                                                <td className={`p-4 font-mono font-bold text-right text-base ${pnlColor}`}>
                                                    {entry.backtestPnL && entry.backtestPnL > 0 ? '+' : ''}{entry.backtestPnL?.toFixed(2)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {processedData.length === 0 && (
                                        <tr>
                                            <td colSpan={9} className="p-12 text-center text-gray-500">
                                                <div className="text-lg mb-2">No signals match your filters.</div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                 </div>
            </div>
        </div>
    );
};
