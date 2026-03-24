import React, { useState, useEffect } from 'react';
import { Bot, UserProfile } from '../../types';
import { auth, db, handleFirestoreError, OperationType } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface BotLog {
    id: string;
    time: string;
    botName: string;
    action: 'BUY' | 'SELL' | 'CLOSE' | 'ERROR' | 'INFO';
    details: string;
}

interface BotsPanelProps {
    userProfile: UserProfile | null;
}

const DEFAULT_STRATEGIES = [
    { 
        id: 'strat_builtin_1', 
        name: 'ICT Silver Bullet', 
        code: `function onTick(market, position) {\n  // Silver Bullet Logic: Time-based FVG entry\n  // Simplified for demo: entry on RSI oversold/overbought\n  if (market.rsi < 30 && !position) {\n    return { action: "BUY", size: 1.0 };\n  }\n  if (market.rsi > 70 && position && position.type === "BUY") {\n    return { action: "CLOSE" };\n  }\n  if (market.rsi > 70 && !position) {\n    return { action: "SELL", size: 1.0 };\n  }\n  if (market.rsi < 30 && position && position.type === "SELL") {\n    return { action: "CLOSE" };\n  }\n  return null;\n}` 
    },
    { 
        id: 'strat_builtin_2', 
        name: 'London Breakout v2.0', 
        code: `function onTick(market, position) {\n  // London Breakout: Entry on price breaking EMA20 with volume\n  if (market.price > market.ema20 && market.volume > 500 && !position) {\n    return { action: "BUY", size: 1.0 };\n  }\n  if (market.price < market.ema20 && position && position.type === "BUY") {\n    return { action: "CLOSE" };\n  }\n  return null;\n}` 
    },
    { 
        id: 'strat_builtin_3', 
        name: 'NQ FVG Scalper', 
        code: `function onTick(market, position) {\n  // Scalper: Quick entries on ATR expansion\n  if (market.atr > 0.0018 && !position) {\n    return { action: "BUY", size: 2.0 };\n  }\n  if (position && (market.price > position.entryPrice + 0.0010 || market.price < position.entryPrice - 0.0005)) {\n    return { action: "CLOSE" };\n  }\n  return null;\n}` 
    },
    {
        id: 'strat_builtin_4',
        name: '2022 Mentorship Model',
        code: `function onTick(market, position) {\n  // 2022 Model: MSS + FVG entry\n  // Simplified: Entry on RSI reversal + EMA cross\n  if (market.rsi < 35 && market.price > market.ema20 && !position) {\n    return { action: "BUY", size: 1.0 };\n  }\n  if (market.rsi > 65 && market.price < market.ema20 && !position) {\n    return { action: "SELL", size: 1.0 };\n  }\n  if (position && ((position.type === "BUY" && market.rsi > 75) || (position.type === "SELL" && market.rsi < 25))) {\n    return { action: "CLOSE" };\n  }\n  return null;\n}`
    },
    {
        id: 'strat_builtin_5',
        name: 'ICT Unicorn',
        code: `function onTick(market, position) {\n  // Unicorn: Breaker + FVG\n  if (market.volume > 800 && market.rsi > 50 && !position) {\n    return { action: "BUY", size: 1.5 };\n  }\n  if (position && market.volume < 200) {\n    return { action: "CLOSE" };\n  }\n  return null;\n}`
    },
    { 
        id: 'strat_custom_1', 
        name: 'My Custom EMA', 
        code: 'function onTick(market, position) {\n  // Exemple de code JavaScript\n  if (market.price > market.ema20 && !position) {\n    return { action: "BUY", size: 1.0 };\n  }\n  if (market.price < market.ema20 && position) {\n    return { action: "CLOSE" };\n  }\n  return null;\n}' 
    }
];

