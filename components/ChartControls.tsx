
import React, { useState, useEffect, useRef } from 'react';
import { OverlayState, EntrySignal, ICTSetupType } from '../types';
import { MODEL_INFO } from './panels/SetupsPanel';

interface ChartControlsProps {
    overlays: OverlayState;
    setOverlays: (o: OverlayState) => void;
    setupVisibility: 'ALL' | 'FOCUS' | 'NONE';
    setSetupVisibility: (m: 'ALL' | 'FOCUS' | 'NONE') => void;
    onReload: () => void;
    focusedEntry: EntrySignal | null;
    isReplayActive: boolean;
}

const ToggleOption = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
    <div 
        className="flex items-center justify-between px-4 py-2 hover:bg-gray-800 cursor-pointer transition-colors select-none"
        onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
        <span className="text-sm text-gray-300">{label}</span>
        <div className={`relative w-8 h-4 rounded-full transition-colors ${active ? 'bg-blue-600' : 'bg-gray-600'}`}>
            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${active ? 'translate-x-4' : 'translate-x-0'}`}></div>
        </div>
    </div>
);

const SetupToggleRow = ({ label, active, onToggle, description }: { label: string, active: boolean, onToggle: () => void, description?: string }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="flex flex-col border-b border-gray-800 last:border-0">
             <div 
                className="flex items-center justify-between px-4 py-2 hover:bg-gray-800 cursor-pointer transition-colors select-none"
                onClick={(e) => { e.stopPropagation(); onToggle(); }}
            >
                <div className="flex items-center gap-2">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                        className={`p-1 rounded hover:bg-gray-700 transition-colors ${expanded ? 'text-blue-400' : 'text-gray-500'}`}
                        title="Click for Explication"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    </button>
                    <span className="text-sm text-gray-300">{label}</span>
                </div>
                <div className={`relative w-8 h-4 rounded-full transition-colors ${active ? 'bg-blue-600' : 'bg-gray-600'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${active ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
            </div>
            {expanded && description && (
                <div className="px-4 py-2 bg-[#151924] text-xs text-gray-400 italic border-l-2 border-blue-500 mx-4 mb-2 animate-in slide-in-from-top-1">
                    {description}
                </div>
            )}
        </div>
    );
};

const DraggableFocusPanel = ({ 
    entry, 
    onClose, 
    onShowAll 
}: { 
    entry: EntrySignal, 
    onClose: () => void, 
    onShowAll: () => void 
}) => {
    const [position, setPosition] = useState<{ x: number, y: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [showInfo, setShowInfo] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Initial position
        const initialX = window.innerWidth - 280; 
        const initialY = 160;
        setPosition({ x: Math.max(20, initialX), y: initialY });
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging && position) {
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
    }, [isDragging, dragOffset, position]);

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

    if (!position) return null;

    const info = MODEL_INFO[entry.setupName] || { desc: "Custom Setup" };

    return (
        <div 
            ref={panelRef}
            style={{ left: position.x, top: position.y, position: 'fixed' }}
            className="z-50 bg-[#1e222d] border border-blue-500 rounded-lg p-0 shadow-[0_0_30px_rgba(0,0,0,0.5)] w-64 animate-in fade-in zoom-in-95 cursor-default overflow-hidden"
        >
            <div 
                className="bg-blue-600/10 border-b border-blue-500/30 p-2 flex justify-between items-center cursor-move select-none"
                onMouseDown={handleMouseDown}
                title="Drag to move"
            >
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Focus Mode</span>
                    <button onClick={() => setShowInfo(!showInfo)} className="text-blue-400 hover:text-white" title="Explication">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    </button>
                </div>
                <button 
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    className="text-gray-400 hover:text-white"
                >✕</button>
            </div>
            
            <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                    <div className={`w-3 h-3 rounded-full ${entry.type === 'LONG' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'}`}></div>
                    <div>
                        <div className="text-white font-bold text-lg leading-none">{entry.type}</div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">@{entry.price.toFixed(2)}</div>
                    </div>
                </div>

                {showInfo && (
                    <div className="mb-3 text-[10px] text-gray-400 bg-gray-800/50 p-2 rounded border border-gray-700 italic">
                        {info.desc}
                    </div>
                )}
                
                <button 
                    onClick={onShowAll}
                    className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs py-2 rounded transition-colors border border-gray-700 font-medium"
                >
                    Show All Setups
                </button>
            </div>
        </div>
    );
};

