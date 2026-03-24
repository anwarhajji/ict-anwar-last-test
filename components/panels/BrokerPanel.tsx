import React, { useState } from 'react';
import { TradeEntry, BrokerConnection } from '../../types';

interface BrokerPanelProps {
    onImportTrades: (trades: TradeEntry[]) => void;
}

export const BrokerPanel: React.FC<BrokerPanelProps> = ({ onImportTrades }) => {
    const [connections, setConnections] = useState<BrokerConnection[]>([
        { id: '1', brokerName: 'Tradovate', accountName: 'Demo-12345', status: 'DISCONNECTED' },
        { id: '2', brokerName: 'NinjaTrader', accountName: 'Live-98765', status: 'DISCONNECTED' }
    ]);
    const [isConnecting, setIsConnecting] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState('');
    const [apiSecret, setApiSecret] = useState('');

    const handleConnect = (id: string) => {
        setIsConnecting(id);
        setTimeout(() => {
            setConnections(connections.map(c => c.id === id ? { ...c, status: 'CONNECTED', lastSync: new Date().toISOString() } : c));
            setIsConnecting(null);
            setApiKey('');
            setApiSecret('');
        }, 1500);
    };

    const handleDisconnect = (id: string) => {
        setConnections(connections.map(c => c.id === id ? { ...c, status: 'DISCONNECTED', lastSync: undefined } : c));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const csv = event.target?.result as string;
            const lines = csv.split('\n');
            const newTrades: TradeEntry[] = [];

            // Skip header
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                const parts = line.split(',');
                if (parts.length >= 3) {
                    const [timeStr, type, price, sl, tp, lotSize, pnl] = parts;
                    const pnlValue = parseFloat(pnl) || 0;
                    const isLong = type.toUpperCase().includes('LONG') || type.toUpperCase().includes('BUY');
                    
                    newTrades.push({
                        id: `import-${Date.now()}-${i}`,
                        time: (new Date(timeStr || Date.now()).getTime() / 1000) as any,
                        type: isLong ? 'LONG' : 'SHORT',
                        price: parseFloat(price) || 0,
                        stopLoss: parseFloat(sl) || 0,
                        takeProfit: parseFloat(tp) || 0,
                        lotSize: parseFloat(lotSize) || 1,
                        pnl: pnlValue,
                        result: pnlValue > 0 ? 'WIN' : pnlValue < 0 ? 'LOSS' : 'OPEN',
                        confluences: [],
                        score: 0,
                        tags: ['Imported CSV']
                    });
                }
            }
            if (newTrades.length > 0) {
                onImportTrades(newTrades);
                alert(`Successfully imported ${newTrades.length} trades!`);
            } else {
                alert('No valid trades found in CSV.');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="h-full bg-[#0b0e11] text-white p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h2 className="text-2xl font-bold mb-2">Broker Synchronization</h2>
                    <p className="text-gray-400">Connect your brokerage accounts via API or import trades manually via CSV.</p>
                </div>

                {/* API Connections */}
                <div className="bg-[#151924] p-6 rounded-xl border border-[#2a2e39]">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11M8 14v3m4-3v3m4-3v3"/></svg>
                        API Connections
                    </h3>
                    
                    <div className="space-y-4">
                        {connections.map(conn => (
                            <div key={conn.id} className="border border-[#2a2e39] rounded-lg p-4 bg-[#0b0e11]">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h4 className="font-bold text-lg">{conn.brokerName}</h4>
                                        <p className="text-sm text-gray-400">Account: {conn.accountName}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${conn.status === 'CONNECTED' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        <span className="text-sm font-bold text-gray-300">{conn.status}</span>
                                    </div>
                                </div>

                                {conn.status === 'DISCONNECTED' ? (
                                    <div className="space-y-3 mt-4 pt-4 border-t border-[#2a2e39]">
                                        <input 
                                            type="text" 
                                            placeholder="API Key" 
                                            value={apiKey}
                                            onChange={e => setApiKey(e.target.value)}
                                            className="w-full bg-[#151924] border border-[#2a2e39] rounded p-2 text-white focus:border-blue-500 outline-none"
                                        />
                                        <input 
                                            type="password" 
                                            placeholder="API Secret" 
                                            value={apiSecret}
                                            onChange={e => setApiSecret(e.target.value)}
                                            className="w-full bg-[#151924] border border-[#2a2e39] rounded p-2 text-white focus:border-blue-500 outline-none"
                                        />
                                        <button 
                                            onClick={() => handleConnect(conn.id)}
                                            disabled={isConnecting === conn.id || !apiKey || !apiSecret}
                                            className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors w-full flex justify-center items-center"
                                        >
                                            {isConnecting === conn.id ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Connect & Sync'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="mt-4 pt-4 border-t border-[#2a2e39] flex justify-between items-center">
                                        <span className="text-sm text-gray-400">Last synced: {conn.lastSync ? new Date(conn.lastSync).toLocaleString() : 'Never'}</span>
                                        <button 
                                            onClick={() => handleDisconnect(conn.id)}
                                            className="text-red-500 hover:text-red-400 text-sm font-bold"
                                        >
                                            Disconnect
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* CSV Import */}
                <div className="bg-[#151924] p-6 rounded-xl border border-[#2a2e39]">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                        Manual CSV Import
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                        Upload a CSV file exported from your broker. Expected format:<br/>
                        <code className="bg-[#0b0e11] p-1 rounded text-blue-400 mt-2 block">Time, Type (LONG/SHORT), Price, StopLoss, TakeProfit, LotSize, PnL</code>
                    </p>
                    
                    <div className="border-2 border-dashed border-[#2a2e39] rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer relative">
                        <input 
                            type="file" 
                            accept=".csv" 
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-500 mb-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        <p className="text-white font-bold">Click or drag CSV file to upload</p>
                        <p className="text-sm text-gray-500 mt-1">Supports Tradovate, NinjaTrader, and MetaTrader exports</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
