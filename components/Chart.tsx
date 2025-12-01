
import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { 
    createChart, 
    CandlestickSeries,
    ColorType, 
    IChartApi, 
    ISeriesApi, 
    SeriesMarker, 
    Time,
    HistogramSeries,
    IPriceLine,
    CrosshairMode
} from 'lightweight-charts';
import { CandleData, EntrySignal, FVG, OrderBlock, OverlayState, StructurePoint, TradeEntry, ColorTheme, ICTSetupType, DraftTrade } from '../types';
import { drawCanvasLayer } from '../services/chartOverlay';
import { ChartControls } from './ChartControls';
import { ReplayControls } from './ReplayControls';

interface ChartProps {
    data: CandleData[];
    obs: OrderBlock[];
    fvgs: FVG[];
    structure: StructurePoint[];
    entries: EntrySignal[];
    overlays: OverlayState;
    colors: ColorTheme;
    onHoverEntry: (entry: EntrySignal | null) => void;
    onClickEntry: (entry: EntrySignal | null) => void;
    onToggleOverlay: () => void;
    pdRange: { high: number, low: number } | null;
    positions: TradeEntry[];
    htfObs: OrderBlock[];
    htfFvgs: FVG[];
    setOverlays: (o: OverlayState) => void;
    onReload: () => void;
    setupVisibility: 'ALL' | 'FOCUS' | 'NONE';
    setSetupVisibility: (mode: 'ALL' | 'FOCUS' | 'NONE') => void;
    focusedEntry: EntrySignal | null;
    
    // Replay Props
    replayState: {
        active: boolean;
        index: number;
        playing: boolean;
        speed: number;
        maxIndex: number;
    };
    onReplayControl: {
        togglePlay: () => void;
        changeSpeed: () => void;
        exit: () => void;
        seek: (val: number) => void;
        showAll?: () => void;
    };

    // Draft Trade Props
    draftTrade?: DraftTrade | null;
    onUpdateDraft?: (update: Partial<DraftTrade>) => void;
}

