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
    );

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
                        <div className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Active (30d)</div>
                        <div className="text-3xl font-bold text-green-400">2</div>
                    </div>
                    <div className="bg-[#151924] border border-[#2a2e39] rounded-xl p-6">
                        <div className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Pro/Elite Plans</div>
                        <div className="text-3xl font-bold text-blue-400">2</div>
                    </div>
                    <div className="bg-[#151924] border border-[#2a2e39] rounded-xl p-6">
                        <div className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">MRR</div>
                        <div className="text-3xl font-bold text-yellow-400">$149</div>
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
                                    <th className="p-4 font-medium">Role</th>
                                    <th className="p-4 font-medium">Plan</th>
                                    <th className="p-4 font-medium">Joined</th>
                                    <th className="p-4 font-medium">Last Login</th>
                                    <th className="p-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2a2e39]">
                                {filteredUsers.map(u => (
                                    <tr key={u.uid || Math.random().toString()} className="hover:bg-[#1a1f2e] transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 font-bold border border-blue-500/30">
                                                    {(u.displayName || u.email || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white">{u.displayName || 'Unknown User'}</div>
                                                    <div className="text-sm text-gray-500">{u.email || 'No email'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                u.role === 'SUPER_ADMIN' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30' :
                                                u.role === 'OWNER' ? 'bg-purple-900/30 text-purple-400 border border-purple-500/30' :
                                                u.role === 'ADMIN' ? 'bg-red-900/30 text-red-400 border border-red-500/30' :
                                                'bg-gray-800 text-gray-300 border border-gray-700'
                                            }`}>
                                                {u.role || 'MEMBER'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                u.plan === 'ELITE' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30' :
                                                u.plan === 'PRO' ? 'bg-blue-900/30 text-blue-400 border border-blue-500/30' :
                                                'bg-gray-800 text-gray-300 border border-gray-700'
                                            }`}>
                                                {u.plan || 'FREE'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-400">
                                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="p-4 text-sm text-gray-400">
                                            {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button 
                                                onClick={() => setSelectedUser(u)}
                                                className="text-gray-400 hover:text-white p-2 transition-colors bg-[#2a2e39] rounded-lg text-sm font-bold px-4"
                                            >
                                                Manage Access
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
                                <p className="text-sm text-gray-400">{selectedUser.displayName} ({selectedUser.email})</p>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-white">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="mb-6">
                                <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">User Role</div>
                                <select 
                                    value={selectedUser.role || 'MEMBER'}
                                    onChange={(e) => changeRole(selectedUser.uid, e.target.value as UserProfile['role'])}
                                    className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded-lg p-3 text-white outline-none focus:border-blue-500"
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

                            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Feature Toggles</div>
                            
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
