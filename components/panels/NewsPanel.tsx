import React, { useState, useEffect } from 'react';
import { NewsEvent } from '../../types';

export const NewsPanel: React.FC = () => {
    const [news, setNews] = useState<NewsEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [dayFilter, setDayFilter] = useState<'All' | 'Today' | 'Tomorrow' | 'This Week'>('All');
    const [impactFilter, setImpactFilter] = useState<'All' | 'HIGH' | 'MEDIUM' | 'LOW'>('All');
    const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

    useEffect(() => {
        // Mocking an API call to a news service (e.g., ForexFactory, Investing.com API)
        const fetchNews = async () => {
            setLoading(true);
            try {
                // In a real app, this would be a fetch call to your backend
                // await fetch('/api/news')
                setTimeout(() => {
                    const now = new Date();
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const inTwoDays = new Date(today);
                    inTwoDays.setDate(inTwoDays.getDate() + 2);

                    const mockNews: NewsEvent[] = [
                        { id: '1', title: 'Core CPI m/m', time: new Date(now.getTime() - 3600000).toISOString(), currency: 'USD', impact: 'HIGH', actual: '0.3%', forecast: '0.2%', previous: '0.1%', betterIs: 'Higher' },
                        { id: '2', title: 'CPI m/m', time: new Date(now.getTime() - 3600000).toISOString(), currency: 'USD', impact: 'HIGH', actual: '0.4%', forecast: '0.3%', previous: '0.2%', betterIs: 'Higher' },
                        { id: '3', title: 'Unemployment Claims', time: new Date(tomorrow.getTime() + 36000000).toISOString(), currency: 'USD', impact: 'HIGH', forecast: '215K', previous: '210K', betterIs: 'Lower' },
                        { id: '4', title: 'ECB Press Conference', time: new Date(inTwoDays.getTime() + 43200000).toISOString(), currency: 'EUR', impact: 'HIGH', betterIs: 'Neutral' },
                        { id: '5', title: 'Retail Sales m/m', time: new Date(now.getTime() - 86400000).toISOString(), currency: 'GBP', impact: 'MEDIUM', actual: '0.1%', forecast: '0.3%', previous: '0.0%', betterIs: 'Higher' },
                        { id: '6', title: 'Fed Chair Powell Speaks', time: new Date(today.getTime() + 64800000).toISOString(), currency: 'USD', impact: 'HIGH', betterIs: 'Neutral' },
                        { id: '7', title: 'Building Permits', time: new Date(today.getTime() + 50400000).toISOString(), currency: 'USD', impact: 'LOW', forecast: '1.45M', previous: '1.43M', betterIs: 'Higher' },
                    ];
                    setNews(mockNews.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()));
                    setLoading(false);
                }, 1000);
            } catch (error) {
                console.error("Failed to fetch news", error);
                setLoading(false);
            }
        };

        fetchNews();
    }, []);

    const getImpactColor = (impact: string) => {
        switch (impact) {
            case 'HIGH': return 'bg-red-500';
            case 'MEDIUM': return 'bg-yellow-500';
            case 'LOW': return 'bg-gray-500';
            default: return 'bg-gray-500';
        }
    };

    const getExplanation = (event: NewsEvent) => {
        if (!event.actual || !event.forecast) {
            return `L'événement n'a pas encore eu lieu ou les données ne sont pas disponibles. Prévision : ${event.forecast || 'N/A'}.`;
        }

        const actualVal = parseFloat(event.actual.replace(/[^0-9.-]+/g, ""));
        const forecastVal = parseFloat(event.forecast.replace(/[^0-9.-]+/g, ""));

        if (isNaN(actualVal) || isNaN(forecastVal)) {
            return "Résultat publié, mais impossible de déterminer l'impact automatiquement.";
        }

        const diff = actualVal - forecastVal;
        
        if (diff === 0) {
            return `Le résultat est conforme aux attentes (${event.actual}). Impact neutre sur le ${event.currency}.`;
        }

        let isPositive = false;
        if (event.betterIs === 'Higher') {
            isPositive = diff > 0;
        } else if (event.betterIs === 'Lower') {
            isPositive = diff < 0;
        } else {
            return `Le résultat est de ${event.actual} (Prévision: ${event.forecast}). Impact incertain ou neutre.`;
        }

        if (isPositive) {
            return `Le résultat (${event.actual}) est meilleur que prévu (${event.forecast}). C'est généralement POSITIF (Bullish) pour le ${event.currency}.`;
        } else {
            return `Le résultat (${event.actual}) est pire que prévu (${event.forecast}). C'est généralement NÉGATIF (Bearish) pour le ${event.currency}.`;
        }
    };

    const filteredNews = news.filter(event => {
        // Impact Filter
        if (impactFilter !== 'All' && event.impact !== impactFilter) return false;

        // Day Filter
        const eventDate = new Date(event.time);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        if (dayFilter === 'Today') {
            return eventDate >= today && eventDate < new Date(today.getTime() + 86400000);
        } else if (dayFilter === 'Tomorrow') {
            const tomorrow = new Date(today.getTime() + 86400000);
            return eventDate >= tomorrow && eventDate < new Date(tomorrow.getTime() + 86400000);
        } else if (dayFilter === 'This Week') {
            // Assuming week starts on Monday
            const dayOfWeek = today.getDay() || 7; 
            const monday = new Date(today.getTime() - (dayOfWeek - 1) * 86400000);
            const nextMonday = new Date(monday.getTime() + 7 * 86400000);
            return eventDate >= monday && eventDate < nextMonday;
        }

        return true;
    });

    return (
        <div className="h-full bg-[#0b0e11] text-white p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-end mb-2">
                    <h2 className="text-2xl font-bold">Calendrier Économique</h2>
                    <div className="text-xs text-gray-500">Source: ForexFactory / Investing.com API (Simulé)</div>
                </div>
                <p className="text-gray-400 mb-6">Suivez les événements économiques majeurs et leur impact sur le marché.</p>

                <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">Jour:</span>
                        <select 
                            value={dayFilter} 
                            onChange={(e) => setDayFilter(e.target.value as any)}
                            className="bg-[#151924] border border-[#2a2e39] rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                        >
                            <option value="All">Tous</option>
                            <option value="Today">Aujourd'hui</option>
                            <option value="Tomorrow">Demain</option>
                            <option value="This Week">Cette Semaine</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">Impact:</span>
                        <select 
                            value={impactFilter} 
                            onChange={(e) => setImpactFilter(e.target.value as any)}
                            className="bg-[#151924] border border-[#2a2e39] rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                        >
                            <option value="All">Tous</option>
                            <option value="HIGH">High (Rouge)</option>
                            <option value="MEDIUM">Medium (Orange)</option>
                            <option value="LOW">Low (Gris)</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <div className="bg-[#151924] rounded-xl border border-[#2a2e39] overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#1a1f2e] border-b border-[#2a2e39] text-xs uppercase text-gray-400">
                                    <th className="p-4 font-bold">Heure</th>
                                    <th className="p-4 font-bold">Devise</th>
                                    <th className="p-4 font-bold">Impact</th>
                                    <th className="p-4 font-bold">Événement</th>
                                    <th className="p-4 font-bold">Actuel</th>
                                    <th className="p-4 font-bold">Prévu</th>
                                    <th className="p-4 font-bold">Précédent</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredNews.map(event => {
                                    const eventDate = new Date(event.time);
                                    const isPast = eventDate.getTime() < Date.now();
                                    const isExpanded = expandedEventId === event.id;
                                    
                                    let actualColor = '';
                                    if (event.actual && event.forecast && event.betterIs && event.betterIs !== 'Neutral') {
                                        const actualVal = parseFloat(event.actual.replace(/[^0-9.-]+/g, ""));
                                        const forecastVal = parseFloat(event.forecast.replace(/[^0-9.-]+/g, ""));
                                        if (!isNaN(actualVal) && !isNaN(forecastVal)) {
                                            const diff = actualVal - forecastVal;
                                            if (diff !== 0) {
                                                if (event.betterIs === 'Higher') {
                                                    actualColor = diff > 0 ? 'text-green-500' : 'text-red-500';
                                                } else {
                                                    actualColor = diff < 0 ? 'text-green-500' : 'text-red-500';
                                                }
                                            }
                                        }
                                    }

                                    return (
                                        <React.Fragment key={event.id}>
                                            <tr 
                                                onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                                                className={`border-b border-[#2a2e39] hover:bg-gray-800/30 transition-colors cursor-pointer ${isPast ? 'opacity-70' : ''} ${isExpanded ? 'bg-gray-800/20' : ''}`}
                                            >
                                                <td className="p-4 text-sm font-mono whitespace-nowrap">
                                                    {eventDate.toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="p-4 font-bold">{event.currency}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-3 h-3 rounded-full ${getImpactColor(event.impact)}`}></div>
                                                        <span className="text-xs font-bold text-gray-400">{event.impact}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 font-medium flex items-center gap-2">
                                                    {event.title}
                                                    <svg className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                </td>
                                                <td className={`p-4 font-mono text-sm font-bold ${actualColor}`}>
                                                    {event.actual || '-'}
                                                </td>
                                                <td className="p-4 font-mono text-sm text-gray-400">{event.forecast || '-'}</td>
                                                <td className="p-4 font-mono text-sm text-gray-400">{event.previous || '-'}</td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-[#0b0e11]/50 border-b border-[#2a2e39]">
                                                    <td colSpan={7} className="p-4">
                                                        <div className="flex gap-4 items-start">
                                                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-sm mb-1">Analyse de l'impact</h4>
                                                                <p className="text-sm text-gray-300">{getExplanation(event)}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filteredNews.length === 0 && (
                            <div className="p-8 text-center text-gray-500">Aucun événement ne correspond à vos filtres.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