export const ChartControls: React.FC<ChartControlsProps> = ({ 
    overlays, setOverlays, setupVisibility, setSetupVisibility, onReload, focusedEntry, isReplayActive
}) => {
    const [activePopup, setActivePopup] = useState<string | null>(null);

    const togglePopup = (name: string) => {
        if (activePopup === name) setActivePopup(null);
        else setActivePopup(name);
    };

    const setupTypes: ICTSetupType[] = ['2022 Model', 'Silver Bullet', 'Unicorn', 'OTE', 'Breaker', 'Standard FVG'];

    return (
        <>
            <div className="absolute top-16 right-4 z-30 flex flex-col gap-2 items-end pointer-events-auto">
                <div className="flex flex-col bg-[#1e222d] border border-[#2a2e39] rounded-lg shadow-2xl p-1 gap-1">
                    <button 
                        onClick={onReload} 
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-all"
                        title="Reload Data"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg>
                    </button>
                    
                    <div className="h-[1px] bg-gray-700 mx-2"></div>

                    <div className="relative">
                        <button 
                            onClick={() => togglePopup('LAYERS')}
                            className={`w-8 h-8 flex items-center justify-center rounded transition-all ${activePopup === 'LAYERS' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                            title="Visibility Layers"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                        </button>

                        {activePopup === 'LAYERS' && (
                            <div className="absolute right-10 top-0 bg-[#1e222d] border border-[#2a2e39] rounded shadow-xl w-64 py-2 z-50 max-h-[80vh] overflow-y-auto custom-scrollbar">
                                <div className="px-3 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-700 pb-2">Chart Overlays</div>
                                
                                <ToggleOption 
                                    label="Trade Setups" 
                                    active={overlays.historicalTradeLines && setupVisibility !== 'NONE'} 
                                    onClick={() => {
                                        setOverlays({...overlays, historicalTradeLines: !overlays.historicalTradeLines});
                                        if(setupVisibility === 'NONE') setSetupVisibility('ALL');
                                        else if(overlays.historicalTradeLines) setSetupVisibility('NONE');
                                    }} 
                                />
                                
                                <ToggleOption 
                                    label="Signal Markers" 
                                    active={overlays.backtestMarkers} 
                                    onClick={() => setOverlays({...overlays, backtestMarkers: !overlays.backtestMarkers})} 
                                />

                                <div className="h-[1px] bg-gray-700 mx-4 my-2 opacity-50"></div>

                                <ToggleOption 
                                    label="Order Blocks" 
                                    active={overlays.obs} 
                                    onClick={() => setOverlays({...overlays, obs: !overlays.obs})} 
                                />
                                
                                <ToggleOption 
                                    label="Fair Value Gaps" 
                                    active={overlays.fvgs} 
                                    onClick={() => setOverlays({...overlays, fvgs: !overlays.fvgs})} 
                                />

                                <ToggleOption 
                                    label="Market Structure" 
                                    active={overlays.swingStructure} 
                                    onClick={() => setOverlays({...overlays, swingStructure: !overlays.swingStructure, internalStructure: !overlays.internalStructure})} 
                                />

                                <div className="h-[1px] bg-gray-700 mx-4 my-2 opacity-50"></div>

                                <ToggleOption 
                                    label="Session Zones" 
                                    active={overlays.killzones} 
                                    onClick={() => setOverlays({...overlays, killzones: !overlays.killzones})} 
                                />

                                <ToggleOption 
                                    label="Premium/Discount" 
                                    active={overlays.pdZones} 
                                    onClick={() => setOverlays({...overlays, pdZones: !overlays.pdZones})} 
                                />

                                <ToggleOption 
                                    label="HTF Analysis" 
                                    active={overlays.mtf} 
                                    onClick={() => setOverlays({...overlays, mtf: !overlays.mtf})} 
                                />

                                <ToggleOption 
                                    label="Silver Bullet" 
                                    active={overlays.silverBullet} 
                                    onClick={() => setOverlays({...overlays, silverBullet: !overlays.silverBullet})} 
                                />

                                <ToggleOption 
                                    label="Macro Times" 
                                    active={overlays.macro} 
                                    onClick={() => setOverlays({...overlays, macro: !overlays.macro})} 
                                />

                                <div className="px-3 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-700 pb-2 mt-4">ICT Models</div>
                                {setupTypes.map(type => (
                                    <SetupToggleRow 
                                        key={type}
                                        label={type}
                                        active={overlays.setupFilters[type]}
                                        onToggle={() => setOverlays({
                                            ...overlays,
                                            setupFilters: {
                                                ...overlays.setupFilters,
                                                [type]: !overlays.setupFilters[type]
                                            }
                                        })}
                                        description={MODEL_INFO[type]?.desc}
                                    />
                                ))}

                                <div className="h-[1px] bg-gray-700 mx-4 my-2 mt-4"></div>
                                
                                <div className="px-4 py-1">
                                    <button 
                                        className="text-xs text-blue-400 hover:text-white w-full text-left"
                                        onClick={() => { 
                                            setSetupVisibility('ALL'); 
                                            setOverlays({...overlays, historicalTradeLines: true}); 
                                            setActivePopup(null); 
                                        }}
                                    >
                                        Show All Setups
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* DRAGGABLE FOCUS POPUP - Only if Replay is NOT active */}
            {setupVisibility === 'FOCUS' && focusedEntry && !isReplayActive && (
                <DraggableFocusPanel 
                    entry={focusedEntry}
                    onClose={() => setSetupVisibility('ALL')}
                    onShowAll={() => {
                        setSetupVisibility('ALL');
                        setOverlays({...overlays, historicalTradeLines: true});
                    }}
                />
            )}
        </>
    );
};
