
import { CandleData, EntrySignal, FVG, OrderBlock, SessionType, StructurePoint, ICTSetupType, UTCTimestamp } from '../types';

// --- UTILS ---
export const getSession = (hour: number): SessionType => {
    if (hour >= 0 && hour < 8) return 'ASIA';
    if (hour >= 7 && hour < 16) return 'LONDON';
    if (hour >= 12 && hour < 21) return 'NEW_YORK';
    return 'NONE';
};

export const determinePO3 = (candle: CandleData, session: SessionType): 'ACCUMULATION' | 'MANIPULATION' | 'DISTRIBUTION' | 'NONE' => {
    if (session === 'ASIA') return 'ACCUMULATION';
    if (session === 'LONDON' || session === 'NEW_YORK') {
        const body = Math.abs(candle.close - candle.open);
        const range = candle.high - candle.low;
        if (body > range * 0.6) return 'DISTRIBUTION';
        return 'MANIPULATION';
    }
    return 'NONE';
};

const getFibLevel = (price: number, low: number, high: number): number => {
    if (high === low) return 0.5;
    return (price - low) / (high - low);
};

// --- ALGORITHMS ---

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

export const detectFVG = (data: CandleData[]): FVG[] => {
    const fvgs: FVG[] = [];
    for (let i = 2; i < data.length; i++) {
        const c1 = data[i - 2];
        const c2 = data[i - 1];
        const c3 = data[i];
        const hour = new Date((c2.time as number) * 1000).getUTCHours();
        // Silver Bullet Windows (UTC): 3-4 (London), 10-11 (NY AM), 14-15 (NY PM)
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

export const detectEntries = (
    data: CandleData[], 
    obs: OrderBlock[], 
    fvgs: FVG[], 
    structure: StructurePoint[],
    timeframe: string,
    htfBias: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral'
): EntrySignal[] => {
    const signals: EntrySignal[] = [];
    let lastSignalTime = 0;
    const COOLDOWN = 15 * 60; // 15 mins cooldown
    const isScalping = ['1m', '3m', '5m'].includes(timeframe);

    // Filter structure for recent Swing Points
    const recentHighs = structure.filter(s => ['HH', 'LH', 'PH'].includes(s.type));
    const recentLows = structure.filter(s => ['LL', 'HL', 'PL'].includes(s.type));

    for (let i = 100; i < data.length; i++) {
        const candle = data[i];
        
        // 1. DETERMINE DEALING RANGE (Last 50 candles approx) & FIBONACCI
        const rangeLookback = 50;
        const rangeData = data.slice(i - rangeLookback, i);
        const rangeHigh = Math.max(...rangeData.map(c => c.high));
        const rangeLow = Math.min(...rangeData.map(c => c.low));
        const fibLevel = getFibLevel(candle.close, rangeLow, rangeHigh);
        
        // Discount < 0.5 (Buy Zone), Premium > 0.5 (Sell Zone)
        const inDiscount = fibLevel < 0.5;
        const inPremium = fibLevel > 0.5;
        const inOTE = (fibLevel >= 0.62 && fibLevel <= 0.79) || (fibLevel <= 0.38 && fibLevel >= 0.21); // OTE Zones

        let score = 0;
        const confluences: string[] = [];
        let confluenceLevel: number | undefined = undefined;
        let setupName: ICTSetupType = 'Standard FVG';
        let direction: 'LONG' | 'SHORT' | null = null;
        let sweptLevel: { price: number, time: UTCTimestamp, type: 'BSL' | 'SSL' } | undefined = undefined;

        // --- CONTEXT CHECKS ---
        const hour = new Date((candle.time as number) * 1000).getUTCHours();
        const session = getSession(hour);
        const isSBTime = (hour === 3 || hour === 10 || hour === 14); // Silver Bullet Hours

        // 2. IDENTIFY POI INTERACTIONS
        const touchingBullOB = obs.find(ob => ob.direction === 'Bullish' && !ob.mitigated && candle.low <= ob.priceHigh && candle.low >= ob.priceLow && (ob.time as number) < (candle.time as number));
        const touchingBearOB = obs.find(ob => ob.direction === 'Bearish' && !ob.mitigated && candle.high >= ob.priceLow && candle.high <= ob.priceHigh && (ob.time as number) < (candle.time as number));
        
        const touchingBullFVG = fvgs.find(f => f.direction === 'Bullish' && candle.low <= f.priceHigh && candle.low >= f.priceLow && (f.time as number) < (candle.time as number));
        const touchingBearFVG = fvgs.find(f => f.direction === 'Bearish' && candle.high >= f.priceLow && candle.high <= f.priceHigh && (f.time as number) < (candle.time as number));

        // 3. LOGIC FOR LONG
        if (inDiscount && (touchingBullOB || touchingBullFVG)) {
            direction = 'LONG';
            score += 2; // Base for POI
            if (htfBias === 'Bullish') score += 2;
            if (session !== 'NONE') score += 1;
            
            // Check for Liquidity Sweep (Turtle Soup / 2022 Model)
            // Look for a specific Low in recent history that was breached by price within the lookback window
            const rangeCandles = rangeData.slice(-25); // Look closer for the sweep event
            let foundSweep = false;
            
            // Find a swing low that is older than the current range candles, but was swept by one of them
            // Iterating backwards to find the most relevant recent sweep
            for(let cIdx = rangeCandles.length - 1; cIdx >= 0; cIdx--) {
                const rangeC = rangeCandles[cIdx];
                const sweptLow = recentLows.find(l => (l.time as number) < (rangeC.time as number) && rangeC.low < l.price && (rangeC.time as number) - (l.time as number) < 3600 * 4); // Within last 4 hours
                
                if (sweptLow) {
                    foundSweep = true;
                    sweptLevel = { price: sweptLow.price, time: sweptLow.time, type: 'SSL' };
                    break;
                }
            }
            
            if (foundSweep) {
                setupName = '2022 Model';
                score += 3;
                confluences.push('SSL Swept');
            }

            if (touchingBullOB?.subtype === 'Breaker') {
                setupName = 'Unicorn'; // Breaker + FVG typically implies unicorn if FVG present
                score += 3;
                confluences.push('Breaker Block');
            }

            if (isSBTime && touchingBullFVG?.isSilverBullet) {
                setupName = 'Silver Bullet';
                score += 4;
            }

            if (inOTE) {
                confluences.push('OTE Fib');
                score += 1;
                if(setupName === 'Standard FVG') setupName = 'OTE';
            }

            if (touchingBullFVG) {
                confluences.push('Discount FVG');
                confluenceLevel = touchingBullFVG.priceHigh;
            }
            if (touchingBullOB) {
                confluences.push('Bullish OB');
                if(!confluenceLevel) confluenceLevel = touchingBullOB.priceHigh;
            }
        }

        // 4. LOGIC FOR SHORT
        else if (inPremium && (touchingBearOB || touchingBearFVG)) {
            direction = 'SHORT';
            score += 2;
            if (htfBias === 'Bearish') score += 2;
            if (session !== 'NONE') score += 1;

            // Liquidity Sweep Check
            const rangeCandles = rangeData.slice(-25);
            let foundSweep = false;
            
            for(let cIdx = rangeCandles.length - 1; cIdx >= 0; cIdx--) {
                const rangeC = rangeCandles[cIdx];
                const sweptHigh = recentHighs.find(h => (h.time as number) < (rangeC.time as number) && rangeC.high > h.price && (rangeC.time as number) - (h.time as number) < 3600 * 4);
                
                if (sweptHigh) {
                    foundSweep = true;
                    sweptLevel = { price: sweptHigh.price, time: sweptHigh.time, type: 'BSL' };
                    break;
                }
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

            if (isSBTime && touchingBearFVG?.isSilverBullet) {
                setupName = 'Silver Bullet';
                score += 4;
            }

            if (inOTE) {
                confluences.push('OTE Fib');
                score += 1;
                if(setupName === 'Standard FVG') setupName = 'OTE';
            }

            if (touchingBearFVG) {
                confluences.push('Premium FVG');
                confluenceLevel = touchingBearFVG.priceLow;
            }
            if (touchingBearOB) {
                confluences.push('Bearish OB');
                if(!confluenceLevel) confluenceLevel = touchingBearOB.priceLow;
            }
        }

        // 5. GENERATE SIGNAL
        if (direction && score >= 4 && ((candle.time as number) - lastSignalTime > COOLDOWN)) {
             const setupGrade = score >= 8 ? 'A++' : score >= 6 ? 'A+' : 'B';
             const isLong = direction === 'LONG';
             
             // Dynamic SL/TP based on Structure
             const swingLow = Math.min(...data.slice(i-5, i+1).map(c => c.low));
             const swingHigh = Math.max(...data.slice(i-5, i+1).map(c => c.high));

             let sl = isLong ? Math.min(swingLow, touchingBullOB?.priceLow || swingLow) : Math.max(swingHigh, touchingBearOB?.priceHigh || swingHigh);
             // Add buffer
             sl = isLong ? sl - (candle.close * 0.0005) : sl + (candle.close * 0.0005);
             
             const risk = Math.abs(candle.close - sl);
             const tp = isLong ? candle.close + (risk * 2) : candle.close - (risk * 2);

             signals.push({
                time: candle.time, 
                type: direction, 
                price: candle.close, 
                score, 
                confluences, 
                sl, 
                tp,
                winProbability: Math.min(98, score * 10 + 20),
                tradingStyle: isScalping ? 'SCALP' : 'DAY_TRADE',
                po3Phase: determinePO3(candle, session),
                setupName,
                setupGrade,
                confluenceLevel,
                timeframe,
                sweptLevel // Pass the detected liquidity level
             });
             lastSignalTime = candle.time as number;
        }
    }
    return signals;
};
