import { ISeriesApi, ITimeScaleApi, Time } from "lightweight-charts";
import { CandleData, EntrySignal, FVG, OrderBlock, OverlayState, ColorTheme, UTCTimestamp } from "../types";
import { drawSetups } from "./drawSetups";

export const drawCanvasLayer = (
    ctxBg: CanvasRenderingContext2D,
    ctxFg: CanvasRenderingContext2D,
    timeScale: ITimeScaleApi<Time>,
    series: ISeriesApi<"Candlestick">,
    data: CandleData[],
    obs: OrderBlock[],
    fvgs: FVG[],
    entries: EntrySignal[],
    overlays: OverlayState,
    colors: ColorTheme,
    pdRange: { high: number, low: number } | null,
    width: number,
    height: number,
    htfObs: OrderBlock[] = [],
    htfFvgs: FVG[] = [],
    setupVisibility: 'ALL' | 'FOCUS' | 'NONE' = 'NONE'
) => {
    // Clear both Canvases
    ctxBg.clearRect(0, 0, width, height);
    ctxFg.clearRect(0, 0, width, height);
    
    // ============================================
    // DRAW ON BACKGROUND (ctxBg) - Z-Index 0
    // ============================================

    // --- 1. PD ZONES ---
    if (overlays.pdZones && pdRange) {
        const yH = series.priceToCoordinate(pdRange.high);
        const yL = series.priceToCoordinate(pdRange.low);
        const yM = series.priceToCoordinate((pdRange.high + pdRange.low) / 2);
        
        if (yH !== null && yL !== null && yM !== null) {
            ctxBg.fillStyle = 'rgba(239, 83, 80, 0.03)'; 
            ctxBg.fillRect(0, yH, width, yM - yH);
            
            ctxBg.fillStyle = 'rgba(38, 166, 154, 0.03)'; 
            ctxBg.fillRect(0, yM, width, yL - yM);
            
            ctxBg.strokeStyle = '#78909C'; 
            ctxBg.setLineDash([4,4]);
            ctxBg.lineWidth = 1;
            ctxBg.beginPath(); 
            ctxBg.moveTo(0, yM); 
            ctxBg.lineTo(width, yM); 
            ctxBg.stroke();
            ctxBg.setLineDash([]);
        }
    }

    // --- 2. ORDER BLOCKS ---
    if (overlays.obs) {
        [...obs, ...(overlays.mtf ? htfObs : [])].forEach((ob) => {
            if (ob.mitigated) return;
            // @ts-ignore
            const x1 = timeScale.timeToCoordinate(ob.time);
            const y1 = series.priceToCoordinate(ob.priceHigh);
            const y2 = series.priceToCoordinate(ob.priceLow);
            
            if (y1 === null || y2 === null) return;
            
            const startX = x1 !== null ? x1 : 0;
            const w = width - startX;
            
            const color = ob.direction === 'Bullish' ? colors.obBull : colors.obBear;
            
            // Gradient Fill
            const grad = ctxBg.createLinearGradient(startX, 0, startX + 200, 0);
            grad.addColorStop(0, color + '60'); // More opaque at start
            grad.addColorStop(1, color + '10'); // Fade out
            
            ctxBg.fillStyle = grad;
            ctxBg.strokeStyle = color;
            ctxBg.setLineDash(ob.subtype === 'Breaker' ? [4, 2] : []);
            ctxBg.lineWidth = ob.timeframe ? 2 : 1; 
            
            ctxBg.fillRect(startX, y1, w, y2 - y1);
            
            // Draw border lines
            ctxBg.beginPath();
            ctxBg.moveTo(startX, y1);
            ctxBg.lineTo(startX + w, y1);
            ctxBg.moveTo(startX, y2);
            ctxBg.lineTo(startX + w, y2);
            ctxBg.stroke();
            
            // Label
            if (x1 !== null && x1 < width - 50) {
                 ctxBg.fillStyle = color;
                 ctxBg.font = '10px Inter';
                 ctxBg.textAlign = 'left';
                 ctxBg.fillText(`${ob.timeframe || ''} ${ob.direction === 'Bullish' ? '+OB' : '-OB'}`, startX + 5, y1 - 5);
            }
        });
    }

    // --- 3. FAIR VALUE GAPS ---
    if (overlays.fvgs) {
        [...fvgs, ...(overlays.mtf ? htfFvgs : [])].forEach((fvg) => {
            // @ts-ignore
            const x1 = timeScale.timeToCoordinate(fvg.time);
            const y1 = series.priceToCoordinate(fvg.priceHigh);
            const y2 = series.priceToCoordinate(fvg.priceLow);
            
            if (y1 === null || y2 === null) return;
            const startX = x1 !== null ? x1 : 0;
            const w = width - startX;
            
            const color = fvg.direction === 'Bullish' ? colors.fvgBull : colors.fvgBear;
            ctxBg.fillStyle = color + '20';
            ctxBg.fillRect(startX, y1, w, y2 - y1);
        });
    }

    // --- 4. TRADE SETUPS (BOXES & LINES) ---
    // Rule: Draw if 'historicalTradeLines' is checked OR if we are in FOCUS mode (forcing a single trade visibility)
    if ((overlays.historicalTradeLines || setupVisibility === 'FOCUS') && entries.length > 0) {
        // Draw Background Elements (Boxes, Connector Lines) on ctxBg
        drawSetups(ctxBg, timeScale, series, data, entries, true, width, 'bg');
    }

    // ============================================
    // DRAW ON FOREGROUND (ctxFg) - Z-Index 20
    // ============================================

    // --- 5. TRADE SETUPS (LABELS & ICONS) ---
    if ((overlays.historicalTradeLines || setupVisibility === 'FOCUS') && entries.length > 0) {
        // Draw Foreground Elements (Text Labels, Icons) on ctxFg
        drawSetups(ctxFg, timeScale, series, data, entries, true, width, 'fg');
    }
};