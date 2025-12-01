
import { CandleData, EntrySignal, FVG, OrderBlock, SessionType, StructurePoint, ICTSetupType, UTCTimestamp, BiasMatrix, BiasState, PO3Phase, SessionBias } from '../types';

// --- UTILS ---
export const getSession = (hour: number): SessionType => {
    if (hour >= 0 && hour < 8) return 'ASIA';
    if (hour >= 7 && hour < 16) return 'LONDON';
    if (hour >= 12 && hour < 21) return 'NEW_YORK';
    return 'NONE';
};

export const determinePO3 = (candle: CandleData, session: SessionType, dailyOpen: number, dailyBias: 'Bullish' | 'Bearish' | 'Neutral'): PO3Phase => {
    const price = candle.close;
    if (session === 'ASIA') return 'ACCUMULATION';
    if (dailyBias === 'Bullish' && price < dailyOpen) return 'MANIPULATION';
    if (dailyBias === 'Bearish' && price > dailyOpen) return 'MANIPULATION';
    if (dailyBias === 'Bullish' && price > dailyOpen) return 'DISTRIBUTION';
    if (dailyBias === 'Bearish' && price < dailyOpen) return 'DISTRIBUTION';
    return 'NONE';
};

const getFibLevel = (price: number, low: number, high: number): number => {
    if (high === low) return 0.5;
    return (price - low) / (high - low);
};

// --- ANALYSIS ENGINES ---

export const detectStructure = (data: CandleData[], swingLength: number = 5): StructurePoint[] => {
    const points: StructurePoint[] = [];
    const pivotHighs: {index: number, price: number}[] = [];
    const pivotLows: {index: number, price: number}[] = [];

    for (let i = swingLength; i < data.length - swingLength; i++) {
        let isHigh = true;
        let isLow = true;
        for (let j = 1; j <= swingLength; j++) {
            if (data[i].high <= data[i-j].high || data[i].high <= data[i+j].high) isHigh = false;
            if (data[i].low >= data[i-j].low || data[i].low >= data[i+j].low) isLow = false;
        }

        if (isHigh) pivotHighs.push({ index: i, price: data[i].high });
        if (isLow) pivotLows.push({ index: i, price: data[i].low });
    }

    let lastHigh = pivotHighs[0];
    let lastLow = pivotLows[0];

    const allPivots = [
        ...pivotHighs.map(p => ({...p, type: 'High'})), 
        ...pivotLows.map(p => ({...p, type: 'Low'}))
    ].sort((a,b) => a.index - b.index);

    for (const p of allPivots) {
        const candle = data[p.index];
        if (p.type === 'High') {
            if (!lastHigh) { lastHigh = p; continue; }
            if (p.price > lastHigh.price) {
                points.push({ time: candle.time, price: p.price, type: 'HH', direction: 'Bearish' });
            } else {
                points.push({ time: candle.time, price: p.price, type: 'LH', direction: 'Bearish' });
            }
            lastHigh = p;
        } else {
            if (!lastLow) { lastLow = p; continue; }
            if (p.price < lastLow.price) {
                 points.push({ time: candle.time, price: p.price, type: 'LL', direction: 'Bullish' });
            } else {
                 points.push({ time: candle.time, price: p.price, type: 'HL', direction: 'Bullish' });
            }
            lastLow = p;
        }
    }
    return points;
};

