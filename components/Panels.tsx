
import React from 'react';
import { AppConfig, BacktestStats, ColorTheme, EntrySignal, OrderBlock, OverlayState, StructurePoint, TradeEntry, SimulationConfig, DraftTrade } from '../types';
import { ScannerPanel } from './panels/ScannerPanel';
import { TradingPanel } from './panels/TradingPanel';
import { SetupsPanel } from './panels/SetupsPanel';
import { SettingsPanel } from './panels/SettingsPanel';

interface PanelProps {
    activeTab: string;
    setActiveTab: (t: string) => void;
    structure: StructurePoint[];
    entries: EntrySignal[];
    setClickedEntry: (e: EntrySignal) => void;
    balance: number;
    positions: TradeEntry[];
    data: any[];
    closeTrade: (id: string, pnl: number) => void;
    enterTrade: (type: 'LONG' | 'SHORT', price: number, sl: number, tp: number, lotSize: number) => void;
    slInput: string; setSlInput: (s: string) => void;
    tpInput: string; setTpInput: (s: string) => void;
    autoTrade: boolean; setAutoTrade: (b: boolean) => void;
    settingsTab: string; setSettingsTab: (t: string) => void;
    config: AppConfig; setConfig: (c: AppConfig) => void;
    overlays: OverlayState; setOverlays: (o: OverlayState) => void;
    colors: ColorTheme; setColors: (c: ColorTheme) => void;
    backtestStats: BacktestStats | null;
    recentHistory: EntrySignal[];
    obs: OrderBlock[];
    simulation: SimulationConfig;
    setSimulation: React.Dispatch<React.SetStateAction<SimulationConfig>>;
    onDeepScan: () => void;
    isScanning: boolean;
    onFocusEntry?: (e: EntrySignal) => void;
    focusedEntry?: EntrySignal | null;
    onReplay?: (e: EntrySignal) => void;
    onViewOnChart?: (e: EntrySignal) => void;
    currentAsset?: string;
    resetAccount?: () => void;
    
    // Draft Trade Props (Optional for other panels, needed for Trading)
    draftTrade?: DraftTrade | null;
    onStartDraft?: (type: 'LONG' | 'SHORT') => void;
    onCancelDraft?: () => void;
    onExecuteDraft?: () => void;
    onUpdateDraft?: (u: Partial<DraftTrade>) => void;
}

export const Panels: React.FC<PanelProps> = (props) => {
    // If on main page tabs, show nothing in the panel container
    // Removed 'TRADING' from this list so the TradingPanel can render in the custom layout
    if (['CHART', 'DASHBOARD', 'BACKTEST', 'STATS', 'SETUPS'].includes(props.activeTab) || !props.activeTab) return null;

    const commonProps = { onClose: () => props.setActiveTab('CHART') };

    switch (props.activeTab) {
        case 'SCANNER':
            return <ScannerPanel 
                structure={props.structure} 
                entries={props.entries} 
                setClickedEntry={props.setClickedEntry} 
                onDeepScan={props.onDeepScan} 
                isScanning={props.isScanning} 
                onFocusEntry={props.onFocusEntry}
                focusedEntry={props.focusedEntry}
                onReplay={props.onReplay}
                currentAsset={props.currentAsset}
                {...commonProps}
            />;
        case 'TRADING':
            return <TradingPanel 
                balance={props.balance} 
                positions={props.positions} 
                data={props.data} 
                closeTrade={props.closeTrade} 
                enterTrade={props.enterTrade} 
                slInput={props.slInput} setSlInput={props.setSlInput} 
                tpInput={props.tpInput} setTpInput={props.setTpInput} 
                autoTrade={props.autoTrade} setAutoTrade={props.setAutoTrade} 
                resetAccount={props.resetAccount}
                // Draft
                draftTrade={props.draftTrade}
                onStartDraft={props.onStartDraft}
                onCancelDraft={props.onCancelDraft}
                onExecuteDraft={props.onExecuteDraft}
                onUpdateDraft={props.onUpdateDraft}
                {...commonProps}
            />;
        case 'SETUPS': 
            return <SetupsPanel 
                entries={props.entries} 
                setClickedEntry={props.setClickedEntry} 
                overlays={props.overlays}
                setOverlays={props.setOverlays}
                onViewOnChart={props.onViewOnChart || (() => {})}
                {...commonProps}
            />;
        case 'SETTINGS':
            return <SettingsPanel 
                settingsTab={props.settingsTab} setSettingsTab={props.setSettingsTab} 
                config={props.config} setConfig={props.setConfig} 
                overlays={props.overlays} setOverlays={props.setOverlays} 
                colors={props.colors} setColors={props.setColors} 
                simulation={props.simulation} setSimulation={props.setSimulation} 
                {...commonProps}
            />;
        default:
            return null;
    }
};
