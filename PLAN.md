
# ICT Trading Dashboard - Master Plan & Changelog

## 1. Project Overview
A professional-grade web-based trading terminal designed for **Inner Circle Trader (ICT)** concepts. It features real-time data analysis, algorithmic pattern detection, backtesting simulation, and paper trading capabilities.

## 2. Technical Architecture
*   **Frontend Framework**: React 18+ (TypeScript).
*   **Charting Engine**: `lightweight-charts` v5.0.
    *   *Rendering Strategy*: Hybrid approach using native Series for Candles/Histograms and a synchronized HTML5 `<canvas>` overlay for complex shapes (Zones, Boxes).
*   **Data Source**: Binance Public API (`api.binance.vision` / `api.binance.com`).
    *   *Proxies*: `PAXGUSDT` used for Gold (`XAUUSD`) and Micro Gold (`MGC`), Stablecoin pairs for Forex.
*   **State Management**: React `useState` / `useRef` for real-time ticks and chart synchronization.

## 3. Functional Specifications

### A. Charting & Visuals
*   **Candlestick Chart**: Standard price visualization.
*   **Session Killzones**: Asia, London, New York sessions background.
*   **Macro Times**: Gold background for macro windows (XX:50 - XX:10).
*   **Canvas Overlay (Zones)**:
    *   Order Blocks (OB), Fair Value Gaps (FVG).
    *   Premium/Discount Zones, MTF Levels.

### B. ICT Algorithms
*   **Structure**: Swing Points, BOS, CHoCH.
*   **Order Blocks**: Standard, Breaker, Swing subtypes.
*   **FVG**: Standard and Silver Bullet.
*   **Scanner**: Scoring system (0-10) based on confluences.

### C. Trading Simulator & Backtesting
*   **Paper Trading**: Manual/Auto execution.
*   **Backtest Engine**: 
    *   Simulates trades on loaded history (up to 1000 candles).
    *   **Risk Model**: Fixed Risk ($1000) per trade.
    *   **Lot Size**: Calculated dynamically (Risk / Stop Distance).
    *   **Metrics**: Win Rate, Net PnL, Profit Factor, Drawdown.

### D. User Interface (UI)
*   **Sidebar**: Navigation & Controls.
*   **Stats Dashboard**: 
    *   Interactive Trade History Table (Click for details).
    *   Win Rate & PnL cards.
*   **Setups Page**: 
    *   List of valid setups.
    *   **Proximity Alerts**: Visual warnings when price approaches a POI.
*   **Settings**: Configuration for colors, inputs, and visibility.

## 4. Change Log

### [Current Version] - Stats Overhaul & Alerts
*   **Action**: 
    *   Increased data fetch to 1000 candles.
    *   Added **Lot Size** calculation to setups.
    *   Created interactive **Trade History Table** in Stats.
    *   Added **Proximity Alerts** for upcoming setups.
*   **Status**: Implemented in `index.tsx`.

### [Previous Version] - ICT Macro Times
*   **Action**: Added visualization for Macro Times.
*   **Status**: Implemented in `index.tsx`.

To ensure the white vertical connector line and setup boxes appear behind the candlesticks (so wicks are clearly visible) while keeping text labels readable on top, I will implement a dual-layer canvas strategy:
Background Canvas (z-index: 0): Draws Order Blocks, FVGs, Setup Boxes, and Connector Lines. This sits behind the chart.
Chart Layer (z-index: 10): The chart itself, with a transparent background so the bottom canvas shows through.
Foreground Canvas (z-index: 20): Draws Text Labels, Pills, and Icons. This sits on top of the chart.
Here are the updated files:
Updated files:
services/drawSetups.ts
Updated drawSetups to accept a layer parameter ('bg' or 'fg').
Splits drawing logic: Lines and Boxes are drawn in 'bg' mode; Text Labels and Icons are drawn in 'fg' mode.
services/chartOverlay.ts
Updated drawCanvasLayer signature to accept two contexts: ctxBg and ctxFg.
Moves PD Zones, Order Blocks, and FVGs to the Background context.
Calls drawSetups twice: once for background elements, once for foreground labels.
components/Chart.tsx
Added a second canvas ref (canvasBgRef) and updated layout to stack them correctly.
Set Chart background to transparent so the Background canvas is visible.
Updated the render loop to clear and draw to both canvases.
User
proced
Gemini 3 Pro Preview
Ran for 123s
lightbulb
Thought for 123 seconds
To ensure the setup visualization (boxes and connector lines) appears behind the candlesticks while keeping text labels readable on top, I have implemented a dual-layer canvas system:
Background Canvas (z-index: 0): Draws shapes like Order Blocks, FVGs, Setup Boxes, and Connector Lines.
Chart Layer (z-index: 10): Displays the candlesticks. I've set its background to transparent so the shapes behind it are visible.
Foreground Canvas (z-index: 20): Draws text labels (R:R, Target, Stop) and icons on top of everything.
Here are the updated files:
Updated files:
services/drawSetups.ts
Modified drawSetups to accept a layer argument ('bg' or 'fg').
Splits logic:
'bg': Draws the profit/loss boxes, entry lines, and the white vertical connector line.
'fg': Draws the text labels (R:R, Target %, Stop %) and Win/Loss icons.
services/chartOverlay.ts
Updated drawCanvasLayer to accept two contexts: ctxBg and ctxFg.
Moves Order Blocks, FVGs, and PD Zones drawing to ctxBg.
Calls drawSetups twice: once for background shapes (passed to ctxBg), once for foreground labels (passed to ctxFg).
components/Chart.tsx
Added canvasBgRef for the background layer.
Configured Lightweight Charts to use a transparent background so the background canvas shows through.
Updated the container layout:
Background Canvas at z-0.
Chart at z-10.
Foreground Canvas at z-20.
Updated drawCanvasOverlay to handle resizing and clearing for both canvases.