export const calculateBias = (data: CandleData[]): BiasState => {
    // Need at least 2 completed candles to check breaks
    if (data.length < 2) return { direction: 'Neutral', structure: 'Neutral', openPrice: 0, currentPrice: 0, explanation: "Insufficient Data" };
    
    // In this context:
    // current = the currently forming candle (or most recent completed if closed)
    // prev = the last fully completed candle before current
    const current = data[data.length - 1];
    const prev = data[data.length - 2]; 
    const prev2 = data.length > 2 ? data[data.length - 3] : null;

    let direction: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';
    let explanation = "Market is consolidating.";

    // 1. Break of Previous High/Low
    if (current.close > prev.high) {
        direction = 'Bullish';
        explanation = "Price has broken above the previous candle's High. Expect continuation.";
    } else if (current.close < prev.low) {
        direction = 'Bearish';
        explanation = "Price has broken below the previous candle's Low. Expect continuation.";
    } else {
        // Inside Bar Logic
        if (prev.close > prev.open) {
            direction = 'Bullish';
            explanation = "Price is inside previous Bullish range. Bias remains Bullish.";
        } else if (prev.close < prev.open) {
            direction = 'Bearish';
            explanation = "Price is inside previous Bearish range. Bias remains Bearish.";
        }
    }

    // 2. Liquidity Sweep Detection (Turtle Soup)
    // If previous candle swept a low but closed bullishly
    if (prev2) {
        // Bullish Reversal Sweep
        if (prev.low < prev2.low && prev.close > prev2.low) {
            direction = 'Bullish';
            explanation = "Liquidity Sweep of previous low detected (Stop Hunt). Reversal likely.";
        }
        // Bearish Reversal Sweep
        if (prev.high > prev2.high && prev.close < prev2.high) {
            direction = 'Bearish';
            explanation = "Liquidity Sweep of previous high detected (Stop Hunt). Reversal likely.";
        }
    }

    return {
        direction,
        structure: direction, // Simplified for UI
        openPrice: current.open,
        currentPrice: current.close,
        explanation
    };
};

// --- ADVANCED SESSION ANALYSIS (PO3) ---
const analyzeSessionContext = (data: CandleData[], startHour: number, endHour: number, prevSession?: SessionBias): SessionBias => {
    if (data.length === 0) return { direction: 'Neutral', high: 0, low: 0, status: 'PENDING', po3Phase: 'NONE', explanation: "Waiting for data.", prediction: "--" };

    const lastCandle = data[data.length - 1];
    const lastDate = new Date((lastCandle.time as number) * 1000);
    const today = lastDate.getUTCDate();
    const currentHour = lastDate.getUTCHours();

    const todayCandles = data.filter(c => {
        const d = new Date((c.time as number) * 1000);
        return d.getUTCDate() === today;
    });

    const sessionCandles = todayCandles.filter(c => {
        const h = new Date((c.time as number) * 1000).getUTCHours();
        // Handle wrap around (e.g. Asia 20-02) if needed, simplified here
        return h >= startHour && h < endHour;
    });

    if (sessionCandles.length === 0) {
        return { 
            direction: 'Neutral', high: 0, low: 0, 
            status: currentHour < startHour ? 'PENDING' : 'FINISHED',
            po3Phase: 'NONE', explanation: "Session has not started yet.", prediction: "Waiting..."
        };
    }

    const open = sessionCandles[0].open;
    const close = sessionCandles[sessionCandles.length - 1].close;
    const high = Math.max(...sessionCandles.map(c => c.high));
    const low = Math.min(...sessionCandles.map(c => c.low));
    const range = high - low;

    // Calculate Average Volatility (simple approximation from recent candles)
    const avgRange = data.slice(-50).reduce((acc, c) => acc + (c.high - c.low), 0) / 50;
    
    let status: 'ACTIVE' | 'FINISHED' = 'ACTIVE';
    if (currentHour >= endHour) status = 'FINISHED';

    const direction = close > open ? 'Bullish' : 'Bearish';
    
    // --- PO3 LOGIC ---
    let phase: PO3Phase = 'ACCUMULATION';
    let explanation = "Range is tight relative to ADR. Expect expansion.";
    let prediction = "Likely Manipulation/Stop Hunt next.";

    // 1. Detect Accumulation (Tight Range)
    if (range < avgRange * 1.2) {
        phase = 'ACCUMULATION';
        explanation = "Low volatility observed. Orders are being built up (Accumulation).";
        prediction = "Expect a Manipulation phase (Judas Swing) in the next session.";
    } 
    // 2. Detect Manipulation (Sweep previous session High/Low)
    else if (prevSession) {
        const sweptPrevHigh = high > prevSession.high;
        const sweptPrevLow = low < prevSession.low;
        
        if ((sweptPrevHigh && close < prevSession.high) || (sweptPrevLow && close > prevSession.low)) {
            phase = 'MANIPULATION';
            explanation = `Price swept previous session ${sweptPrevHigh ? 'High' : 'Low'} but failed to displace. Classic Stop Hunt.`;
            prediction = "Expect forceful Distribution in the opposite direction.";
        } else if (range > avgRange * 1.5) {
            phase = 'EXPANSION'; // or Distribution
            explanation = "High volatility expansion detected. Price is seeking liquidity.";
            prediction = "Look for continuation or a Reversal if HTF POI reached.";
        }
    } else {
        // Fallback if no prev session context
        if (range > avgRange * 1.5) {
            phase = 'EXPANSION';
            explanation = "Significant price movement away from opening price.";
            prediction = "Continuation likely.";
        }
    }

    // Special AMD Logic overrides based on Session Name
    // Usually: Asia = Acc, London = Manip, NY = Dist
    // We adjust the generic analysis with Time-based probability
    if (startHour === 0) { // Asia
        if (phase === 'EXPANSION') explanation += " (Unusual for Asia, beware of fakeout)";
        else prediction = "London often manipulates the Asia High/Low.";
    } else if (startHour === 8) { // London
        if (prevSession?.po3Phase === 'ACCUMULATION') {
            prediction = "New York typically provides the Distribution phase.";
        }
    }

    return { direction, high, low, status, po3Phase: phase, explanation, prediction };
};


