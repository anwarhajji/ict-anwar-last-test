
import { UTCTimestamp } from 'lightweight-charts';

export type { UTCTimestamp };

export type SessionType = 'ASIA' | 'LONDON' | 'NEW_YORK' | 'NONE';
export type ICTSetupType = '2022 Model' | 'Silver Bullet' | 'Unicorn' | 'OTE' | 'Breaker' | 'Standard FVG' | '8 AM Hour';
export type PO3Phase = 'ACCUMULATION' | 'MANIPULATION' | 'DISTRIBUTION' | 'EXPANSION' | 'REVERSAL' | 'NONE';

export interface CandleData {
    time: UTCTimestamp;
    open: number;
    high: number;
    low: number;
    close: number;
    color?: string;
    borderColor?: string;
    wickColor?: string;
}

export interface StructurePoint {
    time: UTCTimestamp;
    price: number;
    type: 'PH' | 'PL' | 'BOS' | 'CHoCH' | 'HH' | 'HL' | 'LH' | 'LL';
    direction: 'Bullish' | 'Bearish';
}

export interface FVG {
    id: string;
    time: UTCTimestamp;
    priceHigh: number;
    priceLow: number;
    direction: 'Bullish' | 'Bearish';
    mitigated: boolean;
    isSilverBullet: boolean;
    timeframe?: string;
}

export interface OrderBlock {
    id: string;
    time: UTCTimestamp;
    priceHigh: number;
    priceLow: number;
    direction: 'Bullish' | 'Bearish';
    mitigated: boolean;
    subtype: 'Standard' | 'Breaker' | 'Swing';
    timeframe?: string;
}

export interface TradeEntry {
    id: string;
    time: UTCTimestamp;
    type: 'LONG' | 'SHORT';
    price: number;
    stopLoss: number;
    takeProfit: number;
    lotSize: number;
    result?: 'WIN' | 'LOSS' | 'OPEN';
    pnl?: number;
    confluences: string[];
    score: number;
    asset?: string; // Added for robust filtering
    // Phase 1 Additions
    notes?: string;
    emotions?: string[];
    tags?: string[];
    screenshots?: string[];
    mistakes?: string[];
    strategy?: string;
    algoSignal?: string;
    timeframe?: string;
}

export interface DraftTrade {
    type: 'LONG' | 'SHORT';
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    lotSize: number;
}

export interface EntrySignal {
    time: UTCTimestamp;
    type: 'LONG' | 'SHORT';
    price: number;
    score: number;
    confluences: string[];
    asset?: string; // Added for robust filtering
    sl: number;
    tp: number;
    winProbability: number;
    tradingStyle: 'SCALP' | 'DAY_TRADE';
    po3Phase: PO3Phase;
    backtestResult?: 'WIN' | 'LOSS' | 'PENDING';
    backtestPnL?: number;
    lotSize?: number;
    exitTime?: UTCTimestamp;
    setupName: ICTSetupType | string;
    setupGrade?: string;
    confluenceLevel?: number; 
    timeframe?: string;
    sweptLevel?: {
        price: number;
        time: UTCTimestamp;
        type: 'BSL' | 'SSL';
    };
}

export interface BacktestStats {
    totalTrades: number;
    wins: number;
    losses: number;
    winRate: number;
    netPnL: number;
    profitFactor: number;
    maxDrawdown: number;
    equityCurve: number[];
}

export interface AppConfig {
    swingLength: number;
    obThreshold: number;
    fvgExtend: number;
}

export interface OverlayState {
    obs: boolean;
    fvgs: boolean;
    killzones: boolean;
    silverBullet: boolean;
    pdZones: boolean;
    internalStructure: boolean;
    swingStructure: boolean;
    mtf: boolean;
    backtestMarkers: boolean;
    macro: boolean;
    historicalTradeLines: boolean;
    setupFilters: {
        [key in ICTSetupType]: boolean;
    };
}

export interface ColorTheme {
    obBull: string;
    obBear: string;
    fvgBull: string;
    fvgBear: string;
}

export interface SimulationConfig {
    minWinProbability: number;
    allowedGrades: Record<string, boolean>;
}

export interface BiasState {
    direction: 'Bullish' | 'Bearish' | 'Neutral';
    structure: 'Bullish' | 'Bearish' | 'Neutral';
    openPrice: number;
    currentPrice: number;
    explanation?: string;
}

export interface SessionBias {
    direction: 'Bullish' | 'Bearish' | 'Neutral';
    high: number;
    low: number;
    status: 'PENDING' | 'ACTIVE' | 'FINISHED';
    po3Phase: PO3Phase;
    explanation: string;
    prediction: string;
}

export interface BiasMatrix {
    monthly: BiasState;
    weekly: BiasState;
    daily: BiasState;
    session: SessionType;
    po3State: PO3Phase;
    sessionBiases: {
        ASIA: SessionBias;
        LONDON: SessionBias;
        NEW_YORK: SessionBias;
    };
}

// Phase 1 Additions
export interface DailyTask {
    id: string;
    title: string;
    completed: boolean;
    category: 'PRE_MARKET' | 'POST_MARKET' | 'REVIEW';
    date: string; // YYYY-MM-DD
}

export interface NewsEvent {
    id: string;
    title: string;
    time: string; // ISO string or timestamp
    currency: string;
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
    actual?: string;
    forecast?: string;
    previous?: string;
    betterIs?: 'Higher' | 'Lower' | 'Neutral';
}

// Phase 2 Additions
export interface BrokerConnection {
    id: string;
    brokerName: string;
    accountName: string;
    status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
    lastSync?: string;
}

// Phase 3 Additions
export interface Strategy {
    id: string;
    name: string;
    description: string;
    versions: StrategyVersion[];
    createdAt: string;
    allowedTimeframes?: string[];
}

export interface StrategyVersion {
    id: string;
    versionNumber: number;
    rules: string[];
    winRate?: number;
    totalTrades?: number;
    profitFactor?: number;
    createdAt: string;
}

export interface BacktestSession {
    id: string;
    strategyId: string;
    versionId: string;
    asset: string;
    startDate: string;
    endDate: string;
    startingBalance: number;
    endingBalance: number;
    trades: TradeEntry[];
    createdAt: string;
}

export interface UserFeatures {
    bots: boolean;
    backtesting: boolean;
    news: boolean;
    tasks: boolean;
    analytics: boolean;
}

export interface BotSettings {
    startingBalance: number;
    maxBots: number;
}

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    firstName?: string;
    lastName?: string;
    role: 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
    workspaceId: string;
    plan: 'FREE' | 'PRO' | 'ELITE';
    createdAt: string;
    lastLogin: string;
    features?: UserFeatures;
    botSettings?: BotSettings;
}

// Phase 4 Additions
export interface Bot {
    id: string;
    name: string;
    status: 'ACTIVE' | 'PAUSED' | 'ERROR';
    strategy: string;
    strategyCode?: string;
    asset: string;
    positionSize: number;
    totalProfit: number;
    winRate: number;
    lastActive: string;
    currentPosition?: { type: 'BUY' | 'SELL', entryPrice: number, size: number };
    tradesCount?: number;
    winsCount?: number;
    history?: number[];
    allowedTimeframes?: string[];
}

export interface RiskSettings {
    dailyLossLimit: number;
    maxDrawdown: number;
    maxTradesPerDay: number;
    consecutiveLossesLimit: number;
    lockoutActive: boolean;
    lockoutReason?: string;
    lockoutUntil?: string;
}
