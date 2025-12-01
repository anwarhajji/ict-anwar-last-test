
import React, { useState } from 'react';
import { StructurePoint, EntrySignal, BiasMatrix, SessionBias } from '../../types';

interface ScannerPanelProps {
    structure: StructurePoint[];
    entries: EntrySignal[];
    setClickedEntry: (e: EntrySignal) => void;
    onDeepScan?: () => void;
    isScanning?: boolean;
    onClose: () => void;
    onFocusEntry?: (e: EntrySignal) => void;
    focusedEntry?: EntrySignal | null;
    onReplay?: (e: EntrySignal) => void;
    currentAsset?: string;
    biasMatrix?: BiasMatrix;
}

// Tooltip State Interface
interface TooltipData {
    title: string;
    content: string;
    sub?: string;
    x: number;
    y: number;
    width: number;
}

// Helper Component for the Tooltip itself
const FixedTooltip = ({ data, onClose }: { data: TooltipData, onClose: () => void }) => {
    // Determine if we should show above or below based on screen position
    const isTopHalf = data.y < window.innerHeight / 2;
    
    return (
        <div 
            className="fixed z-[9999] bg-[#1e222d] border border-gray-600 p-3 rounded shadow-xl animate-in fade-in zoom-in-95 w-64 pointer-events-auto cursor-pointer"
            style={{ 
                // If top half, show below. If bottom half, show above.
                top: isTopHalf ? data.y + 40 : 'auto',
                bottom: !isTopHalf ? window.innerHeight - data.y + 10 : 'auto',
                left: Math.min(Math.max(10, data.x), window.innerWidth - 270), // Smart horizontal positioning
            }}
            onClick={(e) => { e.stopPropagation(); onClose(); }}
        >
            <div className="flex justify-between items-start border-b border-gray-700 pb-1 mb-1">
                <div className="text-[10px] font-bold text-gray-400 uppercase">{data.title}</div>
                <div className="text-[10px] text-gray-600">✕</div>
            </div>
            <p className="text-xs text-white mb-2 leading-tight">{data.content}</p>
            {data.sub && (
                <>
                    <div className="text-[10px] font-bold text-blue-400 uppercase mb-0.5">Forecast</div>
                    <p className="text-[10px] text-gray-300 italic">{data.sub}</p>
                </>
            )}
            {/* Arrow */}
            <div 
                className={`absolute left-4 w-3 h-3 bg-[#1e222d] border-l border-t border-gray-600 transform rotate-45 ${isTopHalf ? '-top-1.5' : '-bottom-1.5 border-l-0 border-t-0 border-r border-b'}`}
            ></div>
        </div>
    );
};

// Helper: Session Card with PO3 Logic
const SessionCard = ({ 
    label, 
    data, 
    onHover, 
    onLeave 
}: { 
    label: string, 
    data?: SessionBias,
    onHover: (e: React.MouseEvent, title: string, content: string, sub?: string) => void,
    onLeave: () => void
}) => {
    if (!data) return <div className="p-2 border border-gray-800 rounded bg-gray-900/50 text-gray-600 text-xs">No Data</div>;

    const { status, direction, po3Phase, explanation, prediction } = data;
    
    let borderColor = 'border-gray-700';
    let bgColor = 'bg-gray-800';
    let textColor = 'text-gray-400';
    let phaseColor = 'text-gray-500';
    
    if (status !== 'PENDING') {
        if (po3Phase === 'ACCUMULATION') { borderColor = 'border-yellow-600/50'; bgColor = 'bg-yellow-900/10'; phaseColor = 'text-yellow-400'; }
        else if (po3Phase === 'MANIPULATION') { borderColor = 'border-purple-600/50'; bgColor = 'bg-purple-900/10'; phaseColor = 'text-purple-400'; }
        else if (po3Phase === 'EXPANSION' || po3Phase === 'DISTRIBUTION') { borderColor = 'border-blue-600/50'; bgColor = 'bg-blue-900/10'; phaseColor = 'text-blue-400'; }
        
        textColor = direction === 'Bullish' ? 'text-green-400' : direction === 'Bearish' ? 'text-red-400' : 'text-gray-300';
    } else {
        bgColor = 'bg-gray-800/30';
        borderColor = 'border-gray-700/30 border-dashed';
    }

    return (
        <div 
            className={`relative p-3 rounded border ${borderColor} ${bgColor} flex flex-col group cursor-pointer sm:cursor-help transition-all active:scale-[0.98]`}
            onMouseEnter={(e) => {
                if(status !== 'PENDING') onHover(e, `${label} Analysis`, explanation, prediction);
            }}
            onMouseLeave={onLeave}
            onClick={(e) => {
                if(status !== 'PENDING') onHover(e, `${label} Analysis`, explanation, prediction);
            }}
        >
            {status === 'FINISHED' && <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full" title="Session Finished"></div>}
            
            <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] uppercase font-bold text-gray-500">{label}</span>
                <span className={`text-[10px] font-mono ${textColor}`}>{status === 'PENDING' ? '--' : direction}</span>
            </div>
            
            <div className={`text-xs font-bold mb-1 ${phaseColor}`}>{status === 'PENDING' ? 'WAITING' : po3Phase}</div>
        </div>
    );
};

