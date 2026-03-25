
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CandleData, OrderBlock, FVG, StructurePoint, EntrySignal, BacktestStats, TradeEntry, UTCTimestamp, SimulationConfig, ICTSetupType, OverlayState, DraftTrade, BiasMatrix, BiasState, UserProfile } from './types';
import { fetchCandles, getHtf } from './services/api';
import { detectStructure, detectOrderBlocks, detectFVG, detectEntries, calculateBias, getSession } from './services/ict';
import { performBacktest } from './services/backtest';
import { ChartComponent } from './components/Chart';
import { EntryDetailModal, TopSetupsModal, ToastNotification, ErrorBoundary } from './components/Modals';
import { Panels } from './components/Panels';
import { DashboardPanel } from './components/panels/DashboardPanel';
import { StatsPanel } from './components/panels/StatsPanel';
import { SetupsPanel } from './components/panels/SetupsPanel';
import { ScannerPanel } from './components/panels/ScannerPanel';
import { JournalPanel } from './components/panels/JournalPanel';
import { TasksPanel } from './components/panels/TasksPanel';
import { NewsPanel } from './components/panels/NewsPanel';
import { BrokerPanel } from './components/panels/BrokerPanel';
import { BacktestPanel } from './components/panels/BacktestPanel';
import { ProfilePanel } from './components/panels/ProfilePanel';
import { AdminPanel } from './components/panels/AdminPanel';
import { BotsPanel } from './components/panels/BotsPanel';
import { RiskPanel } from './components/panels/RiskPanel';
import { auth, loginWithGoogle, logout } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

// Icons
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const ChartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>;
const ListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const TradeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
const StatsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>;
const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
const BacktestIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 2v6h6M2.66 15.57a10 10 0 1 0 .57-8.38"/></svg>;
const SetupsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>;
const JournalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>;
const TasksIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>;
const NewsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16"></path><path d="M15 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16"></path><path d="M3 21h18"></path><rect x="7" y="7" width="10" height="2"></rect><rect x="7" y="11" width="10" height="2"></rect><rect x="7" y="15" width="10" height="2"></rect></svg>;
const BrokerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11M8 14v3m4-3v3m4-3v3"/></svg>;
const ProfileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const AdminIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;
const BotsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8" y2="16"></line><line x1="16" y1="16" x2="16" y2="16"></line></svg>;
const RiskIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>;

// Helper Component for Sidebar Items
const SidebarItem = ({ 
    active, 
    onClick, 
    icon, 
    label 
}: { 
    active: boolean; 
    onClick: () => void; 
    icon: React.ReactNode; 
    label: string 
}) => (
    <button 
        onClick={onClick} 
        className={`group relative w-full p-3 flex flex-col items-center gap-1 transition-colors ${active ? 'text-blue-500 bg-gray-800/50 border-r-2 border-blue-500' : 'text-gray-500 hover:text-white hover:bg-gray-800/30'}`}
    >
        {icon}
        {/* Tooltip */}
        <span className="absolute left-16 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl border border-gray-700">
            {label}
        </span>
    </button>
);