const DEFAULT_BOTS: Bot[] = [
    {
        id: 'bot_1',
        name: 'London Breakout EA',
        status: 'ACTIVE',
        strategy: 'London Breakout v2.0',
        asset: 'EURUSD',
        positionSize: 1.0,
        totalProfit: 1250.50,
        winRate: 58.5,
        lastActive: new Date().toISOString(),
        history: [0, 150, 100, 300, 250, 500, 450, 800, 750, 1250.50],
        allowedTimeframes: ['15m', '1H']
    },
    {
        id: 'bot_2',
        name: 'NQ FVG Scalper',
        status: 'PAUSED',
        strategy: 'NQ FVG Scalper',
        asset: 'NQ1!',
        positionSize: 2.0,
        totalProfit: -350.00,
        winRate: 42.0,
        lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        history: [0, -100, 50, -200, -150, -400, -350.00],
        allowedTimeframes: ['1m', '5m']
    },
    {
        id: 'bot_3',
        name: 'Silver Bullet Bot',
        status: 'ACTIVE',
        strategy: 'ICT Silver Bullet',
        asset: 'ES1!',
        positionSize: 1.0,
        totalProfit: 840.20,
        winRate: 62.1,
        lastActive: new Date().toISOString(),
        history: [0, 200, 150, 400, 350, 600, 550, 840.20],
        allowedTimeframes: ['5m']
    },
    {
        id: 'bot_4',
        name: 'Gold Trend Follower',
        status: 'PAUSED',
        strategy: 'My Custom EMA',
        asset: 'XAUUSD',
        positionSize: 0.5,
        totalProfit: 2100.00,
        winRate: 71.4,
        lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        history: [0, 500, 400, 1000, 900, 1500, 1400, 2100.00],
        allowedTimeframes: ['1H', '4H']
    }
];

