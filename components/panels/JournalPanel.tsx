import React, { useState } from 'react';
import { EntrySignal, TradeEntry } from '../../types';

interface JournalPanelProps {
    tradeHistory: TradeEntry[];
    algoSignals?: EntrySignal[];
    onUpdateTrade: (updatedTrade: TradeEntry) => void;
}

export const JournalPanel: React.FC<JournalPanelProps> = ({ tradeHistory, algoSignals = [], onUpdateTrade }) => {
    const [viewMode, setViewMode] = useState<'MANUAL' | 'ALGO'>('ALGO');
    const [selectedTrade, setSelectedTrade] = useState<TradeEntry | null>(null);
    const [notes, setNotes] = useState('');
    const [emotions, setEmotions] = useState('');
    const [tags, setTags] = useState('');
    const [mistakes, setMistakes] = useState('');
    const [algoSignal, setAlgoSignal] = useState('');

    const algoTrades: TradeEntry[] = algoSignals.map(signal => {
        const existing = tradeHistory.find(t => t.id === `algo-${signal.time}`);
        if (existing) return existing;
        return {
            id: `algo-${signal.time}`,
            time: signal.time,
            type: signal.type,
            price: signal.price,
            stopLoss: signal.sl,
            takeProfit: signal.tp,
            lotSize: signal.lotSize || 1,
            result: signal.backtestResult === 'PENDING' ? 'OPEN' : signal.backtestResult,
            pnl: signal.backtestPnL,
            confluences: signal.confluences,
            score: signal.score,
            algoSignal: signal.setupName,
            timeframe: signal.timeframe
        };
    });

    const manualTrades = tradeHistory.filter(t => !t.id.startsWith('algo-'));
    const displayedTrades = viewMode === 'MANUAL' ? manualTrades : algoTrades;

    const handleSelectTrade = (trade: TradeEntry) => {
        setSelectedTrade(trade);
        setNotes(trade.notes || '');
        setEmotions(trade.emotions?.join(', ') || '');
        setTags(trade.tags?.join(', ') || '');
        setMistakes(trade.mistakes?.join(', ') || '');
        setAlgoSignal(trade.algoSignal || 'DEFAULT_ALGO');
    };

    const handleSave = () => {
        if (!selectedTrade) return;
        const updated: TradeEntry = {
            ...selectedTrade,
            notes,
            algoSignal,
            emotions: emotions.split(',').map(s => s.trim()).filter(Boolean),
            tags: tags.split(',').map(s => s.trim()).filter(Boolean),
            mistakes: mistakes.split(',').map(s => s.trim()).filter(Boolean),
        };
        onUpdateTrade(updated);
        setSelectedTrade(updated);
    };

    return (
        <div className="flex h-full bg-[#0b0e11] text-white">
            {/* Trade List */}
            <div className="w-1/3 border-r border-[#2a2e39] overflow-y-auto p-4 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Trading Journal</h2>
                </div>
                
                {/* View Toggle */}
                <div className="flex bg-[#151924] rounded-lg p-1 mb-4 border border-[#2a2e39] shrink-0">
                    <button 
                        onClick={() => { setViewMode('ALGO'); setSelectedTrade(null); }}
                        className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${viewMode === 'ALGO' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Algo Signals
                    </button>
                    <button 
                        onClick={() => { setViewMode('MANUAL'); setSelectedTrade(null); }}
                        className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${viewMode === 'MANUAL' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Paper Trades
                    </button>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                    {displayedTrades.map(trade => (
                        <div 
                            key={trade.id} 
                            onClick={() => handleSelectTrade(trade)}
                            className={`p-3 rounded border cursor-pointer transition-colors ${selectedTrade?.id === trade.id ? 'bg-blue-900/30 border-blue-500' : 'bg-[#151924] border-[#2a2e39] hover:border-gray-500'}`}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className={`font-bold ${trade.type === 'LONG' ? 'text-green-500' : 'text-red-500'}`}>{trade.type}</span>
                                <span className={`font-mono text-sm ${trade.pnl && trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    ${trade.pnl?.toFixed(2) || '0.00'}
                                </span>
                            </div>
                            <div className="text-xs text-gray-400">
                                {new Date((trade.time as number) * 1000).toLocaleString()}
                            </div>
                            {trade.algoSignal && (
                                <div className="text-[10px] text-blue-400 font-bold mt-1 uppercase tracking-tighter">
                                    {trade.algoSignal}
                                </div>
                            )}
                            {trade.tags && trade.tags.length > 0 && (
                                <div className="flex gap-1 mt-2 flex-wrap">
                                    {trade.tags.map(t => <span key={t} className="bg-gray-800 text-xs px-1 rounded">{t}</span>)}
                                </div>
                            )}
                        </div>
                    ))}
                    {displayedTrades.length === 0 && (
                        <div className="text-gray-500 text-center py-8">
                            {viewMode === 'MANUAL' ? 'No paper trades in history.' : 'No algo signals available.'}
                        </div>
                    )}
                </div>
            </div>

            {/* Trade Details / Editor */}
            <div className="flex-1 p-6 overflow-y-auto">
                {selectedTrade ? (
                    <div className="max-w-2xl mx-auto bg-[#151924] p-6 rounded-xl border border-[#2a2e39]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Trade Details</h3>
                            <span className={`px-3 py-1 rounded text-sm font-bold ${selectedTrade.result === 'WIN' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                {selectedTrade.result}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                            <div><span className="text-gray-500">Entry Price:</span> <span className="font-mono">{selectedTrade.price}</span></div>
                            <div><span className="text-gray-500">Stop Loss:</span> <span className="font-mono">{selectedTrade.stopLoss}</span></div>
                            <div><span className="text-gray-500">Take Profit:</span> <span className="font-mono">{selectedTrade.takeProfit}</span></div>
                            <div><span className="text-gray-500">Lot Size:</span> <span className="font-mono">{selectedTrade.lotSize}</span></div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-1">Notes</label>
                                <textarea 
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded p-3 text-white focus:border-blue-500 outline-none h-32"
                                    placeholder="Why did you take this trade? What happened?"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-1">Algo Signal</label>
                                <input 
                                    type="text"
                                    value={algoSignal}
                                    onChange={e => setAlgoSignal(e.target.value)}
                                    className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded p-2 text-white focus:border-blue-500 outline-none"
                                    placeholder="e.g. Trend Follower v1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-1">Tags (comma separated)</label>
                                <input 
                                    type="text"
                                    value={tags}
                                    onChange={e => setTags(e.target.value)}
                                    className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded p-2 text-white focus:border-blue-500 outline-none"
                                    placeholder="e.g. Trend Continuation, A+ Setup"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-1">Emotions (comma separated)</label>
                                <input 
                                    type="text"
                                    value={emotions}
                                    onChange={e => setEmotions(e.target.value)}
                                    className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded p-2 text-white focus:border-blue-500 outline-none"
                                    placeholder="e.g. FOMO, Confident, Anxious"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-1">Mistakes (comma separated)</label>
                                <input 
                                    type="text"
                                    value={mistakes}
                                    onChange={e => setMistakes(e.target.value)}
                                    className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded p-2 text-white focus:border-blue-500 outline-none"
                                    placeholder="e.g. Moved SL, Late Entry"
                                />
                            </div>
                            
                            <button 
                                onClick={handleSave}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded transition-colors mt-4"
                            >
                                Save Journal Entry
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                        Select a trade from the list to view and edit its journal entry.
                    </div>
                )}
            </div>
        </div>
    );
};