const App: React.FC = () => {
    // --- AUTH STATE ---
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                try {
                    const { doc, getDoc, setDoc } = await import('firebase/firestore');
                    const { db, handleFirestoreError, OperationType } = await import('./firebase');
                    const userRef = doc(db, `users/${currentUser.uid}`);
                    const userSnap = await getDoc(userRef);
                    
                    const superAdminEmail = import.meta.env.VITE_SUPER_ADMIN_EMAIL || 'anwar.hajji@gmail.com';
                    const isSuperAdmin = currentUser.email === superAdminEmail;

                    if (userSnap.exists()) {
                        const data = userSnap.data() as UserProfile;
                        if (isSuperAdmin && data.role !== 'SUPER_ADMIN') {
                            data.role = 'SUPER_ADMIN';
                            await setDoc(userRef, { role: 'SUPER_ADMIN' }, { merge: true });
                        }
                        setUserProfile(data);
                    } else {
                        // Create default profile
                        const defaultProfile: UserProfile = {
                            uid: currentUser.uid,
                            email: currentUser.email || '',
                            displayName: currentUser.displayName || '',
                            role: isSuperAdmin ? 'SUPER_ADMIN' : 'MEMBER',
                            workspaceId: 'default',
                            plan: 'FREE',
                            createdAt: new Date().toISOString(),
                            lastLogin: new Date().toISOString(),
                            features: {
                                bots: false,
                                backtesting: true,
                                news: true,
                                tasks: true,
                                analytics: true
                            }
                        };
                        await setDoc(userRef, defaultProfile, { merge: true });
                        setUserProfile(defaultProfile);
                    }
                } catch (e) {
                    console.error("Failed to fetch user profile", e);
                }
            } else {
                setUserProfile(null);
            }
            setIsAuthReady(true);
        });
        return () => unsubscribe();
    }, []);

    const handleLogin = async () => {
        if (isLoggingIn) return;
        setIsLoggingIn(true);
        setLoginError(null);
        try {
            await loginWithGoogle();
        } catch (error: any) {
            if (error?.code === 'auth/cancelled-popup-request' || error?.code === 'auth/popup-closed-by-user') {
                setLoginError('Sign-in popup was closed. Please try again.');
            } else {
                setLoginError(error?.message || 'Failed to sign in.');
            }
        } finally {
            setIsLoggingIn(false);
        }
    };

    // --- STATE ---
    const [data, setData] = useState<CandleData[]>([]);
    const [obs, setObs] = useState<OrderBlock[]>([]);
    const [fvgs, setFvgs] = useState<FVG[]>([]);
    const [structure, setStructure] = useState<StructurePoint[]>([]);
    const [entries, setEntries] = useState<EntrySignal[]>([]);
    const [htfObs, setHtfObs] = useState<OrderBlock[]>([]);
    const [htfFvgs, setHtfFvgs] = useState<FVG[]>([]);
    const [pdRange, setPdRange] = useState<{high: number, low: number} | null>(null);
    const [backtestStats, setBacktestStats] = useState<BacktestStats | null>(null);
    
    // BIAS & CONTEXT STATE
    const [biasMatrix, setBiasMatrix] = useState<BiasMatrix | undefined>(undefined);

    // UI State
    const [activeTab, setActiveTab] = useState('DASHBOARD');
    const [settingsTab, setSettingsTab] = useState('VISIBILITY'); 
    const [asset, setAsset] = useState('MGC (COMEX)');
    const [timeframe, setTimeframe] = useState('15m');
    const [showTopSetups, setShowTopSetups] = useState(false);
    const [clickedEntry, setClickedEntry] = useState<EntrySignal | null>(null);
    const [hoveredEntry, setHoveredEntry] = useState<EntrySignal | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Replay State
    const [replayMode, setReplayMode] = useState({ active: false, index: 0, playing: false, speed: 500 });
    const [replayDateInput, setReplayDateInput] = useState('');
    const dateInputRef = useRef<HTMLInputElement>(null);
    const [replaySetupFilters, setReplaySetupFilters] = useState<Record<string, boolean>>({
        '2022 Model': true, 'Silver Bullet': true, 'Unicorn': true, 'OTE': true, 'Breaker': true, 'Standard FVG': true, '8 AM Hour': true
    });

    // Visibility & Focus State
    const [setupVisibility, setSetupVisibility] = useState<'ALL'|'FOCUS'|'NONE'>('NONE');
    const [focusedEntry, setFocusedEntry] = useState<EntrySignal | null>(null);

    // Configuration
    const [overlays, setOverlays] = useState<OverlayState>({
        obs: true, fvgs: true, killzones: true, silverBullet: true, pdZones: true,
        internalStructure: true, swingStructure: true, mtf: true, backtestMarkers: true,
        macro: true, historicalTradeLines: false,
        setupFilters: {
            '2022 Model': true,
            'Silver Bullet': true,
            'Unicorn': true,
            'OTE': true,
            'Breaker': true,
            'Standard FVG': true,
            '8 AM Hour': true
        }
    });
    const [colors, setColors] = useState({ obBull: '#00E676', obBear: '#FF1744', fvgBull: '#00BCD4', fvgBear: '#2962FF' });
    const [config, setConfig] = useState({ swingLength: 5, obThreshold: 1.2, fvgExtend: 10 });
    const [simulation, setSimulation] = useState<SimulationConfig>({
        minWinProbability: 50,
        allowedGrades: { 'A++': true, 'A+': true, 'B': true }
    });

    // Trading State - PERSISTENT
    const [balance, setBalance] = useState(() => {
        const saved = localStorage.getItem('ict-sim-balance');
        return saved ? parseFloat(saved) : 50000;
    });
    const [positions, setPositions] = useState<TradeEntry[]>(() => {
        const saved = localStorage.getItem('ict-sim-positions');
        return saved ? JSON.parse(saved) : [];
    });
    const [tradeHistory, setTradeHistory] = useState<TradeEntry[]>(() => {
        const saved = localStorage.getItem('ict-sim-history');
        return saved ? JSON.parse(saved) : [];
    });

    // Firebase Sync for Trade History
    useEffect(() => {
        if (!user || !isAuthReady) return;
        
        // Dynamic import to avoid loading Firebase if not needed
        import('firebase/firestore').then(({ collection, query, getDocs, doc, getDoc, setDoc }) => {
            import('./firebase').then(({ db, handleFirestoreError, OperationType }) => {
                const fetchTrades = async () => {
                    try {
                        const tradesRef = collection(db, `users/${user.uid}/trades`);
                        const q = query(tradesRef);
                        const querySnapshot = await getDocs(q);
                        
                        if (!querySnapshot.empty) {
                            const fetchedTrades: TradeEntry[] = [];
                            querySnapshot.forEach((doc) => {
                                fetchedTrades.push(doc.data() as TradeEntry);
                            });
                            
                            // Sort by time descending
                            fetchedTrades.sort((a, b) => (b.time as number) - (a.time as number));
                            setTradeHistory(fetchedTrades);
                        }
                    } catch (error) {
                        handleFirestoreError(error, OperationType.GET, `users/${user.uid}/trades`);
                    }
                };

                const fetchUserData = async () => {
                    try {
                        const userRef = doc(db, `users/${user.uid}`);
                        const userSnap = await getDoc(userRef);
                        
                        if (userSnap.exists()) {
                            const data = userSnap.data();
                            if (data.balance !== undefined) setBalance(data.balance);
                            if (data.positions !== undefined) setPositions(data.positions);
                        }
                    } catch (error) {
                        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
                    }
                };
                
                fetchTrades();
                fetchUserData();
            });
        });
    }, [user, isAuthReady]);

    // Save balance and positions to Firebase when they change
    useEffect(() => {
        if (!user) return;
        
        import('firebase/firestore').then(({ doc, setDoc }) => {
            import('./firebase').then(({ db, handleFirestoreError, OperationType }) => {
                const saveUserData = async () => {
                    try {
                        const userRef = doc(db, `users/${user.uid}`);
                        await setDoc(userRef, { balance, positions }, { merge: true });
                    } catch (error) {
                        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
                    }
                };
                saveUserData();
            });
        });
    }, [balance, positions, user]);

    // Save trade to Firebase when closed
    const saveTradeToFirebase = async (trade: TradeEntry) => {
        if (!user) return;
        
        try {
            const { doc, setDoc } = await import('firebase/firestore');
            const { db, handleFirestoreError, OperationType } = await import('./firebase');
            
            const tradeRef = doc(db, `users/${user.uid}/trades`, trade.id);
            await setDoc(tradeRef, trade);
        } catch (error) {
            import('./firebase').then(({ handleFirestoreError, OperationType }) => {
                handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/trades/${trade.id}`);
            });
        }
    };

    // Update trade in Firebase (for Journal edits)
    const updateTradeInFirebase = async (trade: TradeEntry) => {
        if (!user) return;
        
        try {
            const { doc, setDoc } = await import('firebase/firestore');
            const { db, handleFirestoreError, OperationType } = await import('./firebase');
            
            const tradeRef = doc(db, `users/${user.uid}/trades`, trade.id);
            // Use setDoc with merge: true to update existing or create if not exists
            await setDoc(tradeRef, trade, { merge: true });
        } catch (error) {
            import('./firebase').then(({ handleFirestoreError, OperationType }) => {
                handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/trades/${trade.id}`);
            });
        }
    };
    
    // Calculate Manual PnL (Persistent across timeframes)
    const manualNetPnL = useMemo(() => {
        return tradeHistory.reduce((acc, t) => acc + (t.pnl || 0), 0);
    }, [tradeHistory]);

    // MANUAL TRADING (Draft)
    const [draftTrade, setDraftTrade] = useState<DraftTrade | null>(null);

    // Auto-Trading/Bot State
    const [autoTrade, setAutoTrade] = useState(false);
    const [slInput, setSlInput] = useState('');
    const [tpInput, setTpInput] = useState('');
    const [alert, setAlert] = useState<{msg: string, type: 'success'|'error'|'info'|'warning'} | null>(null);

    // Persistence Effects
    useEffect(() => { localStorage.setItem('ict-sim-balance', balance.toString()); }, [balance]);
    useEffect(() => { 
        localStorage.setItem('ict-sim-positions', JSON.stringify(positions)); 
    }, [positions]);
    useEffect(() => { localStorage.setItem('ict-sim-history', JSON.stringify(tradeHistory)); }, [tradeHistory]);

    // Reset Function
    const resetAccount = () => {
        if(confirm("Are you sure you want to reset your paper trading account? This action cannot be undone.")) {
            setBalance(50000);
            setPositions([]);
            setTradeHistory([]);
            setDraftTrade(null);
            localStorage.removeItem('ict-sim-balance');
            localStorage.removeItem('ict-sim-positions');
            localStorage.removeItem('ict-sim-history');
            setAlert({ msg: "Account Reset Successful", type: 'info' });
        }
    };

    // --- ACTIONS ---
    const enterTrade = (type: 'LONG'|'SHORT', price: number, sl: number, tp: number, lotSize: number = 1) => { 
        const newTrade: TradeEntry = { 
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            time: Math.floor(Date.now() / 1000) as UTCTimestamp, 
            type, 
            price, 
            stopLoss: sl, 
            takeProfit: tp, 
            lotSize,
            result: 'OPEN', 
            confluences: [], 
            score: 0 
        };
        setPositions(prev => [...prev, newTrade]); 
        setAlert({ msg: `${type} Trade Opened at ${price.toFixed(2)} (Lots: ${lotSize})`, type: 'info' });
    };

    const closeTrade = (tradeId: string, pnl: number) => { 
        const trade = positions.find(p => p.id === tradeId);
        if (!trade) return;
        
        const closedTrade = { ...trade, result: pnl > 0 ? 'WIN' : 'LOSS' as const, pnl };
        
        setBalance(prev => prev + pnl); 
        setTradeHistory(prev => [closedTrade, ...prev]); 
        setPositions(prev => prev.filter(p => p.id !== tradeId));
        
        // Save to Firebase
        saveTradeToFirebase(closedTrade);
    };

    // --- DRAFT TRADE LOGIC ---
    const handleStartDraft = (type: 'LONG' | 'SHORT') => {
        if (data.length === 0) return;
        const currentPrice = data[data.length - 1].close;
        const riskDist = currentPrice * 0.002; // 0.2% risk
        const rewardDist = riskDist * 2; // 1:2 RR

        setDraftTrade({
            type,
            entryPrice: currentPrice,
            stopLoss: type === 'LONG' ? currentPrice - riskDist : currentPrice + riskDist,
            takeProfit: type === 'LONG' ? currentPrice + rewardDist : currentPrice - rewardDist,
            lotSize: 1.0
        });
    };

    const handleUpdateDraft = (update: Partial<DraftTrade>) => {
        if (!draftTrade) return;
        setDraftTrade({ ...draftTrade, ...update });
    };

    const handleExecuteDraft = () => {
        if (!draftTrade) return;
        enterTrade(
            draftTrade.type,
            draftTrade.entryPrice,
            draftTrade.stopLoss,
            draftTrade.takeProfit,
            draftTrade.lotSize
        );
        setDraftTrade(null);
    };

    const handleCancelDraft = () => {
        setDraftTrade(null);
    };


    // --- DATA FETCHING ---
    const fetchData = async () => {
        try {
            // 1. MAIN DATA
            const candles = await fetchCandles(asset, timeframe);
            
            // 2. HTF DATA FOR CONTEXT (1D, 1W, 1M for Bias)
            // Fetch these in parallel for performance
            const [candles1M, candles1W, candles1D] = await Promise.all([
                fetchCandles(asset, '1M', 50).catch(e => []),
                fetchCandles(asset, '1w', 50).catch(e => []),
                fetchCandles(asset, '1d', 100).catch(e => [])
            ]);

            // 3. CALCULATE BIAS
            const monthlyBias = calculateBias(candles1M);
            const weeklyBias = calculateBias(candles1W);
            const dailyBias = calculateBias(candles1D);
            const currentHour = new Date().getUTCHours();
            const currentSession = getSession(currentHour);

            const initialMatrix: BiasMatrix = {
                monthly: monthlyBias,
                weekly: weeklyBias,
                daily: dailyBias,
                session: currentSession,
                po3State: 'NONE', 
                sessionBiases: {
                    ASIA: { direction: 'Neutral', high: 0, low: 0, status: 'PENDING', po3Phase: 'NONE', explanation: '', prediction: '' },
                    LONDON: { direction: 'Neutral', high: 0, low: 0, status: 'PENDING', po3Phase: 'NONE', explanation: '', prediction: '' },
                    NEW_YORK: { direction: 'Neutral', high: 0, low: 0, status: 'PENDING', po3Phase: 'NONE', explanation: '', prediction: '' }
                }
            };

            // 4. CHART SETUP
            const htfTf = getHtf(timeframe);
            let candlesHtf: CandleData[] = [];
            // Use the already fetched Daily data if TF is 1H or 4H, else fetch the specific HTF
            if (htfTf === '1d' && candles1D.length > 0) candlesHtf = candles1D;
            else {
                 try { candlesHtf = await fetchCandles(asset, htfTf, 200); } catch (e) {}
            }

            setData(candles);
            
            if (!replayMode.active) {
                setReplayMode(prev => ({...prev, index: candles.length}));
            }

            const recentSlice = candles.slice(-100);
            setPdRange({ high: Math.max(...recentSlice.map(c => c.high)), low: Math.min(...recentSlice.map(c => c.low)) });

            const _structure = detectStructure(candles, config.swingLength);
            let _obs = ['5m', '15m', '1h'].includes(timeframe) ? detectOrderBlocks(candles, config.obThreshold) : [];
            const _fvgs = detectFVG(candles);
            const _htfObs = detectOrderBlocks(candlesHtf, config.obThreshold);
            const _htfFvgs = detectFVG(candlesHtf);
            
            const isLowTf = ['1m', '3m'].includes(timeframe);
            let obsForDetection = isLowTf ? _htfObs : _obs;
            if (isLowTf && obsForDetection.length === 0) {
                obsForDetection = detectOrderBlocks(candles, config.obThreshold);
                _obs = obsForDetection;
            }
            const fvgsForDetection = isLowTf ? _htfFvgs : _fvgs; 

            // 5. DETECT ENTRIES WITH TOP DOWN ANALYSIS
            // NOTE: detectEntries now returns { signals, matrix }
            const detectionResult = detectEntries(candles, obsForDetection, fvgsForDetection, _structure, timeframe, initialMatrix);
            const _rawEntries = detectionResult.signals;
            const updatedMatrix = detectionResult.matrix;

            setBiasMatrix(updatedMatrix);
            
            const _filteredEntries = _rawEntries.filter(e => {
                const meetsProb = e.winProbability >= simulation.minWinProbability;
                // @ts-ignore
                const meetsGrade = e.setupGrade ? simulation.allowedGrades[e.setupGrade] : false;
                return meetsProb && meetsGrade;
            });

            setHtfObs(_htfObs);
            setHtfFvgs(_htfFvgs);
            
            const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
            const recentEntries = _filteredEntries.filter(e => (e.time as number) > thirtyDaysAgo);
            
            const bt = performBacktest(candles, recentEntries);
            setBacktestStats(bt.stats);
            setEntries(bt.results);
            setStructure(_structure); setObs(_obs); setFvgs(_fvgs);

            const currentPrice = candles[candles.length - 1].close;
            const nearestOB = obsForDetection.find(ob => !ob.mitigated && Math.abs(currentPrice - ob.priceHigh) / currentPrice < 0.0005); 
            if (nearestOB && !alert && !replayMode.active) {
                setAlert({ msg: `Price near ${nearestOB.direction} Order Block!`, type: 'warning' });
            }
        } catch (e) { console.error(e); }
    };

    useEffect(() => { fetchData(); const interval = setInterval(fetchData, 60000); return () => clearInterval(interval); }, [asset, timeframe, autoTrade, config, simulation]);

    // --- POSITION MONITORING (TP/SL) ---
    useEffect(() => {
        if (positions.length === 0 || data.length === 0) return;
        const currentCandle = data[data.length - 1];
        const high = currentCandle.high;
        const low = currentCandle.low;
        const currentPrice = currentCandle.close;

        // Check all active positions
        positions.forEach(pos => {
            let pnl = 0;
            let closed = false;

            if (pos.type === 'LONG') {
                if (low <= pos.stopLoss) {
                    pnl = (pos.stopLoss - pos.price) * pos.lotSize; // Loss
                    closed = true;
                } else if (high >= pos.takeProfit) {
                    pnl = (pos.takeProfit - pos.price) * pos.lotSize; // Win
                    closed = true;
                }
            } else {
                if (high >= pos.stopLoss) {
                     pnl = (pos.price - pos.stopLoss) * pos.lotSize; // Loss
                     closed = true;
                } else if (low <= pos.takeProfit) {
                    pnl = (pos.price - pos.takeProfit) * pos.lotSize; // Win
                    closed = true;
                }
            }

            if (closed) {
                 closeTrade(pos.id, pnl); 
                 setAlert({ msg: `Trade Closed: ${pnl > 0 ? 'Win' : 'Loss'} ($${pnl.toFixed(2)})`, type: pnl > 0 ? 'success' : 'warning' });
            }
        });

    }, [data, positions]);

    // --- REPLAY LOGIC ---
    useEffect(() => {
        let interval: any;
        if (replayMode.active && replayMode.playing) {
            interval = setInterval(() => {
                setReplayMode(prev => {
                    if (prev.index >= data.length) {
                        return { ...prev, playing: false };
                    }
                    
                    const nextIndex = prev.index + 1;
                    const candle = data[nextIndex];
                    if (candle) {
                        const detectedEntry = entries.find(e => e.time === candle.time);
                        if (detectedEntry && overlays.setupFilters[detectedEntry.setupName as ICTSetupType] !== false) {
                             setAlert({ 
                                 msg: `Replay: ${detectedEntry.type} Setup Detected (${detectedEntry.setupName})`, 
                                 type: 'success' 
                             });
                        }
                    }

                    return { ...prev, index: nextIndex };
                });
            }, replayMode.speed);
        }
        return () => clearInterval(interval);
    }, [replayMode.active, replayMode.playing, replayMode.speed, data.length, entries, overlays.setupFilters]);

    const handleStartReplay = (trade?: EntrySignal) => {
        if (trade) {
            const tradeIndex = data.findIndex(d => d.time === trade.time);
            if (tradeIndex === -1) return;
            const startIndex = Math.max(0, tradeIndex - 50);
            setReplayMode({ active: true, index: startIndex, playing: false, speed: 500 });
            setFocusedEntry(trade);
            setSetupVisibility('FOCUS');
        } else {
            let startIndex = 0;
            if (replayDateInput && data.length > 0) {
                 const targetTime = new Date(replayDateInput).getTime() / 1000;
                 const closest = data.findIndex(d => (d.time as number) >= targetTime);
                 startIndex = closest !== -1 ? closest : 0;
            } else if (data.length > 0) {
                 startIndex = Math.floor(data.length / 2 + Math.random() * (data.length / 2));
            }
            
            setOverlays(prev => ({
                ...prev,
                setupFilters: { ...prev.setupFilters, ...replaySetupFilters }
            }));

            setReplayMode({ active: true, index: startIndex, playing: false, speed: 500 });
            setFocusedEntry(null);
            setSetupVisibility('ALL');
        }
        setActiveTab('BACKTEST');
    };

    const handleReplayControls = {
        togglePlay: () => setReplayMode(p => ({ ...p, playing: !p.playing })),
        changeSpeed: () => setReplayMode(p => ({ ...p, speed: p.speed === 100 ? 800 : p.speed === 800 ? 500 : p.speed === 500 ? 200 : 100 })), 
        exit: () => {
            setReplayMode(p => ({ ...p, active: false, playing: false }));
            setSetupVisibility('ALL');
            setFocusedEntry(null);
        },
        seek: (val: number) => setReplayMode(p => ({ ...p, index: val })),
        showAll: () => {
             setSetupVisibility('ALL');
             setOverlays(prev => ({...prev, historicalTradeLines: true}));
        }
    };

    const displayedData = useMemo(() => {
        if (!replayMode.active) return data;
        return data.slice(0, replayMode.index);
    }, [data, replayMode.active, replayMode.index]);

    const displayedObs = useMemo(() => {
         if (!replayMode.active) return obs;
         const lastTime = displayedData.length > 0 ? displayedData[displayedData.length-1].time as number : 0;
         return obs.filter(o => (o.time as number) <= lastTime);
    }, [obs, replayMode.active, displayedData]);

    const displayedFvgs = useMemo(() => {
         if (!replayMode.active) return fvgs;
         const lastTime = displayedData.length > 0 ? displayedData[displayedData.length-1].time as number : 0;
         return fvgs.filter(f => (f.time as number) <= lastTime);
    }, [fvgs, replayMode.active, displayedData]);

    const handleDeepScan = () => {
        setIsScanning(true);
        setTimeout(() => { setIsScanning(false); setAlert({ msg: "Deep Scan Complete: Adjusted probabilities", type: "success" }); }, 2000);
    };

    const handleFocusEntry = (entry: EntrySignal) => {
        setFocusedEntry(entry);
        setSetupVisibility('FOCUS');
        if (activeTab === 'DASHBOARD' || activeTab === 'STATS') setActiveTab('CHART');
    };

    const handleViewOnChart = (entry: EntrySignal) => {
        setFocusedEntry(entry);
        setSetupVisibility('FOCUS');
        setClickedEntry(entry); 
        setActiveTab('CHART');
    };

    const thirtyDaysAgoTimestamp = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
    const recentHistory = entries.filter(e => e.backtestResult !== 'PENDING' && (e.time as number) > thirtyDaysAgoTimestamp);
    const isLowTf = ['1m', '3m'].includes(timeframe);
    const visibleFvgs = isLowTf ? [] : displayedFvgs;

    const isSidebarPanelOpen = !['DASHBOARD', 'CHART', 'BACKTEST', 'STATS', 'SETUPS', 'TRADING'].includes(activeTab);
    const safeStats = backtestStats || {totalTrades:0, wins:0, losses:0, winRate:0, netPnL:0, profitFactor:0, maxDrawdown:0, equityCurve:[]};

    const FeatureLocked = ({ featureName }: { featureName: string }) => (
        <div className="flex flex-col items-center justify-center h-full bg-[#0b0e11] text-gray-400 p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-gray-600">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <h2 className="text-2xl font-bold text-white mb-2">{featureName} Locked</h2>
            <p className="max-w-md mb-6">You do not have access to this feature. Please upgrade your plan or contact your administrator to enable it.</p>
            <button onClick={() => setActiveTab('DASHBOARD')} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                Return to Dashboard
            </button>
        </div>
    );

    if (!isAuthReady) {
        return (
            <div className="flex h-screen bg-[#0b0e11] items-center justify-center text-white">
                <div className="animate-pulse">Loading SaaS Trading...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex h-screen bg-[#0b0e11] items-center justify-center text-white font-sans">
                <div className="bg-[#151924] p-8 rounded-xl border border-[#2a2e39] max-w-md w-full text-center shadow-2xl">
                    <h1 className="text-3xl font-bold mb-2"><span className="text-blue-500">ICT</span>MASTER</h1>
                    <p className="text-gray-400 mb-8">Sign in to access your trading dashboard, bots, and analytics.</p>
                    
                    {loginError && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm">
                            {loginError}
                        </div>
                    )}

                    <button 
                        onClick={handleLogin}
                        disabled={isLoggingIn}
                        className={`w-full bg-white text-black font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-3 transition-colors ${isLoggingIn ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-200'}`}
                    >
                        {isLoggingIn ? (
                            <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                        )}
                        {isLoggingIn ? 'Signing in...' : 'Sign in with Google'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-[#0b0e11] text-[#e1e3e6] font-sans overflow-hidden">
            {alert && <ToastNotification message={alert.msg} type={alert.type} onClose={() => setAlert(null)} />}
            {showTopSetups && <TopSetupsModal entries={entries} onClose={() => setShowTopSetups(false)} />}
            {clickedEntry && <EntryDetailModal entry={clickedEntry} onClose={() => setClickedEntry(null)} onReplay={() => handleStartReplay(clickedEntry)} />}

            {/* TOP BAR */}
            <header className="h-14 bg-[#151924] border-b border-[#2a2e39] flex items-center justify-between px-4 shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <button 
                        className="md:hidden text-gray-400 hover:text-white"
                        onClick={() => setMobileMenuOpen(true)}
                    >
                        <MenuIcon />
                    </button>

                    <div className="font-bold text-lg tracking-tight text-white flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('DASHBOARD')}>
                        <span className="text-blue-500">ICT</span>MASTER
                    </div>
                    <div className="h-6 w-[1px] bg-gray-700 mx-2 hidden md:block"></div>
                    <select value={asset} onChange={e => setAsset(e.target.value)} className="bg-[#0b0e11] text-sm border border-gray-700 rounded px-2 py-1 outline-none focus:border-blue-500">
                        {['MGC (COMEX)', 'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'EURUSDT'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <div className="flex bg-[#0b0e11] rounded border border-gray-700 p-0.5 overflow-x-auto max-w-[120px] md:max-w-none scrollbar-hide">
                        {['1m', '5m', '15m', '1h', '4h'].map(tf => ( 
                            <button key={tf} onClick={() => setTimeframe(tf)} className={`px-2 py-0.5 text-xs rounded shrink-0 ${timeframe === tf ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}>{tf}</button> 
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Balance</span>
                        <span className="font-mono text-sm text-white font-bold">${balance.toLocaleString()}</span>
                    </div>
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Realized PnL</span>
                        <div className="flex flex-col items-end leading-none">
                            <span className={`font-mono text-sm font-bold ${manualNetPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>${manualNetPnL.toLocaleString()}</span>
                            {backtestStats && (
                                <span className={`text-[9px] font-mono mt-0.5 ${backtestStats.netPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>Algo: ${backtestStats.netPnL.toLocaleString()}</span>
                            )}
                        </div>
                    </div>
                    <button onClick={() => setShowTopSetups(true)} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors animate-pulse">
                        TOP SETUPS
                    </button>
                    <button onClick={logout} className="text-gray-400 hover:text-white ml-2" title="Sign out">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    </button>
                </div>
            </header>

            {/* MAIN LAYOUT */}
            <div className="flex-1 flex overflow-hidden relative">
                
                {/* LEFT SIDEBAR */}
                <nav className="w-16 bg-[#151924] border-r border-[#2a2e39] hidden md:flex flex-col items-center py-4 gap-2 z-40 overflow-y-auto scrollbar-hide">
                    <SidebarItem active={activeTab === 'DASHBOARD'} onClick={() => setActiveTab('DASHBOARD')} icon={<DashboardIcon/>} label="Dashboard" />
                    <SidebarItem active={activeTab === 'CHART'} onClick={() => setActiveTab('CHART')} icon={<ChartIcon/>} label="Chart" />
                    <SidebarItem active={activeTab === 'TRADING'} onClick={() => setActiveTab('TRADING')} icon={<TradeIcon/>} label="Paper Trading" />
                    <SidebarItem active={activeTab === 'JOURNAL'} onClick={() => setActiveTab('JOURNAL')} icon={<JournalIcon/>} label="Journal" />
                    <SidebarItem active={activeTab === 'TASKS'} onClick={() => setActiveTab('TASKS')} icon={<TasksIcon/>} label="Daily Tasks" />
                    <SidebarItem active={activeTab === 'NEWS'} onClick={() => setActiveTab('NEWS')} icon={<NewsIcon/>} label="News" />
                    <SidebarItem active={activeTab === 'BROKER'} onClick={() => setActiveTab('BROKER')} icon={<BrokerIcon/>} label="Broker Sync" />
                    <SidebarItem active={activeTab === 'STATS'} onClick={() => setActiveTab('STATS')} icon={<StatsIcon/>} label="Trade History" />
                    <SidebarItem active={activeTab === 'SCANNER'} onClick={() => setActiveTab('SCANNER')} icon={<ListIcon/>} label="Scanner" />
                    <SidebarItem active={activeTab === 'BACKTEST'} onClick={() => setActiveTab('BACKTEST')} icon={<BacktestIcon/>} label="Replay / Backtest" />
                    <SidebarItem active={activeTab === 'SETUPS'} onClick={() => setActiveTab('SETUPS')} icon={<SetupsIcon/>} label="ICT Models" />
                    <SidebarItem active={activeTab === 'BOTS'} onClick={() => setActiveTab('BOTS')} icon={<BotsIcon/>} label="Auto Bots" />
                    <SidebarItem active={activeTab === 'RISK'} onClick={() => setActiveTab('RISK')} icon={<RiskIcon/>} label="Risk Guardrails" />
                    <div className="flex-1"></div>
                    {(userProfile?.role === 'SUPER_ADMIN' || userProfile?.role === 'OWNER' || userProfile?.role === 'ADMIN') && (
                        <SidebarItem active={activeTab === 'ADMIN'} onClick={() => setActiveTab('ADMIN')} icon={<AdminIcon/>} label="Admin" />
                    )}
                    <SidebarItem active={activeTab === 'PROFILE'} onClick={() => setActiveTab('PROFILE')} icon={<ProfileIcon/>} label="Profile" />
                    <SidebarItem active={activeTab === 'SETTINGS'} onClick={() => setActiveTab('SETTINGS')} icon={<SettingsIcon/>} label="Settings" />
                </nav>

                {/* MOBILE MENU */}
                {mobileMenuOpen && (
                    <div className="absolute inset-0 z-[60] bg-[#151924] flex flex-col p-6 animate-in slide-in-from-left-full md:hidden">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-bold text-white">Main Menu</h2>
                            <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-white p-2 bg-gray-800 rounded-full">
                                <XIcon />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {['DASHBOARD', 'CHART', 'TRADING', 'JOURNAL', 'TASKS', 'NEWS', 'BROKER', 'STATS', 'SCANNER', 'BACKTEST', 'SETUPS', 'BOTS', 'RISK', ...(userProfile?.role === 'SUPER_ADMIN' || userProfile?.role === 'OWNER' || userProfile?.role === 'ADMIN' ? ['ADMIN'] : []), 'PROFILE', 'SETTINGS'].map(tab => (
                                <button key={tab} onClick={() => { setActiveTab(tab); setMobileMenuOpen(false); }} className={`p-4 rounded-lg border flex flex-col items-center gap-2 ${activeTab === tab ? 'bg-blue-900/20 border-blue-500 text-blue-400' : 'bg-[#0b0e11] border-[#2a2e39] text-gray-400'}`}>
                                    <span className="text-sm font-bold">{tab}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* CENTER CONTENT */}
                <main className="flex-1 relative bg-[#0b0e11] flex flex-col min-w-0">
                    {/* TRADING MODE OVERRIDE */}
                    {activeTab === 'TRADING' ? (
                        <div className="flex h-full">
                            <div className="flex-1 relative border-r border-[#2a2e39]">
                                <div className="absolute top-4 left-4 z-50 bg-[#151924]/80 backdrop-blur p-2 rounded border border-blue-500/30 text-xs font-bold text-blue-400 pointer-events-none">
                                    TRADING DESK ACTIVE
                                </div>
                                <ErrorBoundary>
                                    <ChartComponent 
                                        data={data} obs={obs} fvgs={visibleFvgs} structure={structure} entries={entries} 
                                        overlays={overlays} colors={colors} onHoverEntry={setHoveredEntry} onClickEntry={setClickedEntry} 
                                        onToggleOverlay={() => setOverlays(p => ({...p, killzones: !p.killzones}))} 
                                        pdRange={pdRange} positions={positions} htfObs={htfObs} htfFvgs={htfFvgs}
                                        setOverlays={setOverlays}
                                        onReload={fetchData}
                                        setupVisibility={setupVisibility}
                                        setSetupVisibility={setSetupVisibility}
                                        focusedEntry={focusedEntry}
                                        replayState={{ active: false, index: 0, playing: false, speed: 0, maxIndex: 0 }}
                                        onReplayControl={handleReplayControls}
                                        // Draft Props
                                        draftTrade={draftTrade}
                                        onUpdateDraft={handleUpdateDraft}
                                    />
                                </ErrorBoundary>
                            </div>
                            <div className="w-[340px] bg-[#151924]">
                                <Panels 
                                    activeTab="TRADING" setActiveTab={setActiveTab}
                                    structure={structure} entries={entries} setClickedEntry={setClickedEntry}
                                    balance={balance} positions={positions} data={data} closeTrade={closeTrade}
                                    enterTrade={enterTrade} slInput={slInput} setSlInput={setSlInput}
                                    tpInput={tpInput} setTpInput={setTpInput} autoTrade={autoTrade} setAutoTrade={setAutoTrade}
                                    settingsTab={settingsTab} setSettingsTab={setSettingsTab}
                                    config={config} setConfig={setConfig} overlays={overlays} setOverlays={setOverlays}
                                    colors={colors} setColors={setColors} backtestStats={backtestStats}
                                    recentHistory={recentHistory} obs={obs}
                                    simulation={simulation} setSimulation={setSimulation}
                                    onDeepScan={handleDeepScan} isScanning={isScanning}
                                    currentAsset={asset}
                                    resetAccount={resetAccount}
                                    // Draft Props
                                    draftTrade={draftTrade}
                                    onStartDraft={handleStartDraft}
                                    onCancelDraft={handleCancelDraft}
                                    onExecuteDraft={handleExecuteDraft}
                                    onUpdateDraft={handleUpdateDraft}
                                />
                            </div>
                        </div>
                    ) : (
                        activeTab === 'DASHBOARD' ? (
                            <DashboardPanel 
                                balance={balance} 
                                backtestStats={backtestStats} 
                                positions={positions} 
                                tradeHistory={tradeHistory}
                                userProfile={userProfile}
                                currentAsset={asset}
                                onAssetChange={setAsset}
                            />
                        ) : activeTab === 'JOURNAL' ? (
                            <JournalPanel 
                                tradeHistory={tradeHistory} 
                                algoSignals={recentHistory}
                                onUpdateTrade={(updated) => {
                                    setTradeHistory(prev => {
                                        const exists = prev.find(t => t.id === updated.id);
                                        if (exists) return prev.map(t => t.id === updated.id ? updated : t);
                                        return [...prev, updated];
                                    });
                                    updateTradeInFirebase(updated);
                                }}
                            />
                        ) : activeTab === 'TASKS' ? (
                            (userProfile?.role !== 'SUPER_ADMIN' && userProfile?.role !== 'OWNER' && userProfile?.features?.tasks === false) ? <FeatureLocked featureName="Daily Tasks" /> : <TasksPanel />
                        ) : activeTab === 'NEWS' ? (
                            (userProfile?.role !== 'SUPER_ADMIN' && userProfile?.role !== 'OWNER' && userProfile?.features?.news === false) ? <FeatureLocked featureName="News" /> : <NewsPanel />
                        ) : activeTab === 'BROKER' ? (
                            <BrokerPanel 
                                onImportTrades={(newTrades) => {
                                    setTradeHistory(prev => [...prev, ...newTrades]);
                                    setActiveTab('STATS');
                                }} 
                            />
                        ) : activeTab === 'STATS' ? (
                            (userProfile?.role !== 'SUPER_ADMIN' && userProfile?.role !== 'OWNER' && userProfile?.features?.analytics === false) ? <FeatureLocked featureName="Analytics & Stats" /> :
                            <StatsPanel 
                                backtestStats={safeStats} 
                                recentHistory={recentHistory}
                                tradeHistory={tradeHistory}
                                setClickedEntry={setClickedEntry} 
                                onFocusEntry={handleFocusEntry}
                                focusedEntry={focusedEntry}
                                onReplay={handleStartReplay}
                            />
                        ) : activeTab === 'SETUPS' ? (
                            <SetupsPanel 
                                entries={entries} 
                                setClickedEntry={setClickedEntry} 
                                overlays={overlays}
                                setOverlays={setOverlays}
                                onClose={() => setActiveTab('CHART')}
                                onViewOnChart={handleViewOnChart}
                            />
                        ) : activeTab === 'SCANNER' ? (
                            <div className="h-full bg-[#151924]">
                                <ScannerPanel 
                                    structure={structure} 
                                    entries={entries} 
                                    setClickedEntry={setClickedEntry} 
                                    onDeepScan={handleDeepScan} 
                                    isScanning={isScanning} 
                                    onClose={() => setActiveTab('CHART')}
                                    onFocusEntry={handleFocusEntry}
                                    focusedEntry={focusedEntry}
                                    onReplay={handleStartReplay}
                                    currentAsset={asset}
                                    biasMatrix={biasMatrix || undefined}
                                />
                            </div>
                        ) : activeTab === 'BACKTEST' ? (
                            (userProfile?.role !== 'SUPER_ADMIN' && userProfile?.role !== 'OWNER' && userProfile?.features?.backtesting === false) ? <FeatureLocked featureName="Backtesting" /> :
                            replayMode.active ? (
                                <div className="flex-1 relative h-full">
                                    <ErrorBoundary>
                                        <ChartComponent 
                                            data={displayedData} obs={displayedObs} fvgs={visibleFvgs} structure={structure} entries={entries} 
                                            overlays={overlays} colors={colors} onHoverEntry={setHoveredEntry} onClickEntry={setClickedEntry} 
                                            onToggleOverlay={() => setOverlays(p => ({...p, killzones: !p.killzones}))} 
                                            pdRange={pdRange} positions={positions} htfObs={htfObs} htfFvgs={htfFvgs}
                                            setOverlays={setOverlays}
                                            onReload={fetchData}
                                            setupVisibility={setupVisibility}
                                            setSetupVisibility={setSetupVisibility}
                                            focusedEntry={focusedEntry}
                                            replayState={{...replayMode, maxIndex: data.length}}
                                            onReplayControl={handleReplayControls}
                                        />
                                    </ErrorBoundary>
                                </div>
                            ) : (
                                <BacktestPanel onStartReplay={handleStartReplay} />
                            )
                        ) : activeTab === 'PROFILE' ? (
                            <ProfilePanel 
                                user={user} 
                                userProfile={userProfile} 
                                onLogout={logout} 
                                onUpdateProfile={async (updated) => {
                                    if (!user) return;
                                    const { doc, setDoc } = await import('firebase/firestore');
                                    const { db } = await import('./firebase');
                                    const userRef = doc(db, `users/${user.uid}`);
                                    await setDoc(userRef, updated, { merge: true });
                                    setUserProfile(updated);
                                }}
                            />
                        ) : activeTab === 'ADMIN' ? (
                            (userProfile?.role === 'SUPER_ADMIN' || userProfile?.role === 'OWNER' || userProfile?.role === 'ADMIN') ? <AdminPanel userProfile={userProfile} /> : <FeatureLocked featureName="Administration" />
                        ) : activeTab === 'BOTS' ? (
                            (userProfile?.role !== 'SUPER_ADMIN' && userProfile?.role !== 'OWNER' && userProfile?.features?.bots === false) ? <FeatureLocked featureName="Auto Bots" /> : <BotsPanel userProfile={userProfile} />
                        ) : activeTab === 'RISK' ? (
                            <RiskPanel />
                        ) : (
                            <>
                                <div className="h-6 bg-[#0b0e11] border-b border-[#2a2e39] flex items-center overflow-hidden whitespace-nowrap px-2 z-10 shrink-0">
                                    <div className="text-[10px] font-bold text-gray-500 mr-2">LIVE:</div>
                                    <div className="animate-marquee flex gap-8">
                                        {entries.slice(-5).reverse().map((e, i) => ( 
                                            <span key={i} className={`text-[10px] font-mono ${e.score >= 7 ? 'text-yellow-400' : 'text-gray-400'}`}>
                                                {e.type} {asset} @ {e.price.toFixed(2)} [{e.setupName}]
                                            </span> 
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="flex-1 relative">
                                    <ErrorBoundary>
                                        <ChartComponent 
                                            data={data} obs={obs} fvgs={visibleFvgs} structure={structure} entries={entries} 
                                            overlays={overlays} colors={colors} onHoverEntry={setHoveredEntry} onClickEntry={setClickedEntry} 
                                            onToggleOverlay={() => setOverlays(p => ({...p, killzones: !p.killzones}))} 
                                            pdRange={pdRange} positions={positions} htfObs={htfObs} htfFvgs={htfFvgs}
                                            setOverlays={setOverlays}
                                            onReload={fetchData}
                                            setupVisibility={setupVisibility}
                                            setSetupVisibility={setSetupVisibility}
                                            focusedEntry={focusedEntry}
                                            replayState={{ active: false, index: 0, playing: false, speed: 0, maxIndex: 0 }}
                                            onReplayControl={handleReplayControls}
                                        />
                                    </ErrorBoundary>
                                    
                                    {hoveredEntry && !clickedEntry && (
                                        <div className="absolute top-4 left-16 bg-[#151924] border border-blue-500/50 p-3 rounded shadow-xl text-xs z-50 pointer-events-none">
                                            <div className="font-bold text-white mb-1 flex items-center gap-2">
                                                <span className={hoveredEntry.type === 'LONG' ? 'text-green-500' : 'text-red-500'}>{hoveredEntry.type}</span>
                                                <span className="bg-gray-700 px-1 rounded text-[10px]">{hoveredEntry.setupGrade}</span>
                                            </div>
                                            <div className="text-gray-300 font-bold mb-1">{hoveredEntry.setupName}</div>
                                            <div className="text-gray-400 mb-1">Win Prob: <span className="text-white">{hoveredEntry.winProbability}%</span></div>
                                            <div className="text-gray-500 italic">{hoveredEntry.confluences[0]}</div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )
                    )}
                </main>

                {/* RIGHT SIDEBAR (Standard, hidden if Trading Desk Active) */}
                {isSidebarPanelOpen && (
                    <aside className="absolute inset-0 z-40 md:static md:flex w-full md:w-[320px] bg-[#151924] border-l border-[#2a2e39] flex-col shadow-xl">
                        <div className="md:hidden p-2 bg-[#1e222d] border-b border-[#2a2e39] flex justify-end">
                            <button onClick={() => setActiveTab('CHART')} className="text-gray-400 hover:text-white flex items-center gap-2 text-sm font-bold bg-gray-800 px-3 py-1 rounded">
                                Close Panel <XIcon />
                            </button>
                        </div>
                        <Panels 
                            activeTab={activeTab} setActiveTab={setActiveTab}
                            structure={structure} entries={entries} setClickedEntry={setClickedEntry}
                            balance={balance} positions={positions} data={data} closeTrade={closeTrade}
                            enterTrade={enterTrade} slInput={slInput} setSlInput={setSlInput}
                            tpInput={tpInput} setTpInput={setTpInput} autoTrade={autoTrade} setAutoTrade={setAutoTrade}
                            settingsTab={settingsTab} setSettingsTab={setSettingsTab}
                            config={config} setConfig={setConfig} overlays={overlays} setOverlays={setOverlays}
                            colors={colors} setColors={setColors} backtestStats={backtestStats}
                            recentHistory={recentHistory} obs={obs}
                            simulation={simulation} setSimulation={setSimulation}
                            onDeepScan={handleDeepScan} isScanning={isScanning}
                            onFocusEntry={handleFocusEntry}
                            focusedEntry={focusedEntry}
                            onReplay={handleStartReplay}
                            onViewOnChart={handleViewOnChart}
                            currentAsset={asset}
                            resetAccount={resetAccount}
                        />
                    </aside>
                )}
            </div>
            
            {/* MOBILE NAV */}
             <nav className="md:hidden h-16 bg-[#151924] border-t border-[#2a2e39] flex items-center justify-around shrink-0 z-50 pb-safe">
                 <button onClick={() => setActiveTab('DASHBOARD')} className={`flex flex-col items-center gap-1 ${activeTab === 'DASHBOARD' ? 'text-blue-500' : 'text-gray-500'}`}>
                    <DashboardIcon /> <span className="text-[10px]">Home</span>
                </button>
                <button onClick={() => setActiveTab('CHART')} className={`flex flex-col items-center gap-1 ${activeTab === 'CHART' ? 'text-blue-500' : 'text-gray-500'}`}>
                    <ChartIcon /> <span className="text-[10px]">Chart</span>
                </button>
                <button onClick={() => setActiveTab('BACKTEST')} className={`flex flex-col items-center gap-1 ${activeTab === 'BACKTEST' ? 'text-blue-500' : 'text-gray-500'}`}>
                    <BacktestIcon /> <span className="text-[10px]">Replay</span>
                </button>
                <button onClick={() => setActiveTab('SETUPS')} className={`flex flex-col items-center gap-1 ${activeTab === 'SETUPS' ? 'text-blue-500' : 'text-gray-500'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg> <span className="text-[10px]">Models</span>
                </button>
                <button onClick={() => setActiveTab('TRADING')} className={`flex flex-col items-center gap-1 ${activeTab === 'TRADING' ? 'text-blue-500' : 'text-gray-500'}`}>
                    <TradeIcon /> <span className="text-[10px]">Trade</span>
                </button>
            </nav>
        </div>
    );
};

export default App;
