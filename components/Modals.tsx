import React, { useMemo, useState, useRef, useEffect, ReactNode, Component } from 'react';
import { EntrySignal } from '../types';
import { MODEL_INFO } from './panels/SetupsPanel';

export const EntryDetailModal = ({ entry, onClose, onReplay }: { entry: EntrySignal, onClose: () => void, onReplay?: () => void }) => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [showStrategyLogic, setShowStrategyLogic] = useState(false); // New state for inline expansion
    const panelRef = useRef<HTMLDivElement>(null);

    // Initial positioning center screen
    useEffect(() => {
        setPosition({ 
            x: Math.max(10, window.innerWidth / 2 - Math.min(window.innerWidth * 0.95, 450) / 2), 
            y: Math.max(20, window.innerHeight / 2 - 300) 
        });
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (panelRef.current) {
            const rect = panelRef.current.getBoundingClientRect();
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
            setIsDragging(true);
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setPosition({
                    x: e.clientX - dragOffset.x,
                    y: e.clientY - dragOffset.y
                });
            }
        };
        const handleMouseUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    const setupInfo = MODEL_INFO[entry.setupName] || { desc: "Custom or standard algorithmic pattern detection.", rules: [] };

    return (
        <div 
            ref={panelRef}
            style={{ 
                left: position.x, 
                top: position.y,
                position: 'fixed'
            }}
            className="z-[100] bg-[#1e222d] border border-blue-500 rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.6)] w-[95vw] max-w-[450px] max-h-[85vh] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 flex flex-col"
            onClick={e => e.stopPropagation()}
        >
            <div 
                className="flex justify-between items-center p-4 border-b border-gray-700 cursor-move bg-[#151924] rounded-t-lg select-none sticky top-0 z-10"
                onMouseDown={handleMouseDown}
            >
                <h3 className={`text-xl md:text-2xl font-bold ${entry.type === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>
                    {entry.type} SETUP
                </h3>
                <button 
                    onClick={onClose} 
                    className="text-gray-400 hover:text-white text-lg p-1 hover:bg-gray-700 rounded transition-colors"
                >
                    ✕
                </button>
            </div>

            <div className="p-4 md:p-6">
                <div className="text-right -mt-2 mb-4">
                    <div className="text-xs text-gray-500 uppercase font-bold">Entry Date</div>
                    <div className="text-white text-sm font-mono">{new Date((entry.time as number) * 1000).toLocaleString()}</div>
                </div>

                {/* Primary Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-[#0b0e11] p-3 rounded border border-gray-800">
                        <div className="text-[10px] md:text-xs text-gray-500 mb-1">ENTRY PRICE</div>
                        <div className="text-lg md:text-xl font-mono text-white">{entry.price.toFixed(2)}</div>
                    </div>
                    <div className="bg-[#0b0e11] p-3 rounded border border-gray-800">
                        <div className="text-[10px] md:text-xs text-gray-500 mb-1">RESULT (2R)</div>
                        <div className={`text-lg md:text-xl font-bold ${entry.backtestResult === 'WIN' ? 'text-green-500' : entry.backtestResult === 'LOSS' ? 'text-red-500' : 'text-yellow-500'}`}>
                            {entry.backtestResult || 'PENDING'}
                        </div>
                    </div>
                </div>

                {/* New Setup Stats Section */}
                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                    <div className="bg-[#151924] p-2 rounded border border-gray-700/50">
                        <div className="text-[9px] text-gray-500 uppercase font-bold mb-0.5">Model</div>
                        <div className="text-xs md:text-sm font-bold text-blue-400 truncate px-1" title={entry.setupName}>{entry.setupName}</div>
                    </div>
                    <div className="bg-[#151924] p-2 rounded border border-gray-700/50">
                        <div className="text-[9px] text-gray-500 uppercase font-bold mb-0.5">Grade</div>
                        <div className={`text-xs md:text-sm font-bold ${entry.setupGrade?.includes('A') ? 'text-yellow-400' : 'text-gray-400'}`}>{entry.setupGrade || 'N/A'}</div>
                    </div>
                     <div className="bg-[#151924] p-2 rounded border border-gray-700/50">
                        <div className="text-[9px] text-gray-500 uppercase font-bold mb-0.5">Win Prob</div>
                        <div className="text-xs md:text-sm font-bold text-green-400">{entry.winProbability}%</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Confluence List */}
                    <div>
                        <div className="text-xs font-bold text-gray-400 mb-2 uppercase">Confluence & Strategy</div>
                        <ul className="space-y-2">
                            {entry.confluences.map((c, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                                    <span className="text-green-500">✓</span> {c}
                                </li>
                            ))}
                            <li className="flex items-center gap-2 text-sm text-gray-300"><span className="text-blue-500">ℹ</span> Style: {entry.tradingStyle}</li>
                            <li className="flex items-center gap-2 text-sm text-gray-300"><span className="text-purple-500">ℹ</span> Phase: {entry.po3Phase}</li>
                        </ul>
                    </div>
                    
                    {/* Actions & Logic */}
                    <div className="flex flex-col gap-3">
                         {/* Replay Button */}
                        {onReplay && (
                            <button 
                                onClick={onReplay}
                                className="flex items-center justify-center gap-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 hover:text-white border border-blue-600/50 p-2 rounded transition-all group"
                                title="Replay this exact trade setup"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:animate-spin-slow"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                                <span className="text-xs font-bold uppercase">Replay Setup</span>
                            </button>
                        )}
                        
                        {/* Interactive Explication Card - Click to Expand */}
                        <div 
                            className={`relative group cursor-pointer bg-[#0b0e11] p-3 rounded border transition-all flex flex-col justify-center overflow-hidden ${showStrategyLogic ? 'border-blue-500' : 'border-gray-800 hover:border-gray-500'}`}
                            onClick={() => setShowStrategyLogic(!showStrategyLogic)}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                                    <div className="text-xs text-gray-500 uppercase font-bold group-hover:text-blue-400 transition-colors">Strategy Logic</div>
                                </div>
                                <svg 
                                    xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                    className={`text-gray-500 transition-transform ${showStrategyLogic ? 'rotate-180' : ''}`}
                                >
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </div>
                            
                            {!showStrategyLogic && <div className="text-white text-xs opacity-70 italic truncate">Click to view rules & description</div>}
                            
                            {/* Inline Expansion Content */}
                            {showStrategyLogic && (
                                <div className="mt-2 pt-2 border-t border-gray-800 animate-in fade-in slide-in-from-top-2">
                                    <h4 className="font-bold text-white mb-2 text-xs">{entry.setupName}</h4>
                                    <p className="text-xs text-gray-300 mb-3 leading-relaxed">{setupInfo.desc}</p>
                                    <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Rules:</div>
                                    <ul className="list-disc pl-4 text-[10px] text-gray-400 space-y-1">
                                        {setupInfo.rules.map((r, i) => <li key={i}>{r}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800/30 p-4 rounded border border-gray-700 space-y-2">
                    <div className="flex justify-between text-sm font-mono">
                        <span className="text-green-500 font-bold">Target (TP):</span>
                        <span className="text-white">{entry.tp.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-mono">
                        <span className="text-red-500 font-bold">Stop (SL):</span>
                        <span className="text-white">{entry.sl.toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-gray-700 my-1"></div>
                    <div className="flex justify-between text-sm font-mono items-center">
                        <span className="text-yellow-500">Lot Size (Risk 1%):</span>
                        <span className="text-white bg-gray-700 px-2 rounded">{entry.lotSize?.toFixed(3)}</span>
                    </div>
                    <div className="mt-2 text-center text-xs text-gray-500 pt-2">
                        PnL if taken: <span className={`font-bold ${entry.backtestPnL && entry.backtestPnL > 0 ? 'text-green-400' : 'text-red-400'}`}>${entry.backtestPnL?.toFixed(2)}</span>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <button 
                        onClick={onClose} 
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg w-full font-bold transition-all shadow-lg hover:shadow-blue-900/50"
                    >
                        ACKNOWLEDGE
                    </button>
                </div>
            </div>
        </div>
    );
};

export const TopSetupsModal = ({ entries, onClose }: { entries: EntrySignal[], onClose: () => void }) => {
    const topSetups = useMemo(() => {
        return [...entries].sort((a, b) => b.score - a.score).slice(0, 3);
    }, [entries]);

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-[#1e222d] border border-yellow-500 rounded-lg w-[95vw] max-w-2xl p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">✕</button>
                <h2 className="text-xl md:text-2xl font-bold text-yellow-400 mb-6 flex items-center gap-2">⚡ TOP 3 HIGH PROBABILITY SETUPS</h2>
                <div className="space-y-4">
                    {topSetups.map((setup, i) => (
                        <div key={i} className="bg-gray-800/50 border border-gray-700 p-4 rounded hover:bg-gray-800 transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-lg font-bold ${setup.type === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>{setup.type}</span>
                                        <span className="text-xs text-gray-500 font-mono">{new Date((setup.time as number) * 1000).toLocaleString()}</span>
                                    </div>
                                    <div className="text-sm text-gray-300">Price: <span className="font-mono text-white">{setup.price}</span></div>
                                </div>
                                <div className="text-right">
                                    <div className="bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded text-xs font-bold border border-yellow-500/50 inline-block mb-1">SCORE: {setup.score}/10</div>
                                </div>
                            </div>
                            <div className="mt-2 text-xs text-gray-400">
                                <strong>Confluences:</strong> {setup.confluences.join(', ')}
                            </div>
                        </div>
                    ))}
                    {topSetups.length === 0 && <div className="text-center text-gray-500 py-4">No setups found yet.</div>}
                </div>
            </div>
        </div>
    );
};

export const ToastNotification = ({ message, type, onClose }: { message: string, type: 'success'|'error'|'info'|'warning', onClose: () => void }) => (
    <div className={`fixed top-4 right-4 p-4 rounded shadow-lg z-[60] text-white animate-bounce cursor-pointer border ${type === 'success' ? 'bg-green-600 border-green-400' : type === 'warning' ? 'bg-yellow-600 border-yellow-400' : 'bg-blue-600 border-blue-400'}`} onClick={onClose}>
        <div className="flex justify-between items-center gap-4"><span>{message}</span><button onClick={onClose} className="text-sm font-bold">x</button></div>
    </div>
);

interface ErrorBoundaryProps {
    children?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = {
        hasError: false
    };

    static getDerivedStateFromError(error: any): ErrorBoundaryState {
        return { hasError: true };
    }
    
    componentDidCatch(error: any, errorInfo: any) {
        console.error("Chart Error:", error, errorInfo);
    }
    
    render() {
        if (this.state.hasError) return (
            <div className="flex items-center justify-center h-full text-red-500 bg-gray-900 p-4 flex-col gap-4">
                <h3 className="font-bold text-lg">Chart Component Error</h3>
                <p className="text-sm text-gray-400">Something went wrong while rendering the chart.</p>
                <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-4 py-2 rounded">Reload Page</button>
            </div>
        );
        return this.props.children || null;
    }
}
