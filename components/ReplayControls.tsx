
import React, { useState, useRef, useEffect } from 'react';
import { EntrySignal } from '../types';

interface ReplayControlsProps {
    isActive: boolean;
    isPlaying: boolean;
    speed: number;
    currentIndex: number;
    maxIndex: number;
    currentDate: number;
    onPlayPause: () => void;
    onSpeedChange: () => void;
    onExit: () => void;
    onSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
    focusedEntry?: EntrySignal | null;
    onShowAll?: () => void;
}

export const ReplayControls: React.FC<ReplayControlsProps> = ({
    isActive, isPlaying, speed, currentIndex, maxIndex, currentDate, onPlayPause, onSpeedChange, onExit, onSeek, focusedEntry, onShowAll
}) => {
    const [position, setPosition] = useState<{ x: number, y: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isActive && !position) {
            setPosition({ x: window.innerWidth / 2 - 170, y: 100 });
        }
    }, [isActive]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (panelRef.current) {
            setIsDragging(true);
            const rect = panelRef.current.getBoundingClientRect();
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging && position) {
                const newX = e.clientX - dragOffset.x;
                const newY = e.clientY - dragOffset.y;
                const clampedX = Math.max(0, Math.min(window.innerWidth - 300, newX));
                const clampedY = Math.max(0, Math.min(window.innerHeight - 100, newY));
                setPosition({ x: clampedX, y: clampedY });
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

    if (!isActive) return null;

    const progressPercentage = (currentIndex / maxIndex) * 100;
    const speedLevel = speed <= 100 ? 4 : speed <= 200 ? 3 : speed <= 500 ? 2 : 1;
    const speedLabel = speed <= 100 ? '10x' : speed <= 200 ? '5x' : speed <= 500 ? '2x' : '1x';

    return (
        <div 
            ref={panelRef}
            style={{ 
                left: position ? position.x : '50%', 
                top: position ? position.y : '100px',
                transform: position ? 'none' : 'translateX(-50%)',
                position: 'fixed'
            }}
            className="z-[90] bg-[#1e222d] border border-blue-500 rounded-lg shadow-[0_0_40px_rgba(0,0,0,0.6)] flex flex-col min-w-[360px] animate-in fade-in zoom-in-95 overflow-hidden"
        >
            <style>{`
                input[type=range]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    height: 16px;
                    width: 16px;
                    border-radius: 50%;
                    background: #ffffff;
                    border: 2px solid #3b82f6;
                    margin-top: -6px;
                    box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
                    cursor: pointer;
                }
                input[type=range]::-webkit-slider-runnable-track {
                    width: 100%;
                    height: 4px;
                    cursor: pointer;
                    border-radius: 2px;
                }
            `}</style>
            
            <div 
                className="flex justify-between items-center bg-[#151924] p-3 border-b border-gray-700 cursor-move select-none"
                onMouseDown={handleMouseDown}
                title="Drag to move"
            >
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Replay Mode</span>
                </div>
                <div className="text-xs font-mono text-gray-400 font-bold">
                    {new Date(currentDate * 1000).toLocaleString()}
                </div>
            </div>

            <div className="p-3">
                {/* INTEGRATED FOCUS MODE UI - Merged into Drag Panel */}
                {focusedEntry && (
                    <div className="mb-4 bg-blue-900/10 border border-blue-500/30 rounded-lg p-3 relative group">
                        <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-2 flex justify-between">
                            <span>Focus Mode</span>
                            <span className="text-gray-500">Active</span>
                        </div>
                        <div className="flex justify-between items-center">
                             <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${focusedEntry.type === 'LONG' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'}`}></div>
                                <div>
                                    <div className="text-white font-bold text-lg leading-none">{focusedEntry.type}</div>
                                    <div className="text-xs text-gray-500 font-mono mt-0.5">@{focusedEntry.price.toFixed(2)}</div>
                                </div>
                            </div>
                            <button 
                                onClick={onShowAll}
                                className="bg-[#2a2e39] hover:bg-[#363b49] text-gray-300 text-xs px-3 py-1.5 rounded transition-colors border border-gray-600 font-medium"
                            >
                                Show All
                            </button>
                        </div>
                    </div>
                )}

                {/* CONTROLS */}
                <div className="flex items-center justify-between gap-4">
                    {/* Play/Pause Button */}
                    <button 
                        onClick={onPlayPause}
                        className={`w-10 h-10 flex items-center justify-center rounded-full transition-all shadow-lg shrink-0 border ${isPlaying ? 'bg-yellow-500 border-yellow-400 hover:bg-yellow-400 text-black' : 'bg-blue-600 border-blue-500 hover:bg-blue-500 text-white'}`}
                        title={isPlaying ? "Pause" : "Play"}
                    >
                        {isPlaying ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        )}
                    </button>

                    {/* Restart Button */}
                    <button
                        onClick={() => {
                            // Reset by triggering a seek to 0
                            const fakeEvent = { target: { value: '0' } } as React.ChangeEvent<HTMLInputElement>;
                            onSeek(fakeEvent);
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white border border-gray-600 shrink-0 transition-colors"
                        title="Restart Replay"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                    </button>

                    <div className="flex-1 flex flex-col justify-center relative">
                        <input 
                            type="range" 
                            min="0" 
                            max={maxIndex} 
                            value={currentIndex} 
                            onChange={onSeek}
                            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            style={{
                                background: `linear-gradient(to right, #3b82f6 ${progressPercentage}%, #374151 ${progressPercentage}%)`
                            }}
                        />
                    </div>

                    <button 
                        onClick={onSpeedChange}
                        className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 transition-colors shrink-0 group h-8"
                        title="Playback Speed"
                    >
                        <div className="flex flex-col gap-[2px] items-end justify-center h-4">
                             <div className={`w-3 h-0.5 rounded-full transition-all ${speedLevel >= 4 ? 'bg-blue-400' : 'bg-gray-600'}`}></div>
                             <div className={`w-2.5 h-0.5 rounded-full transition-all ${speedLevel >= 3 ? 'bg-blue-400' : 'bg-gray-600'}`}></div>
                             <div className={`w-2 h-0.5 rounded-full transition-all ${speedLevel >= 2 ? 'bg-blue-400' : 'bg-gray-600'}`}></div>
                             <div className={`w-1.5 h-0.5 rounded-full transition-all ${speedLevel >= 1 ? 'bg-blue-400' : 'bg-gray-600'}`}></div>
                        </div>
                        <span className="text-xs font-bold font-mono text-gray-300 group-hover:text-white w-6 text-right">
                            {speedLabel}
                        </span>
                    </button>

                    <button 
                        onClick={onExit}
                        className="text-gray-500 hover:text-white p-2 hover:bg-gray-700 rounded-full shrink-0 transition-colors"
                        title="Exit Replay"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};
