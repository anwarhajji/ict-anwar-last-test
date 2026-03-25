
import { CandleData, UTCTimestamp } from "../types";

export const getHtf = (tf: string) => {
    if (['1m','3m'].includes(tf)) return '15m'; // Scalping context
    if (['5m'].includes(tf)) return '1h';
    if (['15m','30m'].includes(tf)) return '4h';
    if (['1h','4h'].includes(tf)) return '1d';
    return '1d';
};

export const fetchCandles = async (asset: string, timeframe: string, limit: number = 1500): Promise<CandleData[]> => {
    const symbolMap: { [key: string]: string } = {
        'NQ (CME)': 'BTCUSDT', // Proxy for Nasdaq
        'ES (CME)': 'ETHUSDT', // Proxy for S&P
        'MGC (COMEX)': 'PAXGUSDT',
        'XAUUSD': 'PAXGUSDT',
        'GOLD': 'PAXGUSDT',
        'XAUUSD.P': 'PAXGUSDT'
    };
    
    let symbol = symbolMap[asset] || asset.replace('/', '').replace(' ', '');
    if (asset.includes('MGC')) symbol = 'PAXGUSDT';

    try {
        const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${timeframe}&limit=${limit}`);
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            if (errorData.code === -1121) {
                console.warn(`Symbol ${symbol} not found on Binance. Returning empty data.`);
            } else {
                console.warn(`Binance API error for ${symbol}:`, errorData);
            }
            return [];
        }
        const raw = await res.json();
        
        if (!Array.isArray(raw)) {
            console.warn(`Invalid response format from Binance for ${symbol}:`, raw);
            return [];
        }

        return raw.map((c: any) => ({ 
            time: c[0] / 1000 as UTCTimestamp, 
            open: parseFloat(c[1]), 
            high: parseFloat(c[2]), 
            low: parseFloat(c[3]), 
            close: parseFloat(c[4]) 
        }));
    } catch (error) {
        // Only log actual network errors, not 404s which we handle above
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            console.error(`Network error fetching candles for ${symbol}. Check your connection.`);
        } else {
            console.error(`Unexpected error fetching candles for ${symbol}:`, error);
        }
        return [];
    }
};
