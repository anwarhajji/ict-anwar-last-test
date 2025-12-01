
import React, { useState } from 'react';
import { TradeEntry, DraftTrade } from '../../types';

interface TradingPanelProps {
    balance: number;
    positions: TradeEntry[];
    data: any[];
    closeTrade: (id: string, pnl: number) => void;
    enterTrade: (type: 'LONG' | 'SHORT', price: number, sl: number, tp: number, lotSize: number) => void;
    slInput: string; setSlInput: (s: string) => void;
    tpInput: string; setTpInput: (s: string) => void;
    autoTrade: boolean; setAutoTrade: (b: boolean) => void;
    resetAccount?: () => void;
    
    // Draft Trade Props
    draftTrade?: DraftTrade | null;
    onStartDraft?: (type: 'LONG' | 'SHORT') => void;
    onCancelDraft?: () => void;
    onExecuteDraft?: () => void;
    onUpdateDraft?: (u: Partial<DraftTrade>) => void;
}

export const TradingPanel: React.FC<TradingPanelProps> = (props) => {
    const currentPrice = props.data.length > 0 ? props.data[props.data.length - 1].close : 0;
    
    const riskAmount = props.draftTrade 
        ? Math.abs(props.draftTrade.entryPrice - props.draftTrade.stopLoss) * props.draftTrade.lotSize
        : 0;
    const rewardAmount = props.draftTrade
        ? Math.abs(props.draftTrade.entryPrice - props.draftTrade.takeProfit) * props.draftTrade.lotSize
        : 0;
    const rr = riskAmount > 0 ? rewardAmount / riskAmount : 0;

    return (
        <div className="h-full flex flex-col bg-[#151924]">
            <div className="p-4 border-b border-[#2a2e39] flex justify-between items-center shrink-0">
                <h2 className="font-bold text-white">Trading Desk</h2>
                <div className="text-xs bg-blue-900/20 text-blue-400 px-2 py-0.5 rounded border border-blue-900/50">Simulated Execution</div>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                
                {/* Balance Display */}
                <div className="bg-[#0b0e11] p-4 rounded border border-[#2a2e39] mb-6 flex justify-between items-center">
                     <div>
                         <div className="text-xs text-gray-500 uppercase mb-1">Total Equity</div>
                         <div className="text-xl font-mono text-white font-bold">${props.balance.toLocaleString()}</div>
                     </div>
                     <div className="text-right">
                         <div className="text-xs text-gray-500 uppercase mb-1">Open PnL</div>
                         {/* Calculate total open PnL */}
                         <div className={`text-sm font-mono font-bold ${props.positions.length > 0 ? 'text-white' : 'text-gray-600'}`}>
                             --
                         </div>
                     </div>
                </div>

                {/* DRAFT MODE CONTROLS */}
                {props.draftTrade ? (
                    <div className="bg-blue-900/10 border border-blue-500/30 p-4 rounded-lg mb-6 animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between items-center mb-4 border-b border-blue-500/20 pb-2">
                            <span className={`text-lg font-bold ${props.draftTrade.type === 'LONG' ? 'text-green-500' : 'text-red-500'}`}>
                                {props.draftTrade.type} DRAFT
                            </span>
                            <span className="text-xs text-gray-400">Adjust on Chart</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase block mb-1">Lot Size</label>
                                <input 
                                    type="number" step="0.01" 
                                    value={props.draftTrade.lotSize} 
                                    onChange={e => props.onUpdateDraft && props.onUpdateDraft({ lotSize: parseFloat(e.target.value) })}
                                    className="w-full bg-[#0b0e11] border border-gray-700 rounded p-2 text-white font-mono text-sm focus:border-blue-500 outline-none"
                                />
                            </div>
                             <div>
                                <label className="text-[10px] text-gray-500 uppercase block mb-1">Entry Price</label>
                                <input 
                                    type="number" 
                                    value={props.draftTrade.entryPrice.toFixed(2)} 
                                    onChange={e => props.onUpdateDraft && props.onUpdateDraft({ entryPrice: parseFloat(e.target.value) })}
                                    className="w-full bg-[#0b0e11] border border-gray-700 rounded p-2 text-white font-mono text-sm focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                            <div className="bg-[#0b0e11] p-2 rounded">
                                <div className="text-[10px] text-gray-500">Risk</div>
                                <div className="text-red-400 font-mono text-xs font-bold">-${riskAmount.toFixed(2)}</div>
                            </div>
                            <div className="bg-[#0b0e11] p-2 rounded">
                                <div className="text-[10px] text-gray-500">Reward</div>
                                <div className="text-green-400 font-mono text-xs font-bold">+${rewardAmount.toFixed(2)}</div>
                            </div>
                            <div className="bg-[#0b0e11] p-2 rounded">
                                <div className="text-[10px] text-gray-500">R:R</div>
                                <div className="text-blue-400 font-mono text-xs font-bold">{rr.toFixed(2)}</div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={props.onExecuteDraft} 
                                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded font-bold shadow-lg shadow-blue-900/20 transition-all"
                            >
                                PLACE ORDER
                            </button>
                            <button 
                                onClick={props.onCancelDraft} 
                                className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded font-bold border border-gray-600 transition-all"
                            >
                                CANCEL
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 mb-8">
                        <button 
                            onClick={() => props.onStartDraft && props.onStartDraft('LONG')}
                            className="bg-green-600/10 hover:bg-green-600 hover:text-white text-green-500 border border-green-600/50 py-6 rounded-lg transition-all group flex flex-col items-center justify-center gap-2"
                        >
                            <span className="text-xl font-bold">LONG</span>
                            <span className="text-[10px] opacity-70 group-hover:opacity-100">Draft Position</span>
                        </button>
                        <button 
                             onClick={() => props.onStartDraft && props.onStartDraft('SHORT')}
                            className="bg-red-600/10 hover:bg-red-600 hover:text-white text-red-500 border border-red-600/50 py-6 rounded-lg transition-all group flex flex-col items-center justify-center gap-2"
                        >
                            <span className="text-xl font-bold">SHORT</span>
                            <span className="text-[10px] opacity-70 group-hover:opacity-100">Draft Position</span>
                        </button>
                    </div>
                )}

                {/* ACTIVE POSITIONS LIST */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-sm text-gray-400 uppercase">Open Positions</h3>
                        <span className="text-xs bg-gray-800 px-2 py-1 rounded text-white">{props.positions.length}</span>
                    </div>
                    
                    <div className="space-y-3">
                        {props.positions.map((pos) => {
                             const pnl = pos.type === 'LONG' 
                                ? (currentPrice - pos.price) * pos.lotSize 
                                : (pos.price - currentPrice) * pos.lotSize;
                                
                             return (
                                <div key={pos.id} className="bg-[#0b0e11] p-3 rounded border border-[#2a2e39] relative overflow-hidden group">
                                    <div className={`absolute top-0 left-0 w-1 h-full ${pos.type === 'LONG' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    <div className="flex justify-between items-start mb-2 pl-2">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-bold ${pos.type === 'LONG' ? 'text-green-500' : 'text-red-500'}`}>{pos.type}</span>
                                                <span className="text-xs text-gray-500 font-mono">Lot: {pos.lotSize.toFixed(2)}</span>
                                            </div>
                                            <div className="text-xs text-gray-400 font-mono mt-0.5">@ {pos.price.toFixed(2)}</div>
                                        </div>
                                        <div className={`text-sm font-bold font-mono ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="pl-2">
                                        <button 
                                            onClick={() => props.closeTrade(pos.id, pnl)} 
                                            className="w-full bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 py-1.5 rounded border border-gray-700 transition-colors"
                                        >
                                            Close Position
                                        </button>
                                    </div>
                                </div>
                             );
                        })}
                        {props.positions.length === 0 && (
                            <div className="text-center py-8 text-gray-600 text-xs bg-[#0b0e11]/50 rounded border border-dashed border-gray-800">
                                No active positions
                            </div>
                        )}
                    </div>
                </div>

                {props.resetAccount && (
                    <div className="mt-8 border-t border-[#2a2e39] pt-4 text-center">
                        <button 
                            onClick={props.resetAccount}
                            className="text-xs text-gray-600 hover:text-red-400 underline transition-colors"
                        >
                            Reset Paper Trading Account
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
