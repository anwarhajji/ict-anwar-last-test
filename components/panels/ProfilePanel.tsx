import React from 'react';
import { UserProfile } from '../../types';
import { User } from 'firebase/auth';

interface ProfilePanelProps {
    user: User | null;
    userProfile: UserProfile | null;
    onLogout: () => void;
}

export const ProfilePanel: React.FC<ProfilePanelProps> = ({ user, userProfile, onLogout }) => {
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
                        <div>
                            <h3 className="text-3xl font-bold text-white">{profile.displayName}</h3>
                            <p className="text-gray-400">{profile.email}</p>
                        </div>
                        
                        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                            <span className="bg-blue-900/30 text-blue-400 px-3 py-1 rounded-full text-sm font-bold border border-blue-500/30">
                                {profile.plan} PLAN
                            </span>
                            <span className="bg-purple-900/30 text-purple-400 px-3 py-1 rounded-full text-sm font-bold border border-purple-500/30">
                                {profile.role}
                            </span>
                        </div>
                        
                        <div className="pt-4 border-t border-[#2a2e39] flex flex-col sm:flex-row gap-4">
                            <button className="bg-[#2a2e39] hover:bg-[#3a3f4c] text-white font-bold py-2 px-6 rounded-lg transition-colors">
                                Edit Profile
                            </button>
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