export const detectFVG = (data: CandleData[]): FVG[] => {
    const fvgs: FVG[] = [];
    for (let i = 2; i < data.length; i++) {
        const c1 = data[i - 2];
        const c2 = data[i - 1];
        const c3 = data[i];
        const hour = new Date((c2.time as number) * 1000).getUTCHours();
        const isSilverBullet = (hour === 3 || hour === 10 || hour === 14);

        if (c1.high < c3.low) {
            fvgs.push({ id: `fvg-bull-${c2.time}`, time: c2.time, priceHigh: c3.low, priceLow: c1.high, direction: 'Bullish', mitigated: false, isSilverBullet });
        }
        if (c1.low > c3.high) {
            fvgs.push({ id: `fvg-bear-${c2.time}`, time: c2.time, priceHigh: c1.low, priceLow: c3.high, direction: 'Bearish', mitigated: false, isSilverBullet });
        }
    }
    
    for (let i = 0; i < fvgs.length; i++) {
        const fvg = fvgs[i];
        const futureCandles = data.filter(d => (d.time as number) > (fvg.time as number));
        for (const candle of futureCandles) {
            if (fvg.direction === 'Bullish' && candle.low < fvg.priceLow) { fvg.mitigated = true; break; }
            if (fvg.direction === 'Bearish' && candle.high > fvg.priceHigh) { fvg.mitigated = true; break; }
        }
    }
    return fvgs.filter(f => !f.mitigated);
};

