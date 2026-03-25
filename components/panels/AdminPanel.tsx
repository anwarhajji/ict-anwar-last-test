import React, { useState, useEffect } from 'react';
import { UserProfile, UserFeatures } from '../../types';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';

export const AdminPanel: React.FC<{ userProfile: UserProfile | null }> = ({ userProfile }) => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [showEmails, setShowEmails] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersRef = collection(db, 'users');
                const snapshot = await getDocs(usersRef);
                const fetchedUsers: UserProfile[] = [];
                snapshot.forEach(doc => {
                    fetchedUsers.push({ ...doc.data(), uid: doc.id } as UserProfile);
                });
                setUsers(fetchedUsers);
            } catch (err: any) {
                console.error("Error fetching users:", err);
                setError(err.message || "Failed to load users. You may not have permission.");
                try {
                    handleFirestoreError(err, OperationType.GET, 'users');
                } catch (e) {} // Catch the thrown error from handleFirestoreError
            } finally {
                setIsLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(u => 
        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (u.displayName || '').toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
        // Sort pending users to the top
        if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
        if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
        return 0;
    });

    const toggleFeature = async (uid: string, feature: keyof UserFeatures) => {
        const userToUpdate = users.find(u => u.uid === uid);
        if (!userToUpdate) return;

        const currentFeatures = userToUpdate.features || { bots: false, backtesting: false, news: false, tasks: false, analytics: false };
        const updatedFeatures = {
            ...currentFeatures,
            [feature]: !currentFeatures[feature]
        };

        // Optimistic update
        setUsers(users.map(u => u.uid === uid ? { ...u, features: updatedFeatures } : u));
        if (selectedUser && selectedUser.uid === uid) {
            setSelectedUser({ ...selectedUser, features: updatedFeatures });
        }

        // Update in Firestore
        try {
            const userRef = doc(db, `users/${uid}`);
            await updateDoc(userRef, { features: updatedFeatures });
        } catch (error) {
            // Revert on error
            setUsers(users.map(u => u.uid === uid ? { ...u, features: currentFeatures } : u));
            if (selectedUser && selectedUser.uid === uid) {
                setSelectedUser({ ...selectedUser, features: currentFeatures });
            }
            handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
        }
    };

    const changeRole = async (uid: string, newRole: UserProfile['role']) => {
        const userToUpdate = users.find(u => u.uid === uid);
        if (!userToUpdate) return;

        const oldRole = userToUpdate.role;

        // Optimistic update
        setUsers(users.map(u => u.uid === uid ? { ...u, role: newRole } : u));
        if (selectedUser && selectedUser.uid === uid) {
            setSelectedUser({ ...selectedUser, role: newRole });
        }

        // Update in Firestore
        try {
            const userRef = doc(db, `users/${uid}`);
            await updateDoc(userRef, { role: newRole });
        } catch (error) {
            // Revert on error
            setUsers(users.map(u => u.uid === uid ? { ...u, role: oldRole } : u));
            if (selectedUser && selectedUser.uid === uid) {
                setSelectedUser({ ...selectedUser, role: oldRole });
            }
            handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
        }
    };

    const changeTier = async (uid: string, newTier: UserProfile['tier']) => {
        const userToUpdate = users.find(u => u.uid === uid);
        if (!userToUpdate) return;

        const oldTier = userToUpdate.tier;

        setUsers(users.map(u => u.uid === uid ? { ...u, tier: newTier } : u));
        if (selectedUser && selectedUser.uid === uid) {
            setSelectedUser({ ...selectedUser, tier: newTier });
        }

        try {
            const userRef = doc(db, `users/${uid}`);
            await updateDoc(userRef, { tier: newTier });
        } catch (error) {
            setUsers(users.map(u => u.uid === uid ? { ...u, tier: oldTier } : u));
            if (selectedUser && selectedUser.uid === uid) {
                setSelectedUser({ ...selectedUser, tier: oldTier });
            }
            handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
        }
    };

    const approveUser = async (uid: string) => {
        const userToUpdate = users.find(u => u.uid === uid);
        if (!userToUpdate) return;

        const newTier = userToUpdate.requestedTier || 'NORMAL';
        
        setUsers(users.map(u => u.uid === uid ? { ...u, status: 'ACTIVE', tier: newTier } : u));
        if (selectedUser && selectedUser.uid === uid) {
            setSelectedUser({ ...selectedUser, status: 'ACTIVE', tier: newTier });
        }

        try {
            const userRef = doc(db, `users/${uid}`);
            await updateDoc(userRef, { 
                status: 'ACTIVE', 
                tier: newTier 
            });
        } catch (error) {
            setUsers(users.map(u => u.uid === uid ? { ...u, status: userToUpdate.status, tier: userToUpdate.tier } : u));
            handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
        }
    };

    const suspendUser = async (uid: string) => {
        const userToUpdate = users.find(u => u.uid === uid);
        if (!userToUpdate) return;

        const oldStatus = userToUpdate.status;
        const newStatus = oldStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';

        setUsers(users.map(u => u.uid === uid ? { ...u, status: newStatus } : u));
        if (selectedUser && selectedUser.uid === uid) {
            setSelectedUser({ ...selectedUser, status: newStatus });
        }

        try {
            const userRef = doc(db, `users/${uid}`);
            await updateDoc(userRef, { status: newStatus });
        } catch (error) {
            setUsers(users.map(u => u.uid === uid ? { ...u, status: oldStatus } : u));
            handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
        }
    };

    const isOnline = (lastActive?: number) => {
        if (!lastActive) return false;
        return (Date.now() - lastActive) < 180000; // 3 minutes
    };

    const isAway = (lastActive?: number) => {
        if (!lastActive) return false;
        const diff = Date.now() - lastActive;
        return diff >= 180000 && diff < 900000; // 3-15 minutes
    };

    if (isLoading) {
        return <div className="h-full bg-[#0b0e11] text-white p-6 flex items-center justify-center">Loading users...</div>;
    }

    if (error) {
        return (
            <div className="h-full bg-[#0b0e11] text-white p-6 flex flex-col items-center justify-center">
                <div className="bg-red-900/30 border border-red-500/50 text-red-400 p-6 rounded-xl max-w-md text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    <h3 className="text-xl font-bold mb-2">Access Denied</h3>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-[#0b0e11] text-white p-6 overflow-y-auto">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">Admin Dashboard</h2>
                        <p className="text-gray-400">Manage users, workspaces, and platform settings.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-[#151924] border border-[#2a2e39] rounded-lg px-4 py-2 flex items-center gap-2">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            <input 
                                type="text" 
                                placeholder="Search users..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="bg-transparent border-none outline-none text-white w-48"
                            />
                        </div>
                        <button 
                            onClick={() => setShowEmails(!showEmails)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${showEmails ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-[#151924] border-[#2a2e39] text-gray-400'}`}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            {showEmails ? 'Hide Emails' : 'Show Emails'}
                        </button>
                        <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-[#151924] border border-[#2a2e39] rounded-xl p-6">
                        <div className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Total Users</div>
                        <div className="text-3xl font-bold text-white">{users.length}</div>
                    </div>
                    <div className="bg-[#151924] border border-[#2a2e39] rounded-xl p-6">
                        <div className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Online Now</div>
                        <div className="text-3xl font-bold text-green-400">{users.filter(u => isOnline(u.lastActive)).length}</div>
                    </div>
                    <div className="bg-[#151924] border border-[#2a2e39] rounded-xl p-6">
                        <div className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Pending Requests</div>
                        <div className="text-3xl font-bold text-yellow-400">{users.filter(u => u.status === 'PENDING').length}</div>
                    </div>
                    <div className="bg-[#151924] border border-[#2a2e39] rounded-xl p-6">
                        <div className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">VIP/VVIP Tiers</div>
                        <div className="text-3xl font-bold text-purple-400">{users.filter(u => u.tier === 'VIP' || u.tier === 'VVIP').length}</div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-[#151924] border border-[#2a2e39] rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-[#2a2e39]">
                        <h3 className="text-lg font-bold text-white">User Management</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#0b0e11] text-gray-400 text-sm uppercase tracking-wider">
                                    <th className="p-4 font-medium">User</th>
                                    {showEmails && <th className="p-4 font-medium">Email</th>}
                                    <th className="p-4 font-medium">Status</th>
                                    <th className="p-4 font-medium">Tier</th>
                                    <th className="p-4 font-medium">Role</th>
                                    <th className="p-4 font-medium">Last Active</th>
                                    <th className="p-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2a2e39]">
                                {filteredUsers.map(u => (
                                    <tr key={u.uid || Math.random().toString()} className="hover:bg-[#1a1f2e] transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className="w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 font-bold border border-blue-500/30">
                                                        {(u.firstName || u.displayName || u.email || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#151924] ${
                                                        isOnline(u.lastActive) ? 'bg-green-500' : 
                                                        isAway(u.lastActive) ? 'bg-yellow-500' : 'bg-gray-600'
                                                    }`} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white">
                                                        {u.firstName || u.lastName ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : (u.displayName || 'Unknown User')}
                                                    </div>
                                                    {!showEmails && <div className="text-xs text-gray-500">{u.email}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        {showEmails && (
                                            <td className="p-4 text-sm text-gray-400">
                                                {u.email || 'No email'}
                                            </td>
                                        )}
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                                u.status === 'ACTIVE' ? 'bg-green-900/30 text-green-400 border border-green-500/30' :
                                                u.status === 'SUSPENDED' ? 'bg-red-900/30 text-red-400 border border-red-500/30' :
                                                'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30 animate-pulse'
                                            }`}>
                                                {u.status || 'PENDING'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase w-fit ${
                                                    u.tier === 'VVIP' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30' :
                                                    u.tier === 'VIP' ? 'bg-purple-900/30 text-purple-400 border border-purple-500/30' :
                                                    u.tier === 'NORMAL' ? 'bg-blue-900/30 text-blue-400 border border-blue-500/30' :
                                                    'bg-gray-800 text-gray-300 border border-gray-700'
                                                }`}>
                                                    {u.tier || 'FREE'}
                                                </span>
                                                {u.status === 'PENDING' && u.requestedTier && (
                                                    <span className="text-[9px] text-gray-500 italic">Req: {u.requestedTier}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                                u.role === 'SUPER_ADMIN' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30' :
                                                u.role === 'OWNER' ? 'bg-purple-900/30 text-purple-400 border border-purple-500/30' :
                                                u.role === 'ADMIN' ? 'bg-red-900/30 text-red-400 border border-red-500/30' :
                                                'bg-gray-800 text-gray-300 border border-gray-700'
                                            }`}>
                                                {u.role || 'MEMBER'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-400">
                                            {u.lastActive ? new Date(u.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                                        </td>
                                        <td className="p-4 text-right space-x-2">
                                            {u.status === 'PENDING' && (
                                                <button 
                                                    onClick={() => approveUser(u.uid)}
                                                    className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-lg text-xs font-bold px-3 transition-colors"
                                                >
                                                    Approve
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => setSelectedUser(u)}
                                                className="text-gray-400 hover:text-white p-2 transition-colors bg-[#2a2e39] rounded-lg text-xs font-bold px-3"
                                            >
                                                Manage
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Manage Access Modal */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#151924] border border-[#2a2e39] rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-[#2a2e39] flex justify-between items-center bg-[#0b0e11]">
                            <div>
                                <h3 className="text-xl font-bold text-white">Manage Access</h3>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm text-gray-400">{selectedUser.displayName} ({selectedUser.email})</p>
                                    <button 
                                        onClick={() => {
                                            if (selectedUser.email) {
                                                navigator.clipboard.writeText(selectedUser.email);
                                                // Optional: show a small toast or change icon
                                            }
                                        }}
                                        className="text-gray-500 hover:text-blue-400 transition-colors"
                                        title="Copy Email"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                    </button>
                                </div>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-white">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Tier</div>
                                    <select 
                                        value={selectedUser.tier || 'FREE'}
                                        onChange={(e) => changeTier(selectedUser.uid, e.target.value as UserProfile['tier'])}
                                        className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded-lg p-3 text-white outline-none focus:border-blue-500 text-sm"
                                    >
                                        <option value="FREE">Free</option>
                                        <option value="NORMAL">Normal</option>
                                        <option value="VIP">VIP</option>
                                        <option value="VVIP">VVIP</option>
                                    </select>
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Role</div>
                                    <select 
                                        value={selectedUser.role || 'MEMBER'}
                                        onChange={(e) => changeRole(selectedUser.uid, e.target.value as UserProfile['role'])}
                                        className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded-lg p-3 text-white outline-none focus:border-blue-500 text-sm"
                                        disabled={
                                            (selectedUser.role === 'SUPER_ADMIN' && userProfile?.role !== 'SUPER_ADMIN') ||
                                            (selectedUser.role === 'OWNER' && userProfile?.role !== 'SUPER_ADMIN' && userProfile?.role !== 'OWNER')
                                        }
                                    >
                                        <option value="VIEWER">Viewer</option>
                                        <option value="MEMBER">Member</option>
                                        <option value="ADMIN">Admin</option>
                                        {(userProfile?.role === 'SUPER_ADMIN' || userProfile?.role === 'OWNER' || selectedUser.role === 'OWNER') && <option value="OWNER">Owner</option>}
                                        {(userProfile?.role === 'SUPER_ADMIN' || selectedUser.role === 'SUPER_ADMIN') && <option value="SUPER_ADMIN">Super Admin</option>}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button 
                                    onClick={() => suspendUser(selectedUser.uid)}
                                    className={`flex-1 py-2 rounded-lg font-bold text-xs transition-colors ${
                                        selectedUser.status === 'SUSPENDED' ? 'bg-green-600/20 text-green-400 border border-green-500/50' : 'bg-red-600/20 text-red-400 border border-red-500/50'
                                    }`}
                                >
                                    {selectedUser.status === 'SUSPENDED' ? 'Unsuspend User' : 'Suspend User'}
                                </button>
                                {selectedUser.status === 'PENDING' && (
                                    <button 
                                        onClick={() => approveUser(selectedUser.uid)}
                                        className="flex-1 py-2 rounded-lg font-bold text-xs bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                                    >
                                        Approve Request
                                    </button>
                                )}
                            </div>

                            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mt-6 mb-4">Feature Overrides</div>
                            
                            {[
                                { key: 'bots', label: 'Algorithmic Trading (Bots)', desc: 'Allow user to create and run trading bots.' },
                                { key: 'backtesting', label: 'Backtesting Engine', desc: 'Allow user to backtest strategies on historical data.' },
                                { key: 'news', label: 'News & Calendar', desc: 'Access to economic calendar and news feeds.' },
                                { key: 'tasks', label: 'Daily Tasks', desc: 'Access to the daily trading checklist.' },
                                { key: 'analytics', label: 'Advanced Analytics', desc: 'Access to detailed performance statistics.' }
                            ].map(feature => {
                                const isEnabled = selectedUser.features?.[feature.key as keyof UserFeatures] || false;
                                return (
                                    <div key={feature.key} className="flex items-center justify-between p-3 bg-[#0b0e11] rounded-lg border border-[#2a2e39]">
                                        <div>
                                            <div className="font-bold text-white">{feature.label}</div>
                                            <div className="text-xs text-gray-500">{feature.desc}</div>
                                        </div>
                                        <button 
                                            onClick={() => toggleFeature(selectedUser.uid, feature.key as keyof UserFeatures)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isEnabled ? 'bg-blue-600' : 'bg-gray-600'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                );
                            })}
                            
                            <div className="pt-6 mt-6 border-t border-[#2a2e39] flex justify-end">
                                <button 
                                    onClick={() => setSelectedUser(null)}
                                    className="px-6 py-2 rounded-lg font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
