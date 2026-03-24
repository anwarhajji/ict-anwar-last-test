import React, { useState, useEffect } from 'react';
import { DailyTask } from '../../types';
import { auth, db, handleFirestoreError, OperationType } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export const TasksPanel: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [tasks, setTasks] = useState<DailyTask[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskCategory, setNewTaskCategory] = useState<'PRE_MARKET' | 'POST_MARKET' | 'REVIEW'>('PRE_MARKET');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!user) return;
        
        const fetchTasks = async () => {
            try {
                const docRef = doc(db, `users/${user.uid}/data/tasks`);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    const data = snap.data();
                    if (data.tasks) {
                        setTasks(data.tasks);
                    }
                }
            } catch (error) {
                console.error("Error fetching tasks:", error);
            } finally {
                setIsLoaded(true);
            }
        };
        fetchTasks();
    }, [user]);

    useEffect(() => {
        if (!isLoaded || !user) return;
        
        const saveTasks = async () => {
            try {
                const docRef = doc(db, `users/${user.uid}/data/tasks`);
                await setDoc(docRef, { tasks }, { merge: true });
            } catch (error) {
                handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/data/tasks`);
            }
        };
        
        const timeoutId = setTimeout(() => {
            saveTasks();
        }, 1000);
        
        return () => clearTimeout(timeoutId);
    }, [tasks, isLoaded, user]);

    const handleAddTask = () => {
        if (!newTaskTitle.trim()) return;
        const newTask: DailyTask = {
            id: Date.now().toString(),
            title: newTaskTitle,
            completed: false,
            category: newTaskCategory,
            date: new Date().toISOString().split('T')[0]
        };
        setTasks([...tasks, newTask]);
        setNewTaskTitle('');
    };

    const toggleTask = (id: string) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const deleteTask = (id: string) => {
        setTasks(tasks.filter(t => t.id !== id));
    };

    const today = new Date().toISOString().split('T')[0];
    const todaysTasks = tasks.filter(t => t.date === today);

    const renderCategory = (category: 'PRE_MARKET' | 'POST_MARKET' | 'REVIEW', title: string) => {
        const catTasks = todaysTasks.filter(t => t.category === category);
        return (
            <div className="mb-8">
                <h3 className="text-lg font-bold text-white mb-4 border-b border-[#2a2e39] pb-2">{title}</h3>
                {catTasks.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">No tasks in this category.</p>
                ) : (
                    <div className="space-y-2">
                        {catTasks.map(task => (
                            <div key={task.id} className="flex items-center justify-between bg-[#151924] p-3 rounded border border-[#2a2e39]">
                                <label className="flex items-center gap-3 cursor-pointer flex-1">
                                    <input 
                                        type="checkbox" 
                                        checked={task.completed} 
                                        onChange={() => toggleTask(task.id)}
                                        className="w-5 h-5 accent-blue-500 rounded border-gray-600"
                                    />
                                    <span className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                                        {task.title}
                                    </span>
                                </label>
                                <button onClick={() => deleteTask(task.id)} className="text-gray-500 hover:text-red-500">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-full bg-[#0b0e11] text-white p-6 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
                <h2 className="text-2xl font-bold mb-2">Daily Trading Checklist</h2>
                <p className="text-gray-400 mb-8">Maintain discipline by completing your daily routines.</p>

                {/* Add Task Form */}
                <div className="bg-[#151924] p-4 rounded-xl border border-[#2a2e39] mb-8 flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">New Task</label>
                        <input 
                            type="text" 
                            value={newTaskTitle}
                            onChange={e => setNewTaskTitle(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                            placeholder="e.g. Check Economic Calendar"
                            className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded p-2 text-white focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div className="w-48">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                        <select 
                            value={newTaskCategory}
                            onChange={e => setNewTaskCategory(e.target.value as any)}
                            className="w-full bg-[#0b0e11] border border-[#2a2e39] rounded p-2 text-white focus:border-blue-500 outline-none"
                        >
                            <option value="PRE_MARKET">Pre-Market</option>
                            <option value="POST_MARKET">Post-Market</option>
                            <option value="REVIEW">Review / Journaling</option>
                        </select>
                    </div>
                    <button 
                        onClick={handleAddTask}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded transition-colors"
                    >
                        Add Task
                    </button>
                </div>

                {/* Task Lists */}
                {renderCategory('PRE_MARKET', 'Pre-Market Routine')}
                {renderCategory('POST_MARKET', 'Post-Market Routine')}
                {renderCategory('REVIEW', 'End of Day Review')}

            </div>
        </div>
    );
};
