import React, { useState, useEffect } from 'react';
import { RiskSettings } from '../../types';
import { auth, db, handleFirestoreError, OperationType } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export const RiskPanel: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [settings, setSettings] = useState<RiskSettings>({
        dailyLossLimit: 500,
        maxDrawdown: 5,
        maxTradesPerDay: 5,
        consecutiveLossesLimit: 3,
        lockoutActive: false
    });

    const [currentMetrics, setCurrentMetrics] = useState({
        dailyLoss: 150,
        currentDrawdown: 2.5,
        tradesToday: 2,
        consecutiveLosses: 1
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!user) return;
        
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, `users/${user.uid}/data/risk`);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    const data = snap.data();
                    if (data.settings) {
                        setSettings(data.settings);
                    }
                }
            } catch (error) {
                handleFirestoreError(error, OperationType.GET, `users/${user.uid}/data/risk`);
            }
        };
        fetchSettings();
    }, [user]);

    const handleSave = async () => {
        if (!user) {
            alert('Risk settings saved locally. Log in to sync across devices.');
            return;
        }

        try {
            const docRef = doc(db, `users/${user.uid}/data/risk`);
            await setDoc(docRef, { settings }, { merge: true });
            alert('Risk settings saved to Firebase successfully.');
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/data/risk`);
            alert('Error saving risk settings.');
        }
    };

    return (
        <div className="h-full bg-[#0b0e11] text-white p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                            Risk Management & Guardrails
                        </h2>
                        <p className="text-gray-400">Set strict rules to protect your capital. If limits are hit, trading will be locked until the next session.</p>
                    </div>
                    <button 
                        onClick={handleSave}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                    >
                        Save Rules
                    </button>
                </div>

                {settings.lockoutActive && (
                    <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-6 flex items-start gap-4">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 shrink-0 mt-1"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                        <div>
                            <h3 className="text-lg font-bold text-red-400">Trading Locked</h3>
                            <p className="text-red-300/80 mt-1">You have hit your Daily Loss Limit. Trading is disabled until tomorrow at 00:00 UTC to protect your capital.</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Current Status */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-white border-b border-[#2a2e39] pb-2">Current Session Status</h3>
                        
                        <div className="bg-[#151924] border border-[#2a2e39] rounded-xl p-6 space-y-6">
                            {/* Daily Loss Progress */}
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Daily Loss</span>
                                    <span className="font-mono font-bold text-white">-${currentMetrics.dailyLoss} / -${settings.dailyLossLimit}</span>
                                </div>
                                <div className="w-full bg-[#0b0e11] rounded-full h-3 border border-[#2a2e39] overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all ${currentMetrics.dailyLoss / settings.dailyLossLimit > 0.8 ? 'bg-red-500' : 'bg-blue-500'}`}
                                        style={{ width: `${Math.min((currentMetrics.dailyLoss / settings.dailyLossLimit) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Max Drawdown Progress */}
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Max Drawdown</span>
                                    <span className="font-mono font-bold text-white">{currentMetrics.currentDrawdown}% / {settings.maxDrawdown}%</span>
                                </div>
                                <div className="w-full bg-[#0b0e11] rounded-full h-3 border border-[#2a2e39] overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all ${currentMetrics.currentDrawdown / settings.maxDrawdown > 0.8 ? 'bg-red-500' : 'bg-yellow-500'}`}
                                        style={{ width: `${Math.min((currentMetrics.currentDrawdown / settings.maxDrawdown) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Trades Today */}
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Trades Today</span>
                                    <span className="font-mono font-bold text-white">{currentMetrics.tradesToday} / {settings.maxTradesPerDay}</span>
                                </div>
                                <div className="w-full bg-[#0b0e11] rounded-full h-3 border border-[#2a2e39] overflow-hidden">
                                    <div 
                                        className="h-full bg-green-500 rounded-full transition-all"
                                        style={{ width: `${Math.min((currentMetrics.tradesToday / settings.maxTradesPerDay) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Settings Form */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-white border-b border-[#2a2e39] pb-2">Configure Guardrails</h3>
                        
                        <div className="bg-[#151924] border border-[#2a2e39] rounded-xl p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">Daily Loss Limit ($)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                                    <input 
                                        type="number" 
                                        value={settings.dailyLossLimit}
                                        onChange={e => setSettings({...settings, dailyLossLimit: Number(e.target.value)})}
                                        className="w-full bg-[#0b0e11] text-white p-3 pl-8 rounded-lg border border-[#2a2e39] focus:border-blue-500 outline-none font-mono"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">If your daily PnL hits this negative amount, trading is locked.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">Max Drawdown (%)</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        value={settings.maxDrawdown}
                                        onChange={e => setSettings({...settings, maxDrawdown: Number(e.target.value)})}
                                        className="w-full bg-[#0b0e11] text-white p-3 pr-8 rounded-lg border border-[#2a2e39] focus:border-blue-500 outline-none font-mono"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">%</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Maximum peak-to-trough drop allowed on your account.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">Max Trades Per Day</label>
                                <input 
                                    type="number" 
                                    value={settings.maxTradesPerDay}
                                    onChange={e => setSettings({...settings, maxTradesPerDay: Number(e.target.value)})}
                                    className="w-full bg-[#0b0e11] text-white p-3 rounded-lg border border-[#2a2e39] focus:border-blue-500 outline-none font-mono"
                                />
                                <p className="text-xs text-gray-500 mt-2">Prevents overtrading. Once hit, no new positions can be opened.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">Consecutive Losses Limit</label>
                                <input 
                                    type="number" 
                                    value={settings.consecutiveLossesLimit}
                                    onChange={e => setSettings({...settings, consecutiveLossesLimit: Number(e.target.value)})}
                                    className="w-full bg-[#0b0e11] text-white p-3 rounded-lg border border-[#2a2e39] focus:border-blue-500 outline-none font-mono"
                                />
                                <p className="text-xs text-gray-500 mt-2">Forces a break if you hit a losing streak.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
