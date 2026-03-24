import React, { useState } from 'react';
import { Strategy, StrategyVersion, BacktestSession } from '../../types';

interface BacktestPanelProps {
    onStartReplay: () => void;
}

export const BacktestPanel: React.FC<BacktestPanelProps> = ({ onStartReplay }) => {
    const [strategies, setStrategies] = useState<Strategy[]>([
        {
            id: '1',
            name: 'London Breakout',
            description: 'Trading the initial breakout of the London session range.',
            createdAt: new Date().toISOString(),
            versions: [
                {
                    id: 'v1',
                    versionNumber: 1,
                    rules: ['Wait for 8:00 AM London', 'Identify Asian Range', 'Enter on 15m candle close outside range'],
                    winRate: 45,
                    totalTrades: 20,
                    profitFactor: 1.5,
                    createdAt: new Date().toISOString()
                }
            ]
        },
        {
            id: '2',
            name: 'ICT Silver Bullet',
            description: 'A time-based volatility setup occurring during specific 60-minute windows.',
            createdAt: new Date().toISOString(),
            versions: [
                {
                    id: 'v1',
                    versionNumber: 1,
                    rules: ['Time Windows (EST): 3-4 AM, 10-11 AM, 2-3 PM', 'Identify clear draw on liquidity (DOL)', 'Enter on the first FVG formed towards the DOL'],
                    winRate: 72,
                    totalTrades: 85,
                    profitFactor: 2.1,
                    createdAt: new Date().toISOString()
                }
            ]
        },
        {
            id: '3',
            name: '2022 Mentorship Model',
            description: 'Liquidity Sweep followed by MSS and a return to a Fair Value Gap.',
            createdAt: new Date().toISOString(),
            versions: [
                {
                    id: 'v1',
                    versionNumber: 1,
                    rules: ['Identify liquidity sweep of Swing High/Low', 'Wait for Market Structure Shift (MSS)', 'Identify FVG created during displacement', 'Enter on retracement into FVG'],
                    winRate: 65,
                    totalTrades: 110,
                    profitFactor: 1.8,
                    createdAt: new Date().toISOString()
                }
            ]
        },
        {
            id: '4',
            name: 'ICT Unicorn',
            description: 'Overlap of a Breaker Block and a Fair Value Gap.',
            createdAt: new Date().toISOString(),
            versions: [
                {
                    id: 'v1',
                    versionNumber: 1,
                    rules: ['Identify a Breaker Block (failed Order Block)', 'Look for an FVG that aligns with the Breaker', 'Enter at the overlap area'],
                    winRate: 75,
                    totalTrades: 42,
                    profitFactor: 2.5,
                    createdAt: new Date().toISOString()
                }
            ]
        },
        {
            id: '5',
            name: 'OTE (Optimal Trade Entry)',
            description: 'Fibonacci retracement levels within a defined dealing range.',
            createdAt: new Date().toISOString(),
            versions: [
                {
                    id: 'v1',
                    versionNumber: 1,
                    rules: ['Identify clear dealing range', 'Draw Fib from Low to High (Long)', 'Wait for price to retrace into 0.62 - 0.79 zone'],
                    winRate: 62,
                    totalTrades: 156,
                    profitFactor: 1.6,
                    createdAt: new Date().toISOString()
                }
            ]
        }
    ]);

    const handleNewStrategy = () => {
        const newId = (strategies.length + 1).toString();
        const newStrategy: Strategy = {
            id: newId,
            name: `New Strategy ${newId}`,
            description: 'A custom trading strategy.',
            createdAt: new Date().toISOString(),
            versions: [
                {
                    id: `v${newId}-1`,
                    versionNumber: 1,
                    rules: ['Rule 1: Define your entry criteria', 'Rule 2: Define your exit criteria'],
                    winRate: 0,
                    totalTrades: 0,
                    profitFactor: 0,
                    createdAt: new Date().toISOString()
                }
            ]
        };
        setStrategies([...strategies, newStrategy]);
    };

    const [sessions, setSessions] = useState<BacktestSession[]>([]);
    const [activeTab, setActiveTab] = useState<'STRATEGIES' | 'SESSIONS'>('STRATEGIES');

    return (
        <div className="h-full bg-[#0b0e11] text-white p-6 overflow-y-auto">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">Backtesting & Strategies</h2>
                        <p className="text-gray-400">Manage your trading strategies, version their rules, and review backtest sessions.</p>
                    </div>
                    <button 
                        onClick={onStartReplay}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/20"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        Start New Replay Session
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 border-b border-[#2a2e39] pb-2">
                    <button 
                        onClick={() => setActiveTab('STRATEGIES')}
                        className={`pb-2 px-4 font-bold border-b-2 transition-colors ${activeTab === 'STRATEGIES' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                    >
                        Strategies & Versions
                    </button>
                    <button 
                        onClick={() => setActiveTab('SESSIONS')}
                        className={`pb-2 px-4 font-bold border-b-2 transition-colors ${activeTab === 'SESSIONS' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                    >
                        Saved Sessions
                    </button>
                </div>

                {activeTab === 'STRATEGIES' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {strategies.map(strategy => (
                            <div key={strategy.id} className="bg-[#151924] border border-[#2a2e39] rounded-xl p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{strategy.name}</h3>
                                        <p className="text-sm text-gray-400 mt-1">{strategy.description}</p>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            const updatedStrategies = strategies.map(s => {
                                                if (s.id === strategy.id) {
                                                    const newVersionNumber = s.versions.length + 1;
                                                    return {
                                                        ...s,
                                                        versions: [
                                                            ...s.versions,
                                                            {
                                                                id: `v${s.id}-${newVersionNumber}`,
                                                                versionNumber: newVersionNumber,
                                                                rules: [`Rule 1: New version ${newVersionNumber} criteria`],
                                                                winRate: 0,
                                                                totalTrades: 0,
                                                                profitFactor: 0,
                                                                createdAt: new Date().toISOString()
                                                            }
                                                        ]
                                                    };
                                                }
                                                return s;
                                            });
                                            setStrategies(updatedStrategies);
                                        }}
                                        className="text-blue-400 hover:text-blue-300 text-sm font-bold bg-blue-900/20 px-3 py-1 rounded"
                                    >
                                        + New Version
                                    </button>
                                </div>
                                
                                <div className="space-y-4 mt-6">
                                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Versions</h4>
                                    {strategy.versions.map(version => (
                                        <div key={version.id} className="bg-[#0b0e11] border border-[#2a2e39] rounded-lg p-4">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="font-bold text-blue-400">v{version.versionNumber}.0</span>
                                                <span className="text-xs text-gray-500">{new Date(version.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <ul className="list-disc list-inside text-sm text-gray-300 space-y-1 mb-4">
                                                {version.rules.map((rule, idx) => (
                                                    <li key={idx}>{rule}</li>
                                                ))}
                                            </ul>
                                            <div className="flex gap-4 text-sm border-t border-[#2a2e39] pt-3">
                                                <div><span className="text-gray-500">Win Rate:</span> <span className="font-bold text-white">{version.winRate}%</span></div>
                                                <div><span className="text-gray-500">Trades:</span> <span className="font-bold text-white">{version.totalTrades}</span></div>
                                                <div><span className="text-gray-500">Profit Factor:</span> <span className="font-bold text-white">{version.profitFactor}</span></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        
                        {/* Add New Strategy Card */}
                        <div 
                            onClick={handleNewStrategy}
                            className="border-2 border-dashed border-[#2a2e39] rounded-xl p-6 flex flex-col items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-400 transition-colors cursor-pointer min-h-[300px]"
                        >
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                            <span className="font-bold">Create New Strategy</span>
                        </div>
                    </div>
                )}

                {activeTab === 'SESSIONS' && (
                    <div className="bg-[#151924] border border-[#2a2e39] rounded-xl p-8 text-center">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-600 mb-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        <h3 className="text-lg font-bold text-white mb-2">No Saved Sessions</h3>
                        <p className="text-gray-400 mb-6">You haven't saved any backtest sessions yet. Start a replay session and save it to review later.</p>
                        <button 
                            onClick={onStartReplay}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                        >
                            Start Replay
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