export const detectOrderBlocks = (data: CandleData[], thresholdMult: number): OrderBlock[] => {
    const obs: OrderBlock[] = [];
    const bodySizes = data.slice(-100).map(d => Math.abs(d.close - d.open));
    const meanBody = bodySizes.reduce((a, b) => a + b, 0) / bodySizes.length || 1;
    const IMPULSE_THRESHOLD = meanBody * thresholdMult; 

    for (let i = 2; i < data.length - 3; i++) {
        const candle = data[i];
        const nextCandle = data[i+1];
        const moveUp = (nextCandle.close - nextCandle.open) > IMPULSE_THRESHOLD;
        const moveDown = (nextCandle.open - nextCandle.close) > IMPULSE_THRESHOLD;

        if (candle.close < candle.open && moveUp && nextCandle.close > candle.high) {
            obs.push({ id: `ob-bull-${candle.time}`, time: candle.time, priceHigh: candle.high, priceLow: candle.low, direction: 'Bullish', mitigated: false, subtype: 'Standard' });
        }
        if (candle.close > candle.open && moveDown && nextCandle.close < candle.low) {
            obs.push({ id: `ob-bear-${candle.time}`, time: candle.time, priceHigh: candle.high, priceLow: candle.low, direction: 'Bearish', mitigated: false, subtype: 'Standard' });
        }
    }

    for (let i = 0; i < obs.length; i++) {
        const ob = obs[i];
        const startIndex = data.findIndex(d => d.time === ob.time);
        if (startIndex === -1) continue;
        for (let k = startIndex + 1; k < data.length; k++) {
            const current = data[k];
            if (ob.subtype === 'Standard') {
                if (ob.direction === 'Bullish' && current.close < ob.priceLow) { ob.subtype = 'Breaker'; ob.direction = 'Bearish'; } 
                else if (ob.direction === 'Bearish' && current.close > ob.priceHigh) { ob.subtype = 'Breaker'; ob.direction = 'Bullish'; }
            } else if (ob.subtype === 'Breaker') {
                if (ob.direction === 'Bullish' && current.close < ob.priceLow) ob.mitigated = true;
                else if (ob.direction === 'Bearish' && current.close > ob.priceHigh) ob.mitigated = true;
            }
        }
    }
    return obs.filter(o => !o.mitigated).slice(-10);
};

