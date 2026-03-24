import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { User } from 'firebase/auth';

interface ProfilePanelProps {
    user: User | null;
    userProfile: UserProfile | null;
    onLogout: () => void;
    onUpdateProfile?: (profile: UserProfile) => Promise<void>;
}

export const ProfilePanel: React.FC<ProfilePanelProps> = ({ user, userProfile, onLogout, onUpdateProfile }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: userProfile?.firstName || '',
        lastName: userProfile?.lastName || '',
        displayName: userProfile?.displayName || user?.displayName || '',
        botSettings: {
            startingBalance: userProfile?.botSettings?.startingBalance || 10000,
            maxBots: userProfile?.botSettings?.maxBots || 5
        }
    });
    const [isSaving, setIsSaving] = useState(false);

    // Use real profile data or fallback to defaults
    const profile: UserProfile = userProfile || {
        uid: user?.uid || '123',
        email: user?.email || 'trader@example.com',
        displayName: user?.displayName || 'Pro Trader',
        role: 'MEMBER',
        workspaceId: 'ws_12345',
        plan: 'FREE',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
    };

    const handleSave = async () => {
        if (!onUpdateProfile) return;
        setIsSaving(true);
        try {
            await onUpdateProfile({
                ...profile,
                ...formData,
                displayName: formData.displayName || `${formData.firstName} ${formData.lastName}`.trim() || profile.displayName
            });
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update profile", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="h-full bg-[#0b0e11] text-white p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h2 className="text-2xl font-bold mb-2">My Profile</h2>
                    <p className="text-gray-400">Manage your personal information, subscription, and workspace settings.</p>
                </div>

                <div className="bg-[#151924] border border-[#2a2e39] rounded-xl p-8 flex flex-col md:flex-row items-center md:items-start gap-8">
                    <div className="relative">
                        <img 
                            src={user?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.displayName}`} 
                            alt="Profile" 
                            className="w-32 h-32 rounded-full border-4 border-[#2a2e39] object-cover"
                            referrerPolicy="no-referrer"
                        />
                        <button className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-500 p-2 rounded-full border-2 border-[#151924] transition-colors">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                        </button>
                    </div>
                    
                    <div className="flex-1 space-y-4 text-center md:text-left">
                        {isEditing ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-400 uppercase font-bold">First Name</label>
                                    <input 
                                        type="text" 
                                        value={formData.firstName}
                                        onChange={e => setFormData({...formData, firstName: e.target.value})}
                                        className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded px-3 py-2 outline-none focus:border-blue-500"
                                        placeholder="First Name"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-400 uppercase font-bold">Last Name</label>
                                    <input 
                                        type="text" 
                                        value={formData.lastName}
                                        onChange={e => setFormData({...formData, lastName: e.target.value})}
                                        className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded px-3 py-2 outline-none focus:border-blue-500"
                                        placeholder="Last Name"
                                    />
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <label className="text-xs text-gray-400 uppercase font-bold">Display Name</label>
                                    <input 
                                        type="text" 
                                        value={formData.displayName}
                                        onChange={e => setFormData({...formData, displayName: e.target.value})}
                                        className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded px-3 py-2 outline-none focus:border-blue-500"
                                        placeholder="Display Name"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <h3 className="text-3xl font-bold text-white">
                                    {profile.firstName || profile.lastName ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : profile.displayName}
                                </h3>
                                <p className="text-gray-400">{profile.email}</p>
                            </div>
                        )}
                        
                        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                            <span className="bg-blue-900/30 text-blue-400 px-3 py-1 rounded-full text-sm font-bold border border-blue-500/30">
                                {profile.plan} PLAN
                            </span>
                            <span className="bg-purple-900/30 text-purple-400 px-3 py-1 rounded-full text-sm font-bold border border-purple-500/30">
                                {profile.role}
                            </span>
                        </div>
                        
                        <div className="pt-4 border-t border-[#2a2e39] flex flex-col sm:flex-row gap-4">
                            {isEditing ? (
                                <>
                                    <button 
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button 
                                        onClick={() => setIsEditing(false)}
                                        className="bg-[#2a2e39] hover:bg-[#3a3f4c] text-white font-bold py-2 px-6 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="bg-[#2a2e39] hover:bg-[#3a3f4c] text-white font-bold py-2 px-6 rounded-lg transition-colors"
                                >
                                    Edit Profile
                                </button>
                            )}
                            <button 
                                onClick={onLogout}
                                className="bg-red-600/20 hover:bg-red-600/30 text-red-500 font-bold py-2 px-6 rounded-lg transition-colors border border-red-500/30"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Bot Settings */}
                    <div className="bg-[#151924] border border-[#2a2e39] rounded-xl p-6">
                        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M12 2V22"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                            Bot Settings
                        </h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-[#2a2e39] pb-3">
                                <span className="text-gray-400">Starting Balance</span>
                                {isEditing ? (
                                    <input 
                                        type="number" 
                                        value={formData.botSettings.startingBalance}
                                        onChange={e => setFormData({...formData, botSettings: {...formData.botSettings, startingBalance: Number(e.target.value)}})}
                                        className="w-24 bg-[#0b0e11] border border-[#2a2e39] rounded px-2 py-1 text-right outline-none focus:border-blue-500"
                                    />
                                ) : (
                                    <span className="font-bold text-white">${profile.botSettings?.startingBalance || 10000}</span>
                                )}
                            </div>
                            <div className="flex justify-between items-center border-b border-[#2a2e39] pb-3">
                                <span className="text-gray-400">Max Test Bots</span>
                                {isEditing ? (
                                    <select 
                                        value={formData.botSettings.maxBots}
                                        onChange={e => setFormData({...formData, botSettings: {...formData.botSettings, maxBots: Number(e.target.value)}})}
                                        className="bg-[#0b0e11] border border-[#2a2e39] rounded px-2 py-1 outline-none focus:border-blue-500"
                                    >
                                        {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                ) : (
                                    <span className="font-bold text-white">{profile.botSettings?.maxBots || 5}</span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 italic">
                                * These settings define your starting capital and the number of bots you can run simultaneously in simulation mode.
                            </p>
                        </div>
                    </div>

                    {/* Subscription Details */}
                    <div className="bg-[#151924] border border-[#2a2e39] rounded-xl p-6">
                        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                            Subscription
                        </h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-[#2a2e39] pb-3">
                                <span className="text-gray-400">Current Plan</span>
                                <span className="font-bold text-white">{profile.plan}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-[#2a2e39] pb-3">
                                <span className="text-gray-400">Billing Cycle</span>
                                <span className="font-bold text-white">Monthly</span>
                            </div>
                            <div className="flex justify-between items-center pb-3">
                                <span className="text-gray-400">Next Payment</span>
                                <span className="font-bold text-white">Oct 15, 2026</span>
                            </div>
                            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg transition-colors mt-2">
                                Upgrade Plan
                            </button>
                        </div>
                    </div>

                    {/* Security Settings */}
                    <div className="bg-[#151924] border border-[#2a2e39] rounded-xl p-6">
                        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            Security
                        </h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-[#2a2e39] pb-3">
                                <span className="text-gray-400">Password</span>
                                <button className="text-blue-400 hover:text-blue-300 text-sm font-bold">Change</button>
                            </div>
                            <div className="flex justify-between items-center border-b border-[#2a2e39] pb-3">
                                <span className="text-gray-400">Two-Factor Auth</span>
                                <button className="text-blue-400 hover:text-blue-300 text-sm font-bold">Enable</button>
                            </div>
                            <div className="flex justify-between items-center pb-3">
                                <span className="text-gray-400">Active Sessions</span>
                                <span className="font-bold text-white">1 Device</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