// Simple Bias Cell for HTF
const HtfBiasCell = ({ 
    label, 
    bias, 
    explanation,
    onHover,
    onLeave
}: { 
    label: string, 
    bias?: string, 
    explanation?: string,
    onHover: (e: React.MouseEvent, title: string, content: string) => void,
    onLeave: () => void
}) => (
    <div 
        className="relative group cursor-pointer sm:cursor-help transition-all active:scale-[0.98]"
        onMouseEnter={(e) => {
            if(explanation) onHover(e, `${label} Bias Logic`, explanation);
        }}
        onMouseLeave={onLeave}
        onClick={(e) => {
            if(explanation) onHover(e, `${label} Bias Logic`, explanation);
        }}
    >
        <div className="flex justify-between items-center p-2 bg-[#0b0e11] rounded border border-[#2a2e39] h-full">
            <span className="text-xs text-gray-500">{label}</span>
            <span className={`text-xs font-bold ${bias === 'Bullish' ? 'text-green-500' : bias === 'Bearish' ? 'text-red-500' : 'text-gray-400'}`}>
                {bias || 'Neutral'}
            </span>
        </div>
    </div>
);

export const ScannerPanel: React.FC<ScannerPanelProps> = ({ 
    structure, entries, setClickedEntry, onDeepScan, isScanning, onFocusEntry, focusedEntry, onReplay, currentAsset, biasMatrix 
}) => {
    const [activeTooltip, setActiveTooltip] = useState<TooltipData | null>(null);

    const handleTooltipEnter = (e: React.MouseEvent, title: string, content: string, sub?: string) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setActiveTooltip({
            title,
            content,
            sub,
            x: rect.left,
            y: rect.top,
            width: rect.width
        });
    };

    const handleTooltipLeave = () => {
        // On Desktop, mouse leave hides it. On Mobile, we rely on click outside or close button.
        if (window.innerWidth > 768) {
            setActiveTooltip(null);
        }
    };
    
    return (
        <div className="h-full flex flex-col bg-[#151924] relative" onClick={() => setActiveTooltip(null)}>
            {activeTooltip && <FixedTooltip data={activeTooltip} onClose={() => setActiveTooltip(null)} />}

            <div className="p-4 border-b border-[#2a2e39] flex justify-between items-center shrink-0">
                <h2 className="font-bold text-white">Market Scanner</h2>
                <div className="text-xs text-gray-500 font-mono">LIVE</div>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                
                {/* BIAS MATRIX & PO3 */}
                {biasMatrix && (
                    <div className="mb-6">
                        <div className="text-xs font-bold text-gray-500 uppercase mb-3 flex justify-between items-center">
                            <span>Power of 3 Analysis (AMD)</span>
                            <span className="bg-purple-900/20 text-purple-400 px-1.5 py-0.5 rounded text-[10px] border border-purple-500/30">
                                {biasMatrix.po3State !== 'NONE' ? biasMatrix.po3State : 'ANALYZING...'}
                            </span>
                        </div>
                        
                        {/* Higher Timeframe Context - Responsive Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                            <HtfBiasCell label="Month" bias={biasMatrix.monthly.direction} explanation={biasMatrix.monthly.explanation} onHover={handleTooltipEnter} onLeave={handleTooltipLeave} />
                            <HtfBiasCell label="Week" bias={biasMatrix.weekly.direction} explanation={biasMatrix.weekly.explanation} onHover={handleTooltipEnter} onLeave={handleTooltipLeave} />
                            <HtfBiasCell label="Day" bias={biasMatrix.daily.direction} explanation={biasMatrix.daily.explanation} onHover={handleTooltipEnter} onLeave={handleTooltipLeave} />
                        </div>
                        
                        {/* Session Bias Grid with PO3 - Responsive Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                            <SessionCard label="Asia" data={biasMatrix.sessionBiases.ASIA} onHover={handleTooltipEnter} onLeave={handleTooltipLeave} />
                            <SessionCard label="London" data={biasMatrix.sessionBiases.LONDON} onHover={handleTooltipEnter} onLeave={handleTooltipLeave} />
                            <SessionCard label="New York" data={biasMatrix.sessionBiases.NEW_YORK} onHover={handleTooltipEnter} onLeave={handleTooltipLeave} />
                        </div>
                        <div className="text-[10px] text-gray-500 text-center italic mt-1">
                            {window.innerWidth <= 768 ? "Tap cards for algorithmic logic" : "Hover over cards for algorithmic logic"}
                        </div>
                    </div>
                )}

                <div className="mb-6">
                     <div className="text-xs font-bold text-gray-500 uppercase mb-2">LTF Structure</div>
                     <div className="bg-[#0b0e11] p-3 rounded border border-[#2a2e39] flex justify-between items-center">
                        <span className="text-sm text-gray-400">Trend</span>
                        <span className={`text-sm font-bold ${structure[structure.length-1]?.direction === 'Bullish' ? 'text-green-500' : 'text-red-500'}`}>
                            {structure[structure.length-1]?.direction || 'Neutral'}
                        </span>
                     </div>
                </div>

                {onDeepScan && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDeepScan(); }}
                        disabled={isScanning}
                        className={`w-full mb-6 p-3 rounded text-sm font-bold flex items-center justify-center gap-2 transition-all ${isScanning ? 'bg-gray-700 cursor-not-allowed text-gray-400' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'}`}
                    >
                        {isScanning ? 'Analyzing...' : 'Run Deep Scan (AI)'}
                    </button>
                )}

                <div>
                    <div className="text-xs font-bold text-gray-500 uppercase mb-3 flex justify-between">
                        <span>Recent Signals</span>
                        <span>{entries.length} Total</span>
                    </div>
                    <div className="space-y-2">
                        {entries.slice(-10).reverse().map((entry, i) => {
                            const isFocused = focusedEntry && entry.time === focusedEntry.time;
                            return (
                                <div key={i} className={`group p-3 bg-[#0b0e11] rounded border transition-colors ${isFocused ? 'border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.2)] bg-blue-900/10' : 'border-[#2a2e39] hover:border-blue-500'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex flex-col cursor-pointer" onClick={(e) => { e.stopPropagation(); setClickedEntry(entry); }}>
                                            <div className="flex items-center gap-2 mb-1">
                                                 <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${entry.type === 'LONG' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                                                    {entry.type}
                                                </span>
                                                <span className="text-xs font-bold text-white truncate max-w-[80px]">{currentAsset || 'Asset'}</span>
                                            </div>
                                            <div className="text-[10px] text-gray-500 font-mono">
                                                {new Date(entry.time as number * 1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} • @ {entry.price.toFixed(2)}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <div className="bg-gray-800 text-[10px] text-gray-300 px-1.5 py-0.5 rounded border border-gray-700">
                                                {entry.score}/10
                                            </div>
                                            {onReplay && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onReplay(entry); }}
                                                    className="p-1.5 rounded bg-gray-800 text-gray-400 hover:text-blue-400 hover:bg-gray-700 transition-all"
                                                    title="Replay Trade"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                                </button>
                                            )}
                                            {onFocusEntry && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onFocusEntry(entry); }} 
                                                    className={`p-1.5 rounded transition-all flex items-center justify-center w-7 h-7 ${isFocused ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'}`} 
                                                    title={isFocused ? "Currently Focused" : "View on Chart"}
                                                >
                                                    {isFocused ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="22" y1="12" x2="18" y2="12"></line><line x1="6" y1="12" x2="2" y2="12"></line><line x1="12" y1="6" x2="12" y2="2"></line><line x1="12" y1="22" x2="12" y2="18"></line></svg>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center cursor-pointer pt-1 border-t border-gray-800/50 mt-1" onClick={(e) => { e.stopPropagation(); setClickedEntry(entry); }}>
                                        <span className="text-xs text-gray-300 font-medium truncate w-24" title={entry.setupName}>{entry.setupName || 'Standard Setup'}</span>
                                        {entry.setupGrade && <span className={`text-[10px] font-bold px-1 rounded ${entry.setupGrade.includes('A') ? 'text-yellow-400' : 'text-gray-500'}`}>{entry.setupGrade}</span>}
                                    </div>
                                </div>
                            );
                        })}
                        {entries.length === 0 && <div className="text-center text-gray-600 text-xs py-4">No setups detected in current range</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};