// --- TOP DOWN ANALYSIS ENGINE ---
export const detectEntries = (
    data: CandleData[], 
    obs: OrderBlock[], 
    fvgs: FVG[], 
    structure: StructurePoint[],
    timeframe: string,
    biasMatrix?: BiasMatrix
): { signals: EntrySignal[], matrix: BiasMatrix } => {
    const signals: EntrySignal[] = [];
    let lastSignalTime = 0;
    const COOLDOWN = 15 * 60;
    const isScalping = ['1m', '3m', '5m'].includes(timeframe);

    const recentHighs = structure.filter(s => ['HH', 'LH', 'PH'].includes(s.type));
    const recentLows = structure.filter(s => ['LL', 'HL', 'PL'].includes(s.type));

    // --- ENHANCED SESSION ANALYSIS ---
    // Pass previous session data to help determine Manipulation (sweeps)
    const asiaBias = analyzeSessionContext(data, 0, 8);
    const londonBias = analyzeSessionContext(data, 8, 16, asiaBias);
    const nyBias = analyzeSessionContext(data, 13, 21, londonBias);

    // Update the matrix
    let updatedMatrix: BiasMatrix | undefined = biasMatrix;
    if (updatedMatrix) {
        updatedMatrix.sessionBiases = {
            ASIA: asiaBias,
            LONDON: londonBias,
            NEW_YORK: nyBias
        };
    }

    for (let i = 100; i < data.length; i++) {
        const candle = data[i];
        const hour = new Date((candle.time as number) * 1000).getUTCHours();
        const session = getSession(hour);
        
        const rangeLookback = 50;
        const rangeData = data.slice(i - rangeLookback, i);
        const rangeHigh = Math.max(...rangeData.map(c => c.high));
        const rangeLow = Math.min(...rangeData.map(c => c.low));
        const fibLevel = getFibLevel(candle.close, rangeLow, rangeHigh);
        const inDiscount = fibLevel < 0.5;
        const inPremium = fibLevel > 0.5;

        let score = 0;
        const confluences: string[] = [];
        let setupName: ICTSetupType = 'Standard FVG';
        let direction: 'LONG' | 'SHORT' | null = null;
        let sweptLevel: { price: number, time: UTCTimestamp, type: 'BSL' | 'SSL' } | undefined = undefined;
        let confluenceLevel: number | undefined = undefined;

        const touchingBullOB = obs.find(ob => ob.direction === 'Bullish' && !ob.mitigated && candle.low <= ob.priceHigh && (ob.time as number) < (candle.time as number));
        const touchingBearOB = obs.find(ob => ob.direction === 'Bearish' && !ob.mitigated && candle.high >= ob.priceLow && (ob.time as number) < (candle.time as number));
        const touchingBullFVG = fvgs.find(f => f.direction === 'Bullish' && candle.low <= f.priceHigh && (f.time as number) < (candle.time as number));
        const touchingBearFVG = fvgs.find(f => f.direction === 'Bearish' && candle.high >= f.priceLow && (f.time as number) < (candle.time as number));

        let biasScore = 0;
        let po3Context: PO3Phase = 'NONE';
        
        if (biasMatrix) {
            po3Context = determinePO3(candle, session, biasMatrix.daily.openPrice, biasMatrix.daily.direction);
            
            if (biasMatrix.daily.direction === 'Bullish' || biasMatrix.weekly.direction === 'Bullish') {
                if (po3Context === 'MANIPULATION') biasScore += 3; 
                if (po3Context === 'DISTRIBUTION') biasScore -= 2;
                biasScore += 1;
            } else {
                biasScore -= 2;
            }
        } else {
             po3Context = determinePO3(candle, session, data[i-20].open, 'Neutral'); 
        }

        // --- LONG ---
        if (touchingBullOB || touchingBullFVG) {
            if (inDiscount || isScalping) {
                direction = 'LONG';
                if (biasMatrix && biasMatrix.daily.direction === 'Bearish' && biasMatrix.weekly.direction === 'Bearish') {
                    if (fibLevel > 0.2) direction = null; 
                }
                
                if (direction) {
                    score += 2;
                    score += biasScore;
                    if (session !== 'NONE') score += 1;
                    
                    const rangeCandles = rangeData.slice(-30);
                    let foundSweep = false;
                    for(let cIdx = rangeCandles.length - 1; cIdx >= 0; cIdx--) {
                        const rangeC = rangeCandles[cIdx];
                        const sweptLow = recentLows.find(l => (l.time as number) < (rangeC.time as number) && rangeC.low < l.price && (rangeC.time as number) - (l.time as number) < 3600 * 4);
                        if (sweptLow) { foundSweep = true; sweptLevel = { price: sweptLow.price, time: sweptLow.time, type: 'SSL' }; break; }
                    }
                    if (foundSweep) {
                        setupName = '2022 Model';
                        score += 3;
                        confluences.push('SSL Swept');
                    }
                    if (touchingBullOB?.subtype === 'Breaker') {
                        setupName = 'Unicorn';
                        score += 3;
                        confluences.push('Breaker Block');
                    }
                    const isSBTime = (hour === 3 || hour === 10 || hour === 14);
                    if (isSBTime && touchingBullFVG?.isSilverBullet) {
                        setupName = 'Silver Bullet';
                        score += 4;
                    }
                    if (touchingBullFVG) confluenceLevel = touchingBullFVG.priceHigh;
                    if (touchingBullOB && !confluenceLevel) confluenceLevel = touchingBullOB.priceHigh;
                    if (po3Context === 'MANIPULATION') confluences.push('Accumulation/Manip Phase');
                }
            }
        }
        // --- SHORT ---
        else if (touchingBearOB || touchingBearFVG) {
            if (inPremium || isScalping) {
                direction = 'SHORT';
                if (biasMatrix && biasMatrix.daily.direction === 'Bullish' && biasMatrix.weekly.direction === 'Bullish') {
                     if (fibLevel < 0.8) direction = null;
                }
                
                if (direction) {
                    score += 2;
                    let shortBiasScore = 0;
                    if (biasMatrix) {
                        if (biasMatrix.daily.direction === 'Bearish') {
                            if (po3Context === 'MANIPULATION') shortBiasScore += 3;
                            shortBiasScore += 1;
                        } else {
                            shortBiasScore -= 2;
                        }
                    }
                    score += shortBiasScore;
                    if (session !== 'NONE') score += 1;

                    const rangeCandles = rangeData.slice(-30);
                    let foundSweep = false;
                    for(let cIdx = rangeCandles.length - 1; cIdx >= 0; cIdx--) {
                        const rangeC = rangeCandles[cIdx];
                        const sweptHigh = recentHighs.find(h => (h.time as number) < (rangeC.time as number) && rangeC.high > h.price && (rangeC.time as number) - (h.time as number) < 3600 * 4);
                        if (sweptHigh) { foundSweep = true; sweptLevel = { price: sweptHigh.price, time: sweptHigh.time, type: 'BSL' }; break; }
                    }
                    if (foundSweep) {
                        setupName = '2022 Model';
                        score += 3;
                        confluences.push('BSL Swept');
                    }
                    if (touchingBearOB?.subtype === 'Breaker') {
                        setupName = 'Unicorn';
                        score += 3;
                        confluences.push('Breaker Block');
                    }
                    const isSBTime = (hour === 3 || hour === 10 || hour === 14);
                    if (isSBTime && touchingBearFVG?.isSilverBullet) {
                        setupName = 'Silver Bullet';
                        score += 4;
                    }
                    
                    if (touchingBearFVG) confluenceLevel = touchingBearFVG.priceLow;
                    if (touchingBearOB && !confluenceLevel) confluenceLevel = touchingBearOB.priceLow;
                    if (po3Context === 'MANIPULATION') confluences.push('Distribution/Manip Phase');
                }
            }
        }

        if (direction && score >= 4 && ((candle.time as number) - lastSignalTime > COOLDOWN)) {
             let grade = 'B';
             if (score >= 8) grade = 'A++';
             else if (score >= 6) grade = 'A+';

             if (biasMatrix) {
                 const isAligned = (direction === 'LONG' && biasMatrix.daily.direction === 'Bullish') || (direction === 'SHORT' && biasMatrix.daily.direction === 'Bearish');
                 if (isAligned && grade === 'B') grade = 'A+'; 
             }

             const swingLow = Math.min(...data.slice(i-5, i+1).map(c => c.low));
             const swingHigh = Math.max(...data.slice(i-5, i+1).map(c => c.high));

             let sl = direction === 'LONG' ? Math.min(swingLow, touchingBullOB?.priceLow || swingLow) : Math.max(swingHigh, touchingBearOB?.priceHigh || swingHigh);
             sl = direction === 'LONG' ? sl - (candle.close * 0.0005) : sl + (candle.close * 0.0005);
             
             const risk = Math.abs(candle.close - sl);
             const tp = direction === 'LONG' ? candle.close + (risk * 2) : candle.close - (risk * 2);

             signals.push({
                time: candle.time, 
                type: direction, 
                price: candle.close, 
                score, 
                confluences, 
                sl, 
                tp,
                winProbability: Math.min(99, score * 10 + 20),
                tradingStyle: isScalping ? 'SCALP' : 'DAY_TRADE',
                po3Phase: po3Context,
                setupName,
                setupGrade: grade,
                confluenceLevel,
                timeframe,
                sweptLevel
             });
             lastSignalTime = candle.time as number;
        }
    }
    
    const finalMatrix: BiasMatrix = updatedMatrix || {
        monthly: { direction: 'Neutral', structure: 'Neutral', openPrice: 0, currentPrice: 0 },
        weekly: { direction: 'Neutral', structure: 'Neutral', openPrice: 0, currentPrice: 0 },
        daily: { direction: 'Neutral', structure: 'Neutral', openPrice: 0, currentPrice: 0 },
        session: 'NONE',
        po3State: 'NONE',
        sessionBiases: {
            ASIA: { direction: 'Neutral', high: 0, low: 0, status: 'PENDING', po3Phase: 'NONE', explanation: '', prediction: '' },
            LONDON: { direction: 'Neutral', high: 0, low: 0, status: 'PENDING', po3Phase: 'NONE', explanation: '', prediction: '' },
            NEW_YORK: { direction: 'Neutral', high: 0, low: 0, status: 'PENDING', po3Phase: 'NONE', explanation: '', prediction: '' }
        }
    };

    return { signals, matrix: finalMatrix };
};