export const ChartComponent: React.FC<ChartProps> = (props) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const sessionSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
    const macroSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
    
    // Layer Refs
    const canvasBgRef = useRef<HTMLCanvasElement>(null); // Background (Boxes, OBs)
    const canvasFgRef = useRef<HTMLCanvasElement>(null); // Foreground (Labels)
    
    const activeTradeLinesRef = useRef<IPriceLine[]>([]);
    const mousePos = useRef<{ x: number, y: number } | null>(null);
    const drawCanvasOverlayRef = useRef<() => void>(() => {});

    // Drag Interaction State
    const draggingLineRef = useRef<'ENTRY' | 'SL' | 'TP' | null>(null);
    const isMouseDownRef = useRef(false);

    // Filtered Entries based on Visibility Mode, Setup Types, and Replay Time
    const visibleEntries = useMemo(() => {
        let list = props.entries;
        
        // Filter by Setup Type (Granular Visibility)
        list = list.filter(e => {
            const type = e.setupName as ICTSetupType;
            // Default to true if not strictly defined
            if (props.overlays.setupFilters && props.overlays.setupFilters[type] === false) return false;
            return true;
        });

        // If replay active, filter out entries from the future
        if (props.replayState.active && props.data.length > 0) {
            const lastTime = props.data[props.data.length - 1].time as number;
            list = list.filter(e => (e.time as number) <= lastTime);
        }

        if (props.setupVisibility === 'NONE') return [];
        if (props.setupVisibility === 'FOCUS' && props.focusedEntry) {
            if (props.replayState.active) {
                const lastTime = props.data[props.data.length - 1].time as number;
                if ((props.focusedEntry.time as number) > lastTime) return []; 
            }
            return [props.focusedEntry];
        }
        return list;
    }, [props.entries, props.setupVisibility, props.focusedEntry, props.replayState.active, props.data, props.overlays.setupFilters]);

    // Zoom to focused entry effect
    useEffect(() => {
        if (props.setupVisibility === 'FOCUS' && props.focusedEntry && chartRef.current && props.data.length > 0) {
            if (props.replayState.active && props.replayState.playing) return;

            const chart = chartRef.current;
            const entryTime = props.focusedEntry.time as number;
            const exitTime = props.focusedEntry.exitTime as number | undefined;
            const entryIndex = props.data.findIndex(d => d.time === entryTime);
            
            if (entryIndex !== -1) {
                let toIndex = entryIndex + 50;
                if (exitTime) {
                    const exitIndex = props.data.findIndex(d => d.time === exitTime);
                    if (exitIndex !== -1) {
                         toIndex = exitIndex + 20; 
                    }
                }
                const fromIndex = Math.max(0, entryIndex - 30); 
                toIndex = Math.min(props.data.length - 1, toIndex);
                chart.timeScale().setVisibleLogicalRange({ from: fromIndex, to: toIndex });
            }
        }
    }, [props.focusedEntry, props.setupVisibility, props.data.length]); 

    // Initialize Chart
    useEffect(() => {
        if (!chartContainerRef.current) return;
        
        if (chartRef.current) {
            try { chartRef.current.remove(); } catch (e) { }
            chartRef.current = null;
        }

        const chart = createChart(chartContainerRef.current, {
            // Set background to transparent so underlying canvas shows through
            layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#848e9c' },
            grid: { vertLines: { color: '#151924' }, horzLines: { color: '#151924' } },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            timeScale: { timeVisible: true, secondsVisible: false },
            rightPriceScale: { visible: true, borderColor: '#2a2e39' },
            crosshair: {
                mode: CrosshairMode.Normal,
                vertLine: { labelBackgroundColor: '#2962FF', color: '#2a2e39' },
                horzLine: { labelBackgroundColor: '#2962FF', color: '#2a2e39' },
            },
            handleScale: { pinch: true, mouseWheel: true, axisPressedMouseMove: true },
            handleScroll: { vertTouchDrag: false, horzTouchDrag: true, pressedMouseMove: true, mouseWheel: true },
            kineticScroll: { touch: true, mouse: true }
        });

        const candleSeries = chart.addSeries(CandlestickSeries, {
             upColor: '#0ecb81', downColor: '#f6465d', borderVisible: false, wickUpColor: '#0ecb81', wickDownColor: '#f6465d',
             priceFormat: { type: 'price', precision: 2, minMove: 0.01 }
        });
        
        const sessionSeries = chart.addSeries(HistogramSeries, {
            color: 'rgba(255, 255, 255, 0)', priceScaleId: 'left', priceFormat: { type: 'custom', formatter: () => '' }
        });
        
        const macroSeries = chart.addSeries(HistogramSeries, {
            color: 'rgba(255, 215, 0, 0.2)', priceScaleId: 'left', priceFormat: { type: 'custom', formatter: () => '' }
        });

        chartRef.current = chart;
        candleSeriesRef.current = candleSeries;
        sessionSeriesRef.current = sessionSeries;
        macroSeriesRef.current = macroSeries;

        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight });
            }
        };
        window.addEventListener('resize', handleResize);
        
        chart.subscribeCrosshairMove(param => {
            if (param.point) mousePos.current = param.point;
            else mousePos.current = null;
            if (drawCanvasOverlayRef.current) requestAnimationFrame(drawCanvasOverlayRef.current);
            if (param.time && visibleEntries.length > 0 && !props.draftTrade) {
                const e = visibleEntries.find((x: any) => Math.abs(x.time - (param.time as number)) < 300);
                props.onHoverEntry(e || null);
            } else props.onHoverEntry(null);
        });
        
        chart.subscribeClick(param => {
            if (param.time && !props.draftTrade) {
                const clickTime = param.time as number;
                const e = visibleEntries.find((x: any) => Math.abs(x.time - clickTime) < 300); 
                if (e) props.onClickEntry(e);
            }
        });

        chart.timeScale().subscribeVisibleTimeRangeChange(() => {
            if (drawCanvasOverlayRef.current) requestAnimationFrame(drawCanvasOverlayRef.current);
        });

        return () => {
            window.removeEventListener('resize', handleResize);
            if (chartRef.current) {
                try { chartRef.current.remove(); } catch(e) {}
                chartRef.current = null;
                candleSeriesRef.current = null;
            }
        };
    }, []);

    // --- DRAG INTERACTION LOGIC ---
    useEffect(() => {
        const container = chartContainerRef.current;
        if (!container || !props.draftTrade || !props.onUpdateDraft || !candleSeriesRef.current) return;

        const getHoveredLine = (y: number, prices: { entry: number, sl: number, tp: number }) => {
            if (!candleSeriesRef.current) return null;
            const entryY = candleSeriesRef.current.priceToCoordinate(prices.entry);
            const slY = candleSeriesRef.current.priceToCoordinate(prices.sl);
            const tpY = candleSeriesRef.current.priceToCoordinate(prices.tp);

            if (entryY && Math.abs(y - entryY) < 10) return 'ENTRY';
            if (slY && Math.abs(y - slY) < 10) return 'SL';
            if (tpY && Math.abs(y - tpY) < 10) return 'TP';
            return null;
        };

        const handleMouseDown = (e: MouseEvent) => {
            if (!props.draftTrade) return;
            const rect = container.getBoundingClientRect();
            const y = e.clientY - rect.top;
            
            const hovered = getHoveredLine(y, {
                entry: props.draftTrade.entryPrice,
                sl: props.draftTrade.stopLoss,
                tp: props.draftTrade.takeProfit
            });

            if (hovered) {
                isMouseDownRef.current = true;
                draggingLineRef.current = hovered;
                container.style.cursor = 'ns-resize';
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!props.draftTrade || !candleSeriesRef.current) return;
            const rect = container.getBoundingClientRect();
            const y = e.clientY - rect.top;

            // Handle Dragging
            if (isMouseDownRef.current && draggingLineRef.current) {
                const newPrice = candleSeriesRef.current.coordinateToPrice(y);
                if (newPrice) {
                    if (draggingLineRef.current === 'ENTRY') props.onUpdateDraft({ entryPrice: newPrice });
                    else if (draggingLineRef.current === 'SL') props.onUpdateDraft({ stopLoss: newPrice });
                    else if (draggingLineRef.current === 'TP') props.onUpdateDraft({ takeProfit: newPrice });
                }
                return;
            }

            // Handle Hover Cursor
            const hovered = getHoveredLine(y, {
                entry: props.draftTrade.entryPrice,
                sl: props.draftTrade.stopLoss,
                tp: props.draftTrade.takeProfit
            });
            container.style.cursor = hovered ? 'ns-resize' : 'default';
        };

        const handleMouseUp = () => {
            isMouseDownRef.current = false;
            draggingLineRef.current = null;
            container.style.cursor = 'default';
        };

        container.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            container.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [props.draftTrade, props.onUpdateDraft]); // Re-bind when draft trade updates to get fresh values


    const handleZoom = (delta: number) => {
        const chart = chartRef.current;
        if (chart) {
            const timeScale = chart.timeScale();
            // @ts-ignore
            const currentSpacing = timeScale.options().barSpacing || 6;
            const newSpacing = currentSpacing * delta;
            if(newSpacing > 0.5 && newSpacing < 100)
                timeScale.applyOptions({ barSpacing: newSpacing });
        }
    };

    // Update Data
    useEffect(() => {
        if (candleSeriesRef.current && props.data.length > 0) {
             const coloredData = props.data.map((d: any) => {
                const isFocused = props.setupVisibility === 'FOCUS' && props.focusedEntry && d.time === props.focusedEntry.time;
                const isEntry = visibleEntries.find((e: any) => e.time === d.time);
                
                let color = undefined; 
                let borderColor = undefined;

                if (isFocused) { color = '#ffffff'; borderColor = '#ffffff'; }
                else if (isEntry && isEntry.score >= 7) { color = '#FFFF00'; borderColor = '#FFFF00'; }
                
                return { ...d, color, borderColor };
            });
            candleSeriesRef.current.setData(coloredData);
            
            if (props.replayState.active && props.replayState.playing && chartRef.current) {
                 const timeScale = chartRef.current.timeScale();
                 const range = timeScale.getVisibleLogicalRange();
                 if (range) {
                    const distFromRight = props.data.length - range.to;
                    if (distFromRight < 10) timeScale.scrollToRealTime(); 
                 }
            }
        }
    }, [props.data, visibleEntries, props.overlays, props.focusedEntry, props.setupVisibility, props.replayState.playing]);

    // Update Sessions & Macro
    useEffect(() => {
        if (sessionSeriesRef.current && props.data.length > 0) {
            const sData = props.data.map((d: any) => {
                const h = new Date(d.time * 1000).getUTCHours();
                let color = 'transparent';
                let value = 0;
                if (props.overlays.killzones) {
                    if (h >= 0 && h < 8) { color = 'rgba(255, 165, 0, 0.08)'; value = 1; }
                    else if (h >= 7 && h < 16) { color = 'rgba(41, 98, 255, 0.08)'; value = 1; }
                    else if (h >= 12 && h < 21) { color = 'rgba(0, 230, 118, 0.08)'; value = 1; }
                }
                return { time: d.time, value, color };
            });
            sessionSeriesRef.current.setData(sData);
        }
        if (macroSeriesRef.current && props.data.length > 0) {
             const mData = props.data.map((d: any) => {
                const m = new Date(d.time * 1000).getUTCMinutes();
                let value = 0;
                if (props.overlays.macro && (m >= 50 || m <= 10)) value = 1; 
                return { time: d.time, value, color: value ? 'rgba(255, 215, 0, 0.1)' : 'transparent' };
             });
             macroSeriesRef.current.setData(mData);
        }
    }, [props.data, props.overlays]);

    // Update Markers & Trade Lines
    useEffect(() => {
        if (!candleSeriesRef.current) return;
        try {
             // Clear existing trade lines
             activeTradeLinesRef.current.forEach(l => candleSeriesRef.current?.removePriceLine(l));
             activeTradeLinesRef.current = [];
            
             // Draw lines for ALL active positions
             props.positions.forEach(pos => {
                if(candleSeriesRef.current) {
                    activeTradeLinesRef.current.push(candleSeriesRef.current.createPriceLine({ 
                        price: pos.price, color: '#00B0FF', lineWidth: 3, lineStyle: 0, axisLabelVisible: true, title: `ENTRY ${pos.type}` 
                    }));
                    if (pos.stopLoss) {
                        activeTradeLinesRef.current.push(candleSeriesRef.current.createPriceLine({ 
                            price: pos.stopLoss, color: '#FF3D00', lineWidth: 2, lineStyle: 2, axisLabelVisible: true, title: 'SL' 
                        }));
                    }
                    if (pos.takeProfit) {
                        activeTradeLinesRef.current.push(candleSeriesRef.current.createPriceLine({ 
                            price: pos.takeProfit, color: '#2962FF', lineWidth: 2, lineStyle: 2, axisLabelVisible: true, title: 'TP' 
                        }));
                    }
                }
             });

            const markers: SeriesMarker<Time>[] = [];
            const lastTime = props.data.length > 0 ? props.data[props.data.length - 1].time as number : Infinity;

            if (props.overlays.swingStructure) {
                props.structure.filter(s => (s.time as number) <= lastTime).forEach((s: any) => {
                     if (['HH','HL','LH','LL'].includes(s.type))
                        markers.push({ time: s.time, position: s.type.includes('H')?'aboveBar':'belowBar', color: s.type.includes('H')?'#ef5350':'#0ecb81', shape: s.type.includes('H')?'arrowDown':'arrowUp', text: s.type });
                });
            }
            if (props.overlays.internalStructure) {
                 props.structure.filter(s => (s.time as number) <= lastTime).forEach((s: any) => {
                     if (['BOS','CHoCH'].includes(s.type))
                        // @ts-ignore
                        markers.push({ time: s.time, position: s.type.includes('BOS') ? (s.direction==='Bullish'?'belowBar':'aboveBar') : 'aboveBar', color: s.type==='BOS'?'#2962FF':'#E040FB', shape: 'none', text: s.type });
                });
            }
            if (props.overlays.backtestMarkers && props.setupVisibility !== 'NONE') {
                visibleEntries.forEach((e: any) => {
                    const grade = e.setupGrade ? `[${e.setupGrade}] ` : '';
                    const shortName = e.setupName ? e.setupName.split(' ')[0] : e.type;
                    // @ts-ignore
                    markers.push({ time: e.time, position: e.type==='LONG'?'belowBar':'aboveBar', color: e.type==='LONG'?'#00E676':'#FF1744', shape: e.type==='LONG'?'arrowUp':'arrowDown', text: `${shortName}` });
                });
            }
            // @ts-ignore
            if (candleSeriesRef.current.setMarkers) candleSeriesRef.current.setMarkers(markers);

        } catch (err) { console.warn("Error updating chart markers/lines:", err); }
        requestAnimationFrame(drawCanvasOverlay);
    }, [props.positions, props.structure, visibleEntries, props.overlays, props.data, props.setupVisibility]);

    // Canvas Overlay Drawing
    const drawCanvasOverlay = useCallback(() => {
        const chart = chartRef.current;
        const canvasBg = canvasBgRef.current;
        const canvasFg = canvasFgRef.current;
        const container = chartContainerRef.current;
        const series = candleSeriesRef.current;
        if (!chart || !canvasBg || !canvasFg || !container || !series) return;
        
        const ctxBg = canvasBg.getContext('2d');
        const ctxFg = canvasFg.getContext('2d');
        if (!ctxBg || !ctxFg) return;
        
        const pixelRatio = window.devicePixelRatio || 1;
        
        // Resize Both Canvases
        [canvasBg, canvasFg].forEach(canvas => {
            if (canvas.width !== container.clientWidth * pixelRatio || canvas.height !== container.clientHeight * pixelRatio) {
                canvas.width = container.clientWidth * pixelRatio;
                canvas.height = container.clientHeight * pixelRatio;
                canvas.style.width = container.clientWidth + "px";
                canvas.style.height = container.clientHeight + "px";
                const ctx = canvas.getContext('2d');
                if (ctx) ctx.scale(pixelRatio, pixelRatio);
            }
        });
        
        const timeScale = chart.timeScale();

        drawCanvasLayer(
            ctxBg,
            ctxFg,
            timeScale, series, props.data, props.obs, props.fvgs, visibleEntries, props.overlays, props.colors, props.pdRange, container.clientWidth, container.clientHeight, props.htfObs, props.htfFvgs, props.setupVisibility,
            props.draftTrade || undefined
        );
    }, [props.data, props.obs, props.fvgs, props.htfObs, props.htfFvgs, visibleEntries, props.pdRange, props.overlays, props.colors, props.setupVisibility, props.draftTrade]);

    useEffect(() => {
        drawCanvasOverlayRef.current = drawCanvasOverlay;
        requestAnimationFrame(drawCanvasOverlay);
    }, [drawCanvasOverlay]);

    return (
        <div className="relative w-full h-full flex flex-col bg-[#0b0e11]">
            {/* Background Canvas (Z=0) */}
            <canvas ref={canvasBgRef} className="absolute top-0 left-0 pointer-events-none z-0" />
            
            {/* Chart Container (Z=10) - Chart is Transparent */}
            <div ref={chartContainerRef} className="absolute inset-0 z-10 overflow-hidden" />
            
            {/* Foreground Canvas (Z=20) - Labels/Text */}
            <canvas ref={canvasFgRef} className="absolute top-0 left-0 pointer-events-none z-20" />
            
            <div className="absolute bottom-16 right-4 flex flex-col gap-2 z-30 pointer-events-auto">
                <button onClick={() => handleZoom(0.8)} className="w-10 h-10 bg-[#1e222d] text-white rounded-full hover:bg-gray-700 shadow-lg border border-gray-600 flex items-center justify-center opacity-80 transition-opacity hover:opacity-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
                <button onClick={() => handleZoom(1.2)} className="w-10 h-10 bg-[#1e222d] text-white rounded-full hover:bg-gray-700 shadow-lg border border-gray-600 flex items-center justify-center opacity-80 transition-opacity hover:opacity-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
            </div>

            <ChartControls 
                overlays={props.overlays} 
                setOverlays={props.setOverlays}
                setupVisibility={props.setupVisibility}
                setSetupVisibility={props.setSetupVisibility}
                onReload={props.onReload}
                focusedEntry={props.focusedEntry}
                isReplayActive={props.replayState.active}
            />

            <ReplayControls 
                isActive={props.replayState.active}
                isPlaying={props.replayState.playing}
                speed={props.replayState.speed}
                currentIndex={props.replayState.index}
                maxIndex={props.replayState.maxIndex}
                currentDate={props.data.length > 0 ? props.data[props.data.length-1].time as number : 0}
                onPlayPause={props.onReplayControl.togglePlay}
                onSpeedChange={props.onReplayControl.changeSpeed}
                onExit={props.onReplayControl.exit}
                onSeek={(e) => props.onReplayControl.seek(parseInt(e.target.value))}
                focusedEntry={props.focusedEntry}
                onShowAll={props.onReplayControl.showAll}
            />
        </div>
    );
};
