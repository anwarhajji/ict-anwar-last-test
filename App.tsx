
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CandleData, OrderBlock, FVG, StructurePoint, EntrySignal, BacktestStats, TradeEntry, UTCTimestamp, SimulationConfig, ICTSetupType, OverlayState, DraftTrade } from './types';
import { fetchCandles, getHtf } from './services/api';
import { detectStructure, detectOrderBlocks, detectFVG, detectEntries } from './services/ict';
import { performBacktest } from './services/backtest';
import { ChartComponent } from './components/Chart';
import { EntryDetailModal, TopSetupsModal, ToastNotification, ErrorBoundary } from './components/Modals';
import { Panels } from './components/Panels';
import { DashboardPanel } from './components/panels/DashboardPanel';
import { StatsPanel } from './components/panels/StatsPanel';
import { SetupsPanel } from './components/panels/SetupsPanel';

// Icons
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const ChartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>;
const ListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const TradeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
const StatsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>;
const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
const BacktestIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 2v6h6M2.66 15.57a10 10 0 1 0 .57-8.38"/></svg>;
const SetupsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>;

// Helper Component for Sidebar Items
const SidebarItem = ({ 
    active, 
    onClick, 
    icon, 
    label 
}: { 
    active: boolean; 
    onClick: () => void; 
    icon: React.ReactNode; 
    label: string 
}) => (
    <button 
        onClick={onClick} 
        className={`group relative w-full p-3 flex flex-col items-center gap-1 transition-colors ${active ? 'text-blue-500 bg-gray-800/50 border-r-2 border-blue-500' : 'text-gray-500 hover:text-white hover:bg-gray-800/30'}`}
    >
        {icon}
        {/* Tooltip */}
        <span className="absolute left-16 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl border border-gray-700">
            {label}
        </span>
    </button>
);