export const BotsPanel: React.FC<BotsPanelProps> = ({ userProfile }) => {
    const [user, setUser] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);
    const [showStrategyModal, setShowStrategyModal] = useState(false);
    const [editingStrategyId, setEditingStrategyId] = useState<string | null>(null);
    const [newBotForm, setNewBotForm] = useState({ name: '', strategy: '', asset: 'EURUSD', positionSize: 1.0, allowedTimeframes: ['15m', '1H'] });
    const [logs, setLogs] = useState<BotLog[]>([]);
    
    const [customStrategies, setCustomStrategies] = useState(DEFAULT_STRATEGIES);
    const [newStrategy, setNewStrategy] = useState({ name: '', code: 'function onTick(market, position) {\n  // Écris ta logique JavaScript ici\n  \n  return null;\n}' });

    const [bots, setBots] = useState<Bot[]>(DEFAULT_BOTS);


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!user) return;
        
        const fetchBotsData = async () => {
            try {
                const docRef = doc(db, `users/${user.uid}/data/bots`);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    const data = snap.data();
                    if (data.bots) setBots(data.bots);
                    
                    // Merge custom strategies with defaults to ensure built-ins are always there
                    if (data.customStrategies) {
                        const existingNames = new Set(data.customStrategies.map((s: any) => s.name));
                        const missingDefaults = DEFAULT_STRATEGIES.filter(s => !existingNames.has(s.name));
                        setCustomStrategies([...data.customStrategies, ...missingDefaults]);
                    }
                    
                    if (data.logs) setLogs(data.logs);
                }
            } catch (error) {
                handleFirestoreError(error, OperationType.GET, `users/${user.uid}/data/bots`);
            }
        };
        fetchBotsData();
    }, [user]);

    // Save to Firebase
    useEffect(() => {
        if (!user) return;
        
        const saveBotsData = async () => {
            try {
                const docRef = doc(db, `users/${user.uid}/data/bots`);
                await setDoc(docRef, { bots, customStrategies, logs }, { merge: true });
            } catch (error) {
                handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/data/bots`);
            }
        };
        
        // Debounce saving to avoid too many writes during simulation
        const timeoutId = setTimeout(() => {
            saveBotsData();
        }, 2000);
        
        return () => clearTimeout(timeoutId);
    }, [bots, customStrategies, logs, user]);

    const toggleBotStatus = (id: string) => {
        setBots(bots.map(b => {
            if (b.id === id) {
                return { ...b, status: b.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' };
            }
            return b;
        }));
    };

    const toggleBotTimeframe = (botId: string, timeframe: string) => {
        setBots(bots.map(b => {
            if (b.id === botId) {
                const currentTfs = b.allowedTimeframes || [];
                const newTfs = currentTfs.includes(timeframe)
                    ? currentTfs.filter(tf => tf !== timeframe)
                    : [...currentTfs, timeframe];
                return { ...b, allowedTimeframes: newTfs };
            }
            return b;
        }));
    };

    const handleCreateBot = (e: React.FormEvent) => {
        e.preventDefault();
        const maxBots = userProfile?.botSettings?.maxBots || 5;
        if (bots.length >= maxBots) {
            alert(`You have reached the maximum limit of ${maxBots} bots. You can manage this limit in your Profile.`);
            return;
        }
        const newBot: Bot = {
            id: `bot_${Date.now()}`,
            name: newBotForm.name || 'Untitled Bot',
            status: 'PAUSED',
            strategy: newBotForm.strategy || 'Custom Strategy',
            asset: newBotForm.asset,
            positionSize: newBotForm.positionSize,
            totalProfit: 0,
            winRate: 0,
            lastActive: new Date().toISOString(),
            allowedTimeframes: newBotForm.allowedTimeframes
        };
        setBots([newBot, ...bots]);
        setShowModal(false);
        setNewBotForm({ name: '', strategy: '', asset: 'EURUSD', positionSize: 1.0, allowedTimeframes: ['15m', '1H'] });
    };

    const handleSaveStrategy = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStrategy.name) return;

        if (editingStrategyId) {
            setCustomStrategies(customStrategies.map(s => 
                s.id === editingStrategyId ? { ...s, name: newStrategy.name, code: newStrategy.code } : s
            ));
        } else {
            setCustomStrategies([...customStrategies, { id: `strat_${Date.now()}`, name: newStrategy.name, code: newStrategy.code }]);
        }
        
        setShowStrategyModal(false);
        setEditingStrategyId(null);
        setNewStrategy({ name: '', code: 'function onTick(market, position) {\n  // Écris ta logique JavaScript ici\n  \n  return null;\n}' });
    };

    const handleEditStrategy = (id: string) => {
        const strat = customStrategies.find(s => s.id === id);
        if (strat) {
            setNewStrategy({ name: strat.name, code: strat.code });
            setEditingStrategyId(id);
            setShowStrategyModal(true);
        }
    };

    const downloadDocs = () => {
        const docs = `ALGORITHMIC TRADING - STRATEGY API DOCUMENTATION
================================================

Your strategy must implement the following function:
function onTick(market, position) { ... }

1. THE 'market' OBJECT
This object contains the current market data for the asset.
- market.price (number): Current price of the asset
- market.ema20 (number): 20-period Exponential Moving Average
- market.rsi (number): 14-period Relative Strength Index

2. THE 'position' OBJECT
This object is null if you have no open position, otherwise it contains:
- position.type (string): 'BUY' or 'SELL'
- position.entryPrice (number): The price at which the position was opened
- position.size (number): The size of the position in lots

3. RETURN VALUES
Your function must return an object to execute a trade, or null to do nothing.
- Open a Long position:  return { action: 'BUY', size: 1.0 };
- Open a Short position: return { action: 'SELL', size: 1.0 };
- Close current pos:     return { action: 'CLOSE' };
- Do nothing:            return null;

EXAMPLE STRATEGY:
function onTick(market, position) {
    // Buy when RSI is oversold and no position is open
    if (market.rsi < 30 && !position) {
        return { action: 'BUY', size: 1.0 };
    }
    
    // Close position when in profit and RSI is overbought
    if (position && position.type === 'BUY' && market.rsi > 70 && market.price > position.entryPrice) {
        return { action: 'CLOSE' };
    }
    
    return null;
}`;
        const blob = new Blob([docs], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Strategy_API_Documentation.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Simulation Engine
    useEffect(() => {
        const interval = setInterval(() => {
            let generatedLogs: BotLog[] = [];

            setBots(currentBots => currentBots.map(bot => {
                if (bot.status !== 'ACTIVE') return bot;

                // Simulate market data (EURUSD mock)
                const market = {
                    price: 1.0500 + (Math.random() - 0.5) * 0.0050,
                    ema20: 1.0500 + (Math.random() - 0.5) * 0.0010,
                    rsi: 30 + Math.random() * 40,
                    atr: 0.0015 + Math.random() * 0.0005,
                    volume: Math.floor(Math.random() * 1000)
                };

                const customStrat = customStrategies.find(s => s.name === bot.strategy);
                const codeToRun = customStrat ? customStrat.code : null;

                let newPosition = bot.currentPosition;
                let newTotalProfit = bot.totalProfit;
                let newTradesCount = bot.tradesCount || (bot.winRate > 0 ? 10 : 0); // Mock initial trades
                let newWinsCount = bot.winsCount || Math.floor(newTradesCount * (bot.winRate / 100));
                let newHistory = bot.history ? [...bot.history] : [0];

                if (codeToRun) {
                    try {
                        // Create safe execution context
                        const runStrategy = new Function('market', 'position', `${codeToRun}\nreturn onTick(market, position);`);
                        const result = runStrategy(market, newPosition);

                        if (result) {
                            if (result.action === 'BUY' && !newPosition) {
                                newPosition = { type: 'BUY', entryPrice: market.price, size: result.size || bot.positionSize };
                                generatedLogs.push({ id: Date.now().toString() + Math.random(), time: new Date().toISOString(), botName: bot.name, action: 'BUY', details: `Opened LONG at ${market.price.toFixed(5)} (${newPosition.size}L)` });
                            } else if (result.action === 'SELL' && !newPosition) {
                                newPosition = { type: 'SELL', entryPrice: market.price, size: result.size || bot.positionSize };
                                generatedLogs.push({ id: Date.now().toString() + Math.random(), time: new Date().toISOString(), botName: bot.name, action: 'SELL', details: `Opened SHORT at ${market.price.toFixed(5)} (${newPosition.size}L)` });
                            } else if (result.action === 'CLOSE' && newPosition) {
                                // Calculate PnL (Mock calculation)
                                const pnl = newPosition.type === 'BUY' 
                                    ? (market.price - newPosition.entryPrice) * 100000 * newPosition.size
                                    : (newPosition.entryPrice - market.price) * 100000 * newPosition.size;
                                
                                newTotalProfit += pnl;
                                newTradesCount += 1;
                                if (pnl > 0) newWinsCount += 1;
                                newHistory.push(newTotalProfit);
                                if (newHistory.length > 20) newHistory.shift();
                                generatedLogs.push({ id: Date.now().toString() + Math.random(), time: new Date().toISOString(), botName: bot.name, action: 'CLOSE', details: `Closed ${newPosition.type} at ${market.price.toFixed(5)} | PnL: $${pnl.toFixed(2)}` });
                                newPosition = undefined;
                            }
                        }
                    } catch (e) {
                        console.error(`Error running strategy for bot ${bot.name}:`, e);
                        generatedLogs.push({ id: Date.now().toString() + Math.random(), time: new Date().toISOString(), botName: bot.name, action: 'ERROR', details: `Strategy Execution Error: ${e instanceof Error ? e.message : 'Unknown error'}` });
                        return { ...bot, status: 'ERROR' };
                    }
                } else {
                    // Built-in mock logic (random trades)
                    if (Math.random() > 0.8) {
                        if (!newPosition) {
                            const type = Math.random() > 0.5 ? 'BUY' : 'SELL';
                            newPosition = { type, entryPrice: market.price, size: bot.positionSize };
                            generatedLogs.push({ id: Date.now().toString() + Math.random(), time: new Date().toISOString(), botName: bot.name, action: type, details: `Opened ${type === 'BUY' ? 'LONG' : 'SHORT'} at ${market.price.toFixed(5)} (${newPosition.size}L)` });
                        } else {
                            const pnl = (Math.random() - 0.4) * 50 * bot.positionSize; // Slight positive bias
                            newTotalProfit += pnl;
                            newTradesCount += 1;
                            if (pnl > 0) newWinsCount += 1;
                            newHistory.push(newTotalProfit);
                            if (newHistory.length > 20) newHistory.shift();
                            generatedLogs.push({ id: Date.now().toString() + Math.random(), time: new Date().toISOString(), botName: bot.name, action: 'CLOSE', details: `Closed ${newPosition.type} at ${market.price.toFixed(5)} | PnL: $${pnl.toFixed(2)}` });
                            newPosition = undefined;
                        }
                    }
                }

                const newWinRate = newTradesCount > 0 ? (newWinsCount / newTradesCount) * 100 : bot.winRate;

                return {
                    ...bot,
                    currentPosition: newPosition,
                    totalProfit: newTotalProfit,
                    tradesCount: newTradesCount,
                    winsCount: newWinsCount,
                    winRate: parseFloat(newWinRate.toFixed(1)),
                    lastActive: new Date().toISOString(),
                    history: newHistory
                };
            }));

            if (generatedLogs.length > 0) {
                setLogs(prev => [...generatedLogs, ...prev].slice(0, 50));
            }
        }, 2000); // Run every 2 seconds

        return () => clearInterval(interval);
    }, [customStrategies]);

    // Helper to draw sparkline
    const renderSparkline = (history: number[] = []) => {
        if (history.length < 2) return null;
        
        const min = Math.min(...history);
        const max = Math.max(...history);
        const range = max - min || 1;
        
        const width = 100;
        const height = 30;
        
        const points = history.map((val, i) => {
            const x = (i / (history.length - 1)) * width;
            const y = height - ((val - min) / range) * height;
            return `${x},${y}`;
        }).join(' ');

        const isPositive = history[history.length - 1] >= (history[0] || 0);
        const color = isPositive ? '#4ade80' : '#f87171'; // green-400 or red-400

        return (
            <svg width="100%" height="100%" viewBox={`0 -5 ${width} ${height + 10}`} preserveAspectRatio="none">
                <polyline 
                    points={points} 
                    fill="none" 
                    stroke={color} 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                />
            </svg>
        );
    };

    const totalPnL = bots.reduce((acc, bot) => acc + bot.totalProfit, 0);
    const startingBalance = userProfile?.botSettings?.startingBalance || 10000;
    const currentEquity = startingBalance + totalPnL;
    const totalWinRate = bots.length > 0 ? bots.reduce((acc, bot) => acc + bot.winRate, 0) / bots.length : 0;

    return (
        <div className="h-full bg-[#0b0e11] text-white p-6 overflow-y-auto relative">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Bot Suivi Header */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-[#151924] border border-[#2a2e39] rounded-xl p-4">
                        <p className="text-gray-400 text-xs uppercase font-bold mb-1">Total Equity</p>
                        <p className={`text-2xl font-bold ${currentEquity >= startingBalance ? 'text-green-400' : 'text-red-400'}`}>
                            ${currentEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Starting: ${startingBalance.toLocaleString()}</p>
                    </div>
                    <div className="bg-[#151924] border border-[#2a2e39] rounded-xl p-4">
                        <p className="text-gray-400 text-xs uppercase font-bold mb-1">Total PnL</p>
                        <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Across {bots.length} active bots</p>
                    </div>
                    <div className="bg-[#151924] border border-[#2a2e39] rounded-xl p-4">
                        <p className="text-gray-400 text-xs uppercase font-bold mb-1">Avg Win Rate</p>
                        <p className="text-2xl font-bold text-blue-400">{totalWinRate.toFixed(1)}%</p>
                        <p className="text-xs text-gray-500 mt-1">Performance average</p>
                    </div>
                    <div className="bg-[#151924] border border-[#2a2e39] rounded-xl p-4">
                        <p className="text-gray-400 text-xs uppercase font-bold mb-1">Bot Limit</p>
                        <p className="text-2xl font-bold text-purple-400">{bots.length} / {userProfile?.botSettings?.maxBots || 5}</p>
                        <p className="text-xs text-gray-500 mt-1">Manage in Profile</p>
                    </div>
                </div>

                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8" y2="16"></line><line x1="16" y1="16" x2="16" y2="16"></line></svg>
                            Algorithmic Trading (Demo)
                        </h2>
                        <p className="text-gray-400">Deploy automated trading bots on your paper trading account based on your saved strategies.</p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setShowStrategyModal(true)}
                            className="bg-[#151924] border border-[#2a2e39] hover:bg-[#2a2e39] text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                            Code Strategy
                        </button>
                        <button 
                            onClick={() => setShowModal(true)}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            Create Bot
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-[#151924] p-5 rounded-lg border border-[#2a2e39] shadow-sm">
                        <div className="text-gray-500 text-xs uppercase font-bold mb-1">Total Bots PnL</div>
                        <div className={`text-2xl font-bold font-mono ${bots.reduce((acc, b) => acc + (b.totalProfit || 0), 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ${bots.reduce((acc, b) => acc + (b.totalProfit || 0), 0).toFixed(2)}
                        </div>
                    </div>
                    <div className="bg-[#151924] p-5 rounded-lg border border-[#2a2e39] shadow-sm">
                        <div className="text-gray-500 text-xs uppercase font-bold mb-1">Active Bots</div>
                        <div className="text-2xl font-bold text-white font-mono">
                            {bots.filter(b => b.status === 'ACTIVE').length} / {bots.length}
                        </div>
                    </div>
                    <div className="bg-[#151924] p-5 rounded-lg border border-[#2a2e39] shadow-sm">
                        <div className="text-gray-500 text-xs uppercase font-bold mb-1">Avg Win Rate</div>
                        <div className="text-2xl font-bold text-white font-mono">
                            {(bots.reduce((acc, b) => acc + (b.winRate || 0), 0) / (bots.length || 1)).toFixed(1)}%
                        </div>
                    </div>
                    <div className="bg-[#151924] p-5 rounded-lg border border-[#2a2e39] shadow-sm">
                        <div className="text-gray-500 text-xs uppercase font-bold mb-1">Total Trades</div>
                        <div className="text-2xl font-bold text-white font-mono">
                            {bots.reduce((acc, b) => acc + (b.tradesCount || 0), 0)}
                        </div>
                    </div>
                </div>

                <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 flex items-start gap-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 shrink-0 mt-1"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    <div>
                        <h4 className="font-bold text-blue-400">Simulated Environment</h4>
                        <p className="text-sm text-blue-300/80 mt-1">Bots are currently running in a simulated environment using real-time market data. Live execution via broker API is disabled in this workspace.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bots.map(bot => (
                        <div key={bot.id} className="bg-[#151924] border border-[#2a2e39] rounded-xl p-6 flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        {bot.name}
                                        <span className={`w-2 h-2 rounded-full ${bot.status === 'ACTIVE' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></span>
                                    </h3>
                                    <p className="text-sm text-gray-400 mt-1">{bot.strategy}</p>
                                </div>
                                <button 
                                    onClick={() => toggleBotStatus(bot.id)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${bot.status === 'ACTIVE' ? 'bg-blue-600' : 'bg-gray-600'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${bot.status === 'ACTIVE' ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-[#0b0e11] p-3 rounded-lg border border-[#2a2e39]">
                                    <div className="text-xs text-gray-500 font-bold uppercase mb-1">Position</div>
                                    <div className="font-mono font-bold text-white">
                                        {bot.currentPosition ? (
                                            <span className={bot.currentPosition.type === 'BUY' ? 'text-green-400' : 'text-red-400'}>
                                                {bot.currentPosition.type} {bot.currentPosition.size}L
                                            </span>
                                        ) : (
                                            <span className="text-gray-500">FLAT</span>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-[#0b0e11] p-3 rounded-lg border border-[#2a2e39]">
                                    <div className="text-xs text-gray-500 font-bold uppercase mb-1">Asset</div>
                                    <div className="font-mono font-bold text-white">{bot.asset}</div>
                                </div>
                                <div className="bg-[#0b0e11] p-3 rounded-lg border border-[#2a2e39]">
                                    <div className="text-xs text-gray-500 font-bold uppercase mb-1">Total PnL</div>
                                    <div className={`font-mono font-bold ${bot.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        ${bot.totalProfit.toFixed(2)}
                                    </div>
                                </div>
                                <div className="bg-[#0b0e11] p-3 rounded-lg border border-[#2a2e39]">
                                    <div className="text-xs text-gray-500 font-bold uppercase mb-1">Win Rate</div>
                                    <div className="font-mono font-bold text-white">{bot.winRate}%</div>
                                </div>
                                <div className="bg-[#0b0e11] p-3 rounded-lg border border-[#2a2e39] col-span-2 h-16 relative overflow-hidden">
                                    <div className="text-xs text-gray-500 font-bold uppercase mb-1 absolute z-10">Equity Curve</div>
                                    <div className="absolute inset-0 pt-6 px-2 pb-2 opacity-80">
                                        {renderSparkline(bot.history)}
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="text-xs text-gray-500 font-bold uppercase mb-2">Allowed Timeframes</div>
                                <div className="flex flex-wrap gap-2">
                                    {['1m', '5m', '15m', '1H', '4H', '1D'].map(tf => {
                                        const isActive = (bot.allowedTimeframes || []).includes(tf);
                                        return (
                                            <button
                                                key={tf}
                                                onClick={() => toggleBotTimeframe(bot.id, tf)}
                                                className={`px-2 py-1 text-xs font-bold rounded border transition-colors ${
                                                    isActive 
                                                    ? 'bg-blue-600/20 text-blue-400 border-blue-600/50 hover:bg-blue-600/30' 
                                                    : 'bg-[#0b0e11] text-gray-500 border-[#2a2e39] hover:text-gray-300'
                                                }`}
                                            >
                                                {tf}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-auto pt-4 border-t border-[#2a2e39] flex justify-between items-center">
                                <span className="text-xs text-gray-500">Last active: {new Date(bot.lastActive).toLocaleTimeString()}</span>
                                <button className="text-blue-400 hover:text-blue-300 text-sm font-bold">View Logs</button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recent Activity Log */}
                <div className="bg-[#151924] border border-[#2a2e39] rounded-xl overflow-hidden mt-8">
                    <div className="p-6 border-b border-[#2a2e39] flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white">Recent Bot Activity</h3>
                        <button 
                            onClick={() => setLogs([])}
                            className="text-gray-400 hover:text-white transition-colors text-sm font-bold"
                        >
                            Clear Logs
                        </button>
                    </div>
                    <div className="p-0">
                        {logs.length === 0 ? (
                            <div className="p-6 text-center text-gray-500 py-12">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 opacity-50"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                                <p>No recent activity in the last 24 hours.</p>
                            </div>
                        ) : (
                            <div className="max-h-80 overflow-y-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-[#151924] z-10">
                                        <tr className="border-b border-[#2a2e39] text-xs text-gray-500 uppercase">
                                            <th className="p-4 font-bold">Time</th>
                                            <th className="p-4 font-bold">Bot</th>
                                            <th className="p-4 font-bold">Action</th>
                                            <th className="p-4 font-bold">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.map(log => (
                                            <tr key={log.id} className="border-b border-[#2a2e39]/50 hover:bg-[#2a2e39]/20 transition-colors">
                                                <td className="p-4 text-sm text-gray-400 font-mono">{new Date(log.time).toLocaleTimeString()}</td>
                                                <td className="p-4 text-sm font-bold text-white">{log.botName}</td>
                                                <td className="p-4 text-sm">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                        log.action === 'BUY' ? 'bg-green-500/20 text-green-400' : 
                                                        log.action === 'SELL' ? 'bg-red-500/20 text-red-400' : 
                                                        log.action === 'ERROR' ? 'bg-red-500/20 text-red-500' :
                                                        'bg-blue-500/20 text-blue-400'
                                                    }`}>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-sm text-gray-300 font-mono">{log.details}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Create Bot Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-[#151924] border border-[#2a2e39] rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
                            <div className="p-6 border-b border-[#2a2e39] flex justify-between items-center bg-[#0b0e11]">
                                <h3 className="text-xl font-bold text-white">Create New Bot</h3>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                            <form onSubmit={handleCreateBot} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-1">Bot Name</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={newBotForm.name}
                                        onChange={e => setNewBotForm({...newBotForm, name: e.target.value})}
                                        className="w-full bg-[#0b0e11] text-white p-3 rounded-lg border border-[#2a2e39] focus:border-blue-500 outline-none"
                                        placeholder="e.g. NQ Morning Breakout"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-1">Strategy</label>
                                    <select 
                                        value={newBotForm.strategy}
                                        onChange={e => setNewBotForm({...newBotForm, strategy: e.target.value})}
                                        className="w-full bg-[#0b0e11] text-white p-3 rounded-lg border border-[#2a2e39] focus:border-blue-500 outline-none"
                                    >
                                        <option value="">Select a strategy...</option>
                                        <optgroup label="Available Strategies">
                                            {customStrategies.map(strat => (
                                                <option key={strat.id} value={strat.name}>{strat.name}</option>
                                            ))}
                                        </optgroup>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-400 mb-1">Asset</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={newBotForm.asset}
                                            onChange={e => setNewBotForm({...newBotForm, asset: e.target.value})}
                                            className="w-full bg-[#0b0e11] text-white p-3 rounded-lg border border-[#2a2e39] focus:border-blue-500 outline-none font-mono"
                                            placeholder="EURUSD"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-400 mb-1">Position Size (Lots)</label>
                                        <input 
                                            type="number" 
                                            step="0.1"
                                            min="0.1"
                                            required
                                            value={newBotForm.positionSize}
                                            onChange={e => setNewBotForm({...newBotForm, positionSize: Number(e.target.value)})}
                                            className="w-full bg-[#0b0e11] text-white p-3 rounded-lg border border-[#2a2e39] focus:border-blue-500 outline-none font-mono"
                                        />
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-bold text-gray-400 mb-2">Allowed Timeframes</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['1m', '5m', '15m', '1H', '4H', '1D'].map(tf => {
                                            const isActive = newBotForm.allowedTimeframes.includes(tf);
                                            return (
                                                <button
                                                    key={tf}
                                                    type="button"
                                                    onClick={() => {
                                                        const newTfs = isActive 
                                                            ? newBotForm.allowedTimeframes.filter(t => t !== tf)
                                                            : [...newBotForm.allowedTimeframes, tf];
                                                        setNewBotForm({...newBotForm, allowedTimeframes: newTfs});
                                                    }}
                                                    className={`px-3 py-1.5 text-sm font-bold rounded border transition-colors ${
                                                        isActive 
                                                        ? 'bg-blue-600/20 text-blue-400 border-blue-600/50 hover:bg-blue-600/30' 
                                                        : 'bg-[#0b0e11] text-gray-500 border-[#2a2e39] hover:text-gray-300'
                                                    }`}
                                                >
                                                    {tf}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="pt-4 flex justify-end gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-6 py-2 rounded-lg font-bold text-gray-400 hover:text-white hover:bg-[#2a2e39] transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="px-6 py-2 rounded-lg font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                                    >
                                        Deploy Bot
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}                {/* Strategy Editor Modal */}
                {showStrategyModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-[#151924] border border-[#2a2e39] rounded-xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col h-[85vh]">
                            <div className="p-4 border-b border-[#2a2e39] flex justify-between items-center bg-[#0b0e11] shrink-0">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                                    {editingStrategyId ? 'Edit Strategy' : 'Create New Strategy'}
                                </h3>
                                <button onClick={() => { setShowStrategyModal(false); setEditingStrategyId(null); }} className="text-gray-400 hover:text-white">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                            
                            <div className="flex flex-1 overflow-hidden">
                                {/* Sidebar: Strategy List */}
                                <div className="w-64 border-r border-[#2a2e39] bg-[#0b0e11] overflow-y-auto shrink-0">
                                    <div className="p-4 border-b border-[#2a2e39]">
                                        <button 
                                            onClick={() => {
                                                setEditingStrategyId(null);
                                                setNewStrategy({ name: '', code: 'function onTick(market, position) {\n  // Écris ta logique JavaScript ici\n  \n  return null;\n}' });
                                            }}
                                            className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-3 rounded transition-colors flex items-center justify-center gap-2"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                            New Strategy
                                        </button>
                                    </div>
                                    <div className="p-2 space-y-1">
                                        <div className="text-[10px] font-bold text-gray-500 uppercase px-2 py-1">Saved Strategies</div>
                                        {customStrategies.map(strat => (
                                            <button
                                                key={strat.id}
                                                onClick={() => handleEditStrategy(strat.id)}
                                                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${editingStrategyId === strat.id ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' : 'text-gray-400 hover:bg-[#151924] hover:text-gray-200'}`}
                                            >
                                                <div className="font-bold truncate">{strat.name}</div>
                                                <div className="text-[10px] opacity-60 truncate">
                                                    {strat.id.startsWith('strat_builtin') ? 'Built-in' : 'Custom'}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Main Editor Area */}
                                <form onSubmit={handleSaveStrategy} className="flex flex-col flex-1 overflow-hidden">
                                    <div className="p-4 border-b border-[#2a2e39] shrink-0 bg-[#151924]">
                                        <label className="block text-sm font-bold text-gray-400 mb-1">Strategy Name</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={newStrategy.name}
                                            onChange={e => setNewStrategy({...newStrategy, name: e.target.value})}
                                            className="w-full max-w-md bg-[#0b0e11] text-white p-2 rounded-lg border border-[#2a2e39] focus:border-blue-500 outline-none"
                                            placeholder="e.g. My Super Trend Follower"
                                        />
                                    </div>
                                    <div className="flex-1 p-4 flex flex-col bg-[#0b0e11]">
                                        <div className="flex justify-between items-end mb-2">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-400 mb-1">JavaScript Code</label>
                                                <p className="text-xs text-gray-500">
                                                    Write your logic in standard JavaScript. The <code className="text-blue-400">onTick(market, position)</code> function is called every time price updates.
                                                </p>
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={downloadDocs} 
                                                className="text-xs bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 hover:text-blue-300 px-3 py-1.5 rounded border border-blue-500/30 flex items-center gap-1.5 transition-colors shrink-0"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                                Download API Docs
                                            </button>
                                        </div>
                                        
                                        <div className="text-[10px] text-gray-400 mb-3 bg-[#151924] p-3 rounded-lg border border-[#2a2e39] grid grid-cols-3 gap-4">
                                            <div>
                                                <span className="font-bold text-gray-300 block mb-1">market</span>
                                                <code className="text-green-400">.price</code>, <code className="text-green-400">.ema20</code>, <code className="text-green-400">.rsi</code>, <code className="text-green-400">.atr</code>, <code className="text-green-400">.volume</code>
                                            </div>
                                            <div>
                                                <span className="font-bold text-gray-300 block mb-1">position (or null)</span>
                                                <code className="text-green-400">.type</code> ('BUY'|'SELL'), <code className="text-green-400">.entryPrice</code>, <code className="text-green-400">.size</code>
                                            </div>
                                            <div>
                                                <span className="font-bold text-gray-300 block mb-1">Return</span>
                                                <code className="text-yellow-400">{`{ action: 'BUY'|'SELL'|'CLOSE', size?: number }`}</code>
                                            </div>
                                        </div>

                                        <textarea 
                                            required
                                            value={newStrategy.code}
                                            onChange={e => setNewStrategy({...newStrategy, code: e.target.value})}
                                            className="flex-1 w-full bg-[#151924] text-gray-300 p-4 rounded-lg border border-[#2a2e39] focus:border-blue-500 outline-none font-mono text-sm resize-none"
                                            spellCheck="false"
                                        />
                                    </div>
                                    <div className="p-4 border-t border-[#2a2e39] flex justify-end gap-3 bg-[#0b0e11] shrink-0">
                                        <button 
                                            type="button"
                                            onClick={() => { setShowStrategyModal(false); setEditingStrategyId(null); }}
                                            className="px-6 py-2 rounded-lg font-bold text-gray-400 hover:text-white hover:bg-[#2a2e39] transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit"
                                            className="px-6 py-2 rounded-lg font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-2"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                                            {editingStrategyId ? 'Update Strategy' : 'Save Strategy'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
    