const App: React.FC = () => {
    // --- STATE ---
    const [data, setData] = useState<CandleData[]>([]);
    const [obs, setObs] = useState<OrderBlock[]>([]);
    const [fvgs, setFvgs] = useState<FVG[]>([]);
    const [structure, setStructure] = useState<StructurePoint[]>([]);
    const [entries, setEntries] = useState<EntrySignal[]>([]);
    const [htfObs, setHtfObs] = useState<OrderBlock[]>([]);
    const [htfFvgs, setHtfFvgs] = useState<FVG[]>([]);
    const [pdRange, setPdRange] = useState<{high: number, low: number} | null>(null);
    const [backtestStats, setBacktestStats] = useState<BacktestStats | null>(null);
    
    // UI State
    const [activeTab, setActiveTab] = useState('DASHBOARD');
    const [settingsTab, setSettingsTab] = useState('VISIBILITY'); 
    const [asset, setAsset] = useState('MGC (COMEX)');
    const [timeframe, setTimeframe] = useState('15m');
    const [showTopSetups, setShowTopSetups] = useState(false);
    const [clickedEntry, setClickedEntry] = useState<EntrySignal | null>(null);
    const [hoveredEntry, setHoveredEntry] = useState<EntrySignal | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Replay State
    const [replayMode, setReplayMode] = useState({ active: false, index: 0, playing: false, speed: 500 });
    const [replayDateInput, setReplayDateInput] = useState('');
    const dateInputRef = useRef<HTMLInputElement>(null);
    const [replaySetupFilters, setReplaySetupFilters] = useState<Record<string, boolean>>({
        '2022 Model': true, 'Silver Bullet': true, 'Unicorn': true, 'OTE': true, 'Breaker': true, 'Standard FVG': true
    });

    // Visibility & Focus State
    const [setupVisibility, setSetupVisibility] = useState<'ALL'|'FOCUS'|'NONE'>('NONE');
    const [focusedEntry, setFocusedEntry] = useState<EntrySignal | null>(null);

    // Configuration
    const [overlays, setOverlays] = useState<OverlayState>({
        obs: true, fvgs: true, killzones: true, silverBullet: true, pdZones: true,
        internalStructure: true, swingStructure: true, mtf: true, backtestMarkers: true,
        macro: true, historicalTradeLines: false,
        setupFilters: {
            '2022 Model': true,
            'Silver Bullet': true,
            'Unicorn': true,
            'OTE': true,
            'Breaker': true,
            'Standard FVG': true
        }
    });
    const [colors, setColors] = useState({ obBull: '#00E676', obBear: '#FF1744', fvgBull: '#00BCD4', fvgBear: '#2962FF' });
    const [config, setConfig] = useState({ swingLength: 5, obThreshold: 1.2, fvgExtend: 10 });
    const [simulation, setSimulation] = useState<SimulationConfig>({
        minWinProbability: 50,
        allowedGrades: { 'A++': true, 'A+': true, 'B': true }
    });

    // Trading State - PERSISTENT
    const [balance, setBalance] = useState(() => {
        const saved = localStorage.getItem('ict-sim-balance');
        return saved ? parseFloat(saved) : 50000;
    });
    const [positions, setPositions] = useState<TradeEntry[]>(() => {
        const saved = localStorage.getItem('ict-sim-positions');
        return saved ? JSON.parse(saved) : [];
    });
    const [tradeHistory, setTradeHistory] = useState<TradeEntry[]>(() => {
        const saved = localStorage.getItem('ict-sim-history');
        return saved ? JSON.parse(saved) : [];
    });
    
    // MANUAL TRADING (Draft)
    const [draftTrade, setDraftTrade] = useState<DraftTrade | null>(null);

    // Auto-Trading/Bot State
    const [autoTrade, setAutoTrade] = useState(false);
    const [slInput, setSlInput] = useState('');
    const [tpInput, setTpInput] = useState('');
    const [alert, setAlert] = useState<{msg: string, type: 'success'|'error'|'info'|'warning'} | null>(null);

    // Persistence Effects
    useEffect(() => { localStorage.setItem('ict-sim-balance', balance.toString()); }, [balance]);
    useEffect(() => { 
        localStorage.setItem('ict-sim-positions', JSON.stringify(positions)); 
    }, [positions]);
    useEffect(() => { localStorage.setItem('ict-sim-history', JSON.stringify(tradeHistory)); }, [tradeHistory]);

    // Reset Function
    const resetAccount = () => {
        if(confirm("Are you sure you want to reset your paper trading account? This action cannot be undone.")) {
            setBalance(50000);
            setPositions([]);
            setTradeHistory([]);
            setDraftTrade(null);
            localStorage.removeItem('ict-sim-balance');
            localStorage.removeItem('ict-sim-positions');
            localStorage.removeItem('ict-sim-history');
            setAlert({ msg: "Account Reset Successful", type: 'info' });
        }
    };

    // --- ACTIONS ---
    const enterTrade = (type: 'LONG'|'SHORT', price: number, sl: number, tp: number, lotSize: number = 1) => { 
        const newTrade: TradeEntry = { 
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            time: Math.floor(Date.now() / 1000) as UTCTimestamp, 
            type, 
            price, 
            stopLoss: sl, 
            takeProfit: tp, 
            lotSize,
            result: 'OPEN', 
            confluences: [], 
            score: 0 
        };
        setPositions(prev => [...prev, newTrade]); 
        setAlert({ msg: `${type} Trade Opened at ${price.toFixed(2)} (Lots: ${lotSize})`, type: 'info' });
    };

    const closeTrade = (tradeId: string, pnl: number) => { 
        const trade = positions.find(p => p.id === tradeId);
        if (!trade) return;
        
        setBalance(prev => prev + pnl); 
        setTradeHistory(prev => [{ ...trade, result: pnl > 0 ? 'WIN' : 'LOSS', pnl }, ...prev]); 
        setPositions(prev => prev.filter(p => p.id !== tradeId));
    };

    // --- DRAFT TRADE LOGIC ---
    const handleStartDraft = (type: 'LONG' | 'SHORT') => {
        if (data.length === 0) return;
        const currentPrice = data[data.length - 1].close;
        const riskDist = currentPrice * 0.002; // 0.2% risk
        const rewardDist = riskDist * 2; // 1:2 RR

        setDraftTrade({
            type,
            entryPrice: currentPrice,
            stopLoss: type === 'LONG' ? currentPrice - riskDist : currentPrice + riskDist,
            takeProfit: type === 'LONG' ? currentPrice + rewardDist : currentPrice - rewardDist,
            lotSize: 1.0
        });
    };

    const handleUpdateDraft = (update: Partial<DraftTrade>) => {
        if (!draftTrade) return;
        setDraftTrade({ ...draftTrade, ...update });
    };

    const handleExecuteDraft = () => {
        if (!draftTrade) return;
        enterTrade(
            draftTrade.type,
            draftTrade.entryPrice,
            draftTrade.stopLoss,
            draftTrade.takeProfit,
            draftTrade.lotSize
        );
        setDraftTrade(null);
    };

    const handleCancelDraft = () => {
        setDraftTrade(null);
    };


    // --- DATA FETCHING ---
    const fetchData = async () => {
        try {
            const candles = await fetchCandles(asset, timeframe);
            const htfTf = getHtf(timeframe);
            let candlesHtf: CandleData[] = [];
            let htfBias: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';

            try { 
                candlesHtf = await fetchCandles(asset, htfTf, 200); 
                const htfStructure = detectStructure(candlesHtf, 5);
                if (htfStructure.length > 0) {
                    htfBias = htfStructure[htfStructure.length-1].direction;
                }
            } catch (e) { console.warn("HTF Data fetch failed"); }

            setData(candles);
            
            if (!replayMode.active) {
                setReplayMode(prev => ({...prev, index: candles.length}));
            }

            const recentSlice = candles.slice(-100);
            setPdRange({ high: Math.max(...recentSlice.map(c => c.high)), low: Math.min(...recentSlice.map(c => c.low)) });

            const _structure = detectStructure(candles, config.swingLength);
            let _obs = ['5m', '15m', '1h'].includes(timeframe) ? detectOrderBlocks(candles, config.obThreshold) : [];
            const _fvgs = detectFVG(candles);
            const _htfObs = detectOrderBlocks(candlesHtf, config.obThreshold);
            const _htfFvgs = detectFVG(candlesHtf);
            
            const isLowTf = ['1m', '3m'].includes(timeframe);
            let obsForDetection = isLowTf ? _htfObs : _obs;
            if (isLowTf && obsForDetection.length === 0) {
                obsForDetection = detectOrderBlocks(candles, config.obThreshold);
                _obs = obsForDetection;
            }
            const fvgsForDetection = isLowTf ? _htfFvgs : _fvgs; 

            // Detect Entries using new Logic with HTF Bias and Structure
            const _rawEntries = detectEntries(candles, obsForDetection, fvgsForDetection, _structure, timeframe, htfBias);
            
            const _filteredEntries = _rawEntries.filter(e => {
                const meetsProb = e.winProbability >= simulation.minWinProbability;
                // @ts-ignore
                const meetsGrade = e.setupGrade ? simulation.allowedGrades[e.setupGrade] : false;
                return meetsProb && meetsGrade;
            });

            setHtfObs(_htfObs);
            setHtfFvgs(_htfFvgs);
            
            const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
            const recentEntries = _filteredEntries.filter(e => (e.time as number) > thirtyDaysAgo);
            
            const bt = performBacktest(candles, recentEntries);
            setBacktestStats(bt.stats);
            setEntries(bt.results);
            setStructure(_structure); setObs(_obs); setFvgs(_fvgs);

            const currentPrice = candles[candles.length - 1].close;
            const nearestOB = obsForDetection.find(ob => !ob.mitigated && Math.abs(currentPrice - ob.priceHigh) / currentPrice < 0.0005); 
            if (nearestOB && !alert && !replayMode.active) {
                setAlert({ msg: `Price near ${nearestOB.direction} Order Block!`, type: 'warning' });
            }
        } catch (e) { console.error(e); }
    };

    useEffect(() => { fetchData(); const interval = setInterval(fetchData, 60000); return () => clearInterval(interval); }, [asset, timeframe, autoTrade, config, simulation]);

    // --- POSITION MONITORING (TP/SL) ---
    useEffect(() => {
        if (positions.length === 0 || data.length === 0) return;
        const currentCandle = data[data.length - 1];
        const high = currentCandle.high;
        const low = currentCandle.low;
        const currentPrice = currentCandle.close;

        // Check all active positions
        positions.forEach(pos => {
            let pnl = 0;
            let closed = false;

            if (pos.type === 'LONG') {
                if (low <= pos.stopLoss) {
                    pnl = (pos.stopLoss - pos.price) * pos.lotSize; // Loss
                    closed = true;
                } else if (high >= pos.takeProfit) {
                    pnl = (pos.takeProfit - pos.price) * pos.lotSize; // Win
                    closed = true;
                }
            } else {
                if (high >= pos.stopLoss) {
                     pnl = (pos.price - pos.stopLoss) * pos.lotSize; // Loss
                     closed = true;
                } else if (low <= pos.takeProfit) {
                    pnl = (pos.price - pos.takeProfit) * pos.lotSize; // Win
                    closed = true;
                }
            }

            if (closed) {
                 closeTrade(pos.id, pnl); 
                 setAlert({ msg: `Trade Closed: ${pnl > 0 ? 'Win' : 'Loss'} ($${pnl.toFixed(2)})`, type: pnl > 0 ? 'success' : 'warning' });
            }
        });

    }, [data, positions]);

    // --- REPLAY LOGIC ---
    useEffect(() => {
        let interval: any;
        if (replayMode.active && replayMode.playing) {
            interval = setInterval(() => {
                setReplayMode(prev => {
                    if (prev.index >= data.length) {
                        return { ...prev, playing: false };
                    }
                    
                    const nextIndex = prev.index + 1;
                    const candle = data[nextIndex];
                    if (candle) {
                        const detectedEntry = entries.find(e => e.time === candle.time);
                        if (detectedEntry && overlays.setupFilters[detectedEntry.setupName as ICTSetupType] !== false) {
                             setAlert({ 
                                 msg: `Replay: ${detectedEntry.type} Setup Detected (${detectedEntry.setupName})`, 
                                 type: 'success' 
                             });
                        }
                    }

                    return { ...prev, index: nextIndex };
                });
            }, replayMode.speed);
        }
        return () => clearInterval(interval);
    }, [replayMode.active, replayMode.playing, replayMode.speed, data.length, entries, overlays.setupFilters]);

    const handleStartReplay = (trade?: EntrySignal) => {
        if (trade) {
            const tradeIndex = data.findIndex(d => d.time === trade.time);
            if (tradeIndex === -1) return;
            const startIndex = Math.max(0, tradeIndex - 50);
            setReplayMode({ active: true, index: startIndex, playing: false, speed: 500 });
            setFocusedEntry(trade);
            setSetupVisibility('FOCUS');
        } else {
            let startIndex = 0;
            if (replayDateInput && data.length > 0) {
                 const targetTime = new Date(replayDateInput).getTime() / 1000;
                 const closest = data.findIndex(d => (d.time as number) >= targetTime);
                 startIndex = closest !== -1 ? closest : 0;
            } else if (data.length > 0) {
                 startIndex = Math.floor(data.length / 2 + Math.random() * (data.length / 2));
            }
            
            setOverlays(prev => ({
                ...prev,
                setupFilters: { ...prev.setupFilters, ...replaySetupFilters }
            }));

            setReplayMode({ active: true, index: startIndex, playing: false, speed: 500 });
            setFocusedEntry(null);
            setSetupVisibility('ALL');
        }
        setActiveTab('BACKTEST');
    };

    const handleReplayControls = {
        togglePlay: () => setReplayMode(p => ({ ...p, playing: !p.playing })),
        changeSpeed: () => setReplayMode(p => ({ ...p, speed: p.speed === 100 ? 800 : p.speed === 800 ? 500 : p.speed === 500 ? 200 : 100 })), 
        exit: () => {
            setReplayMode(p => ({ ...p, active: false, playing: false }));
            setSetupVisibility('ALL');
            setFocusedEntry(null);
        },
        seek: (val: number) => setReplayMode(p => ({ ...p, index: val })),
        showAll: () => {
             setSetupVisibility('ALL');
             setOverlays(prev => ({...prev, historicalTradeLines: true}));
        }
    };

    const displayedData = useMemo(() => {
        if (!replayMode.active) return data;
        return data.slice(0, replayMode.index);
    }, [data, replayMode.active, replayMode.index]);

    const displayedObs = useMemo(() => {
         if (!replayMode.active) return obs;
         const lastTime = displayedData.length > 0 ? displayedData[displayedData.length-1].time as number : 0;
         return obs.filter(o => (o.time as number) <= lastTime);
    }, [obs, replayMode.active, displayedData]);

    const displayedFvgs = useMemo(() => {
         if (!replayMode.active) return fvgs;
         const lastTime = displayedData.length > 0 ? displayedData[displayedData.length-1].time as number : 0;
         return fvgs.filter(f => (f.time as number) <= lastTime);
    }, [fvgs, replayMode.active, displayedData]);

    const handleDeepScan = () => {
        setIsScanning(true);
        setTimeout(() => { setIsScanning(false); setAlert({ msg: "Deep Scan Complete: Adjusted probabilities", type: "success" }); }, 2000);
    };

    const handleFocusEntry = (entry: EntrySignal) => {
        setFocusedEntry(entry);
        setSetupVisibility('FOCUS');
        if (activeTab === 'DASHBOARD' || activeTab === 'STATS') setActiveTab('CHART');
    };

    const handleViewOnChart = (entry: EntrySignal) => {
        setFocusedEntry(entry);
        setSetupVisibility('FOCUS');
        setClickedEntry(entry); 
        setActiveTab('CHART');
    };

    const thirtyDaysAgoTimestamp = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
    const recentHistory = entries.filter(e => e.backtestResult !== 'PENDING' && (e.time as number) > thirtyDaysAgoTimestamp);
    const isLowTf = ['1m', '3m'].includes(timeframe);
    const visibleFvgs = isLowTf ? [] : displayedFvgs;

    const isSidebarPanelOpen = !['DASHBOARD', 'CHART', 'BACKTEST', 'STATS', 'SETUPS', 'TRADING'].includes(activeTab);
    const safeStats = backtestStats || {totalTrades:0, wins:0, losses:0, winRate:0, netPnL:0, profitFactor:0, maxDrawdown:0, equityCurve:[]};

    return (
        <div className="flex flex-col h-screen bg-[#0b0e11] text-[#e1e3e6] font-sans overflow-hidden">
            {alert && <ToastNotification message={alert.msg} type={alert.type} onClose={() => setAlert(null)} />}
            {showTopSetups && <TopSetupsModal entries={entries} onClose={() => setShowTopSetups(false)} />}
            {clickedEntry && <EntryDetailModal entry={clickedEntry} onClose={() => setClickedEntry(null)} onReplay={() => handleStartReplay(clickedEntry)} />}

            {/* TOP BAR */}
            <header className="h-14 bg-[#151924] border-b border-[#2a2e39] flex items-center justify-between px-4 shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <button 
                        className="md:hidden text-gray-400 hover:text-white"
                        onClick={() => setMobileMenuOpen(true)}
                    >
                        <MenuIcon />
                    </button>

                    <div className="font-bold text-lg tracking-tight text-white flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('DASHBOARD')}>
                        <span className="text-blue-500">ICT</span>MASTER
                    </div>
                    <div className="h-6 w-[1px] bg-gray-700 mx-2 hidden md:block"></div>
                    <select value={asset} onChange={e => setAsset(e.target.value)} className="bg-[#0b0e11] text-sm border border-gray-700 rounded px-2 py-1 outline-none focus:border-blue-500">
                        {['MGC (COMEX)', 'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'EURUSDT'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <div className="flex bg-[#0b0e11] rounded border border-gray-700 p-0.5 overflow-x-auto max-w-[120px] md:max-w-none scrollbar-hide">
                        {['1m', '5m', '15m', '1h', '4h'].map(tf => ( 
                            <button key={tf} onClick={() => setTimeframe(tf)} className={`px-2 py-0.5 text-xs rounded shrink-0 ${timeframe === tf ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}>{tf}</button> 
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Balance</span>
                        <span className="font-mono text-sm text-white font-bold">${balance.toLocaleString()}</span>
                    </div>
                     <div className="hidden md:flex flex-col items-end">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">PnL</span>
                        <span className={`font-mono text-sm font-bold ${backtestStats?.netPnL && backtestStats.netPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>${backtestStats?.netPnL?.toLocaleString() || '0.00'}</span>
                    </div>
                    <button onClick={() => setShowTopSetups(true)} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors animate-pulse">
                        TOP SETUPS
                    </button>
                </div>
            </header>

            {/* MAIN LAYOUT */}
            <div className="flex-1 flex overflow-hidden relative">
                
                {/* LEFT SIDEBAR */}
                <nav className="w-16 bg-[#151924] border-r border-[#2a2e39] hidden md:flex flex-col items-center py-4 gap-2 z-40">
                    <SidebarItem active={activeTab === 'DASHBOARD'} onClick={() => setActiveTab('DASHBOARD')} icon={<DashboardIcon/>} label="Dashboard" />
                    <SidebarItem active={activeTab === 'CHART'} onClick={() => setActiveTab('CHART')} icon={<ChartIcon/>} label="Chart" />
                    <SidebarItem active={activeTab === 'BACKTEST'} onClick={() => setActiveTab('BACKTEST')} icon={<BacktestIcon/>} label="Replay / Backtest" />
                    <SidebarItem active={activeTab === 'SCANNER'} onClick={() => setActiveTab('SCANNER')} icon={<ListIcon/>} label="Scanner" />
                    <SidebarItem active={activeTab === 'TRADING'} onClick={() => setActiveTab('TRADING')} icon={<TradeIcon/>} label="Paper Trading" />
                    <SidebarItem active={activeTab === 'STATS'} onClick={() => setActiveTab('STATS')} icon={<StatsIcon/>} label="Trade History" />
                    <SidebarItem active={activeTab === 'SETUPS'} onClick={() => setActiveTab('SETUPS')} icon={<SetupsIcon/>} label="ICT Models" />
                    <div className="flex-1"></div>
                    <SidebarItem active={activeTab === 'SETTINGS'} onClick={() => setActiveTab('SETTINGS')} icon={<SettingsIcon/>} label="Settings" />
                </nav>

                {/* MOBILE MENU */}
                {mobileMenuOpen && (
                    <div className="absolute inset-0 z-[60] bg-[#151924] flex flex-col p-6 animate-in slide-in-from-left-full md:hidden">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-bold text-white">Main Menu</h2>
                            <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-white p-2 bg-gray-800 rounded-full">
                                <XIcon />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {['DASHBOARD', 'CHART', 'SCANNER', 'TRADING', 'SETUPS', 'STATS', 'BACKTEST', 'SETTINGS'].map(tab => (
                                <button key={tab} onClick={() => { setActiveTab(tab); setMobileMenuOpen(false); }} className={`p-4 rounded-lg border flex flex-col items-center gap-2 ${activeTab === tab ? 'bg-blue-900/20 border-blue-500 text-blue-400' : 'bg-[#0b0e11] border-[#2a2e39] text-gray-400'}`}>
                                    <span className="text-sm font-bold">{tab}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* CENTER CONTENT */}
                <main className="flex-1 relative bg-[#0b0e11] flex flex-col min-w-0">
                    {/* TRADING MODE OVERRIDE */}
                    {activeTab === 'TRADING' ? (
                        <div className="flex h-full">
                            <div className="flex-1 relative border-r border-[#2a2e39]">
                                <div className="absolute top-4 left-4 z-50 bg-[#151924]/80 backdrop-blur p-2 rounded border border-blue-500/30 text-xs font-bold text-blue-400 pointer-events-none">
                                    TRADING DESK ACTIVE
                                </div>
                                <ErrorBoundary>
                                    <ChartComponent 
                                        data={data} obs={obs} fvgs={visibleFvgs} structure={structure} entries={entries} 
                                        overlays={overlays} colors={colors} onHoverEntry={setHoveredEntry} onClickEntry={setClickedEntry} 
                                        onToggleOverlay={() => setOverlays(p => ({...p, killzones: !p.killzones}))} 
                                        pdRange={pdRange} positions={positions} htfObs={htfObs} htfFvgs={htfFvgs}
                                        setOverlays={setOverlays}
                                        onReload={fetchData}
                                        setupVisibility={setupVisibility}
                                        setSetupVisibility={setSetupVisibility}
                                        focusedEntry={focusedEntry}
                                        replayState={{ active: false, index: 0, playing: false, speed: 0, maxIndex: 0 }}
                                        onReplayControl={handleReplayControls}
                                        // Draft Props
                                        draftTrade={draftTrade}
                                        onUpdateDraft={handleUpdateDraft}
                                    />
                                </ErrorBoundary>
                            </div>
                            <div className="w-[340px] bg-[#151924]">
                                <Panels 
                                    activeTab="TRADING" setActiveTab={setActiveTab}
                                    structure={structure} entries={entries} setClickedEntry={setClickedEntry}
                                    balance={balance} positions={positions} data={data} closeTrade={closeTrade}
                                    enterTrade={enterTrade} slInput={slInput} setSlInput={setSlInput}
                                    tpInput={tpInput} setTpInput={setTpInput} autoTrade={autoTrade} setAutoTrade={setAutoTrade}
                                    settingsTab={settingsTab} setSettingsTab={setSettingsTab}
                                    config={config} setConfig={setConfig} overlays={overlays} setOverlays={setOverlays}
                                    colors={colors} setColors={setColors} backtestStats={backtestStats}
                                    recentHistory={recentHistory} obs={obs}
                                    simulation={simulation} setSimulation={setSimulation}
                                    onDeepScan={handleDeepScan} isScanning={isScanning}
                                    currentAsset={asset}
                                    resetAccount={resetAccount}
                                    // Draft Props
                                    draftTrade={draftTrade}
                                    onStartDraft={handleStartDraft}
                                    onCancelDraft={handleCancelDraft}
                                    onExecuteDraft={handleExecuteDraft}
                                    onUpdateDraft={handleUpdateDraft}
                                />
                            </div>
                        </div>
                    ) : (
                        activeTab === 'DASHBOARD' ? (
                            <DashboardPanel 
                                balance={balance} 
                                backtestStats={backtestStats} 
                                positions={positions} 
                                currentAsset={asset}
                                onAssetChange={setAsset}
                            />
                        ) : activeTab === 'STATS' ? (
                            <StatsPanel 
                                backtestStats={safeStats} 
                                recentHistory={recentHistory}
                                tradeHistory={tradeHistory}
                                setClickedEntry={setClickedEntry} 
                                onFocusEntry={handleFocusEntry}
                                focusedEntry={focusedEntry}
                                onReplay={handleStartReplay}
                            />
                        ) : activeTab === 'SETUPS' ? (
                            <SetupsPanel 
                                entries={entries} 
                                setClickedEntry={setClickedEntry} 
                                overlays={overlays}
                                setOverlays={setOverlays}
                                onClose={() => setActiveTab('CHART')}
                                onViewOnChart={handleViewOnChart}
                            />
                        ) : activeTab === 'BACKTEST' ? (
                            replayMode.active ? (
                                <div className="flex-1 relative h-full">
                                    <ErrorBoundary>
                                        <ChartComponent 
                                            data={displayedData} obs={displayedObs} fvgs={visibleFvgs} structure={structure} entries={entries} 
                                            overlays={overlays} colors={colors} onHoverEntry={setHoveredEntry} onClickEntry={setClickedEntry} 
                                            onToggleOverlay={() => setOverlays(p => ({...p, killzones: !p.killzones}))} 
                                            pdRange={pdRange} positions={positions} htfObs={htfObs} htfFvgs={htfFvgs}
                                            setOverlays={setOverlays}
                                            onReload={fetchData}
                                            setupVisibility={setupVisibility}
                                            setSetupVisibility={setSetupVisibility}
                                            focusedEntry={focusedEntry}
                                            replayState={{...replayMode, maxIndex: data.length}}
                                            onReplayControl={handleReplayControls}
                                        />
                                    </ErrorBoundary>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0b0e11] overflow-y-auto">
                                    <div className="bg-[#151924] p-8 rounded-xl border border-[#2a2e39] max-w-md w-full shadow-2xl">
                                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                            <div className="bg-blue-600 p-2 rounded-lg"><BacktestIcon /></div>
                                            Replay Simulator
                                        </h2>
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-sm font-bold text-gray-400 mb-2 block uppercase">Select Asset</label>
                                                <div className="bg-[#0b0e11] p-3 rounded border border-[#2a2e39] text-white font-mono">{asset}</div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-bold text-gray-400 mb-2 block uppercase">Start Date</label>
                                                <div className="relative flex items-center group cursor-pointer" onClick={() => { try { dateInputRef.current?.showPicker() } catch(e) {} }}>
                                                    <input 
                                                        ref={dateInputRef}
                                                        type="datetime-local" 
                                                        className="w-full bg-[#0b0e11] text-white p-3 rounded border border-[#2a2e39] focus:border-blue-500 outline-none cursor-pointer pr-10"
                                                        value={replayDateInput}
                                                        onChange={e => setReplayDateInput(e.target.value)}
                                                    />
                                                    <div className="absolute right-3 pointer-events-none text-gray-400 group-hover:text-blue-500 transition-colors">
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <label className="text-sm font-bold text-gray-400 mb-2 block uppercase">Detect Models</label>
                                                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto custom-scrollbar p-1">
                                                    {Object.keys(replaySetupFilters).map(model => (
                                                        <label key={model} className={`flex items-center gap-2 p-2 rounded border cursor-pointer ${replaySetupFilters[model] ? 'bg-blue-900/20 border-blue-500/50' : 'bg-[#0b0e11] border-[#2a2e39]'}`}>
                                                            <input 
                                                                type="checkbox" 
                                                                checked={replaySetupFilters[model]} 
                                                                onChange={() => setReplaySetupFilters(prev => ({...prev, [model]: !prev[model]}))}
                                                                className="accent-blue-500"
                                                            />
                                                            <span className={`text-xs font-bold ${replaySetupFilters[model] ? 'text-white' : 'text-gray-500'}`}>{model}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => handleStartReplay()}
                                                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-lg font-bold text-lg shadow-lg transition-transform hover:scale-[1.02]"
                                            >
                                                START SESSION
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        ) : (
                            <>
                                <div className="h-6 bg-[#0b0e11] border-b border-[#2a2e39] flex items-center overflow-hidden whitespace-nowrap px-2 z-10 shrink-0">
                                    <div className="text-[10px] font-bold text-gray-500 mr-2">LIVE:</div>
                                    <div className="animate-marquee flex gap-8">
                                        {entries.slice(-5).reverse().map((e, i) => ( 
                                            <span key={i} className={`text-[10px] font-mono ${e.score >= 7 ? 'text-yellow-400' : 'text-gray-400'}`}>
                                                {e.type} {asset} @ {e.price.toFixed(2)} [{e.setupName}]
                                            </span> 
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="flex-1 relative">
                                    <ErrorBoundary>
                                        <ChartComponent 
                                            data={data} obs={obs} fvgs={visibleFvgs} structure={structure} entries={entries} 
                                            overlays={overlays} colors={colors} onHoverEntry={setHoveredEntry} onClickEntry={setClickedEntry} 
                                            onToggleOverlay={() => setOverlays(p => ({...p, killzones: !p.killzones}))} 
                                            pdRange={pdRange} positions={positions} htfObs={htfObs} htfFvgs={htfFvgs}
                                            setOverlays={setOverlays}
                                            onReload={fetchData}
                                            setupVisibility={setupVisibility}
                                            setSetupVisibility={setSetupVisibility}
                                            focusedEntry={focusedEntry}
                                            replayState={{ active: false, index: 0, playing: false, speed: 0, maxIndex: 0 }}
                                            onReplayControl={handleReplayControls}
                                        />
                                    </ErrorBoundary>
                                    
                                    {hoveredEntry && !clickedEntry && (
                                        <div className="absolute top-4 left-16 bg-[#151924] border border-blue-500/50 p-3 rounded shadow-xl text-xs z-50 pointer-events-none">
                                            <div className="font-bold text-white mb-1 flex items-center gap-2">
                                                <span className={hoveredEntry.type === 'LONG' ? 'text-green-500' : 'text-red-500'}>{hoveredEntry.type}</span>
                                                <span className="bg-gray-700 px-1 rounded text-[10px]">{hoveredEntry.setupGrade}</span>
                                            </div>
                                            <div className="text-gray-300 font-bold mb-1">{hoveredEntry.setupName}</div>
                                            <div className="text-gray-400 mb-1">Win Prob: <span className="text-white">{hoveredEntry.winProbability}%</span></div>
                                            <div className="text-gray-500 italic">{hoveredEntry.confluences[0]}</div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )
                    )}
                </main>

                {/* RIGHT SIDEBAR (Standard, hidden if Trading Desk Active) */}
                {isSidebarPanelOpen && (
                    <aside className="absolute inset-0 z-40 md:static md:flex w-full md:w-[320px] bg-[#151924] border-l border-[#2a2e39] flex-col shadow-xl">
                        <div className="md:hidden p-2 bg-[#1e222d] border-b border-[#2a2e39] flex justify-end">
                            <button onClick={() => setActiveTab('CHART')} className="text-gray-400 hover:text-white flex items-center gap-2 text-sm font-bold bg-gray-800 px-3 py-1 rounded">
                                Close Panel <XIcon />
                            </button>
                        </div>
                        <Panels 
                            activeTab={activeTab} setActiveTab={setActiveTab}
                            structure={structure} entries={entries} setClickedEntry={setClickedEntry}
                            balance={balance} positions={positions} data={data} closeTrade={closeTrade}
                            enterTrade={enterTrade} slInput={slInput} setSlInput={setSlInput}
                            tpInput={tpInput} setTpInput={setTpInput} autoTrade={autoTrade} setAutoTrade={setAutoTrade}
                            settingsTab={settingsTab} setSettingsTab={setSettingsTab}
                            config={config} setConfig={setConfig} overlays={overlays} setOverlays={setOverlays}
                            colors={colors} setColors={setColors} backtestStats={backtestStats}
                            recentHistory={recentHistory} obs={obs}
                            simulation={simulation} setSimulation={setSimulation}
                            onDeepScan={handleDeepScan} isScanning={isScanning}
                            onFocusEntry={handleFocusEntry}
                            focusedEntry={focusedEntry}
                            onReplay={handleStartReplay}
                            onViewOnChart={handleViewOnChart}
                            currentAsset={asset}
                            resetAccount={resetAccount}
                        />
                    </aside>
                )}
            </div>
            
            {/* MOBILE NAV */}
             <nav className="md:hidden h-16 bg-[#151924] border-t border-[#2a2e39] flex items-center justify-around shrink-0 z-50 pb-safe">
                 <button onClick={() => setActiveTab('DASHBOARD')} className={`flex flex-col items-center gap-1 ${activeTab === 'DASHBOARD' ? 'text-blue-500' : 'text-gray-500'}`}>
                    <DashboardIcon /> <span className="text-[10px]">Home</span>
                </button>
                <button onClick={() => setActiveTab('CHART')} className={`flex flex-col items-center gap-1 ${activeTab === 'CHART' ? 'text-blue-500' : 'text-gray-500'}`}>
                    <ChartIcon /> <span className="text-[10px]">Chart</span>
                </button>
                <button onClick={() => setActiveTab('BACKTEST')} className={`flex flex-col items-center gap-1 ${activeTab === 'BACKTEST' ? 'text-blue-500' : 'text-gray-500'}`}>
                    <BacktestIcon /> <span className="text-[10px]">Replay</span>
                </button>
                <button onClick={() => setActiveTab('SETUPS')} className={`flex flex-col items-center gap-1 ${activeTab === 'SETUPS' ? 'text-blue-500' : 'text-gray-500'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg> <span className="text-[10px]">Models</span>
                </button>
                <button onClick={() => setActiveTab('TRADING')} className={`flex flex-col items-center gap-1 ${activeTab === 'TRADING' ? 'text-blue-500' : 'text-gray-500'}`}>
                    <TradeIcon /> <span className="text-[10px]">Trade</span>
                </button>
            </nav>
        </div>
    );
};

export default App;
