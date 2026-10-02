import { SessionResult, WpmPoint } from "./types.js";

import { appState } from "./state.js";


export class ResultRenderer {
  private netWpmEl: HTMLElement;
  private accuracyEl: HTMLElement;
  private rawWpmEl: HTMLElement;
  private charsEl: HTMLElement;
  private consistencyEl: HTMLElement;
  private durationEl: HTMLElement;
  private chartSvg: SVGSVGElement;
  private mistakesListEl: HTMLElement;
  private correctCharsEl: HTMLElement;
  private incorrectCharsEl: HTMLElement;
  private extraCharsEl: HTMLElement;
  private weakSpotsListEl: HTMLElement;
  private recentHistoryListEl: HTMLElement;
  private graphAxisLabelsEl: HTMLElement;

  constructor() {
    this.netWpmEl = document.getElementById("result-net-wpm")!;
    this.accuracyEl = document.getElementById("result-accuracy")!;
    this.rawWpmEl = document.getElementById("result-raw-wpm")!;
    this.charsEl = document.getElementById("result-chars")!;
    this.consistencyEl = document.getElementById("result-consistency")!;
    this.durationEl = document.getElementById("result-duration")!;
    this.chartSvg = document.getElementById(
      "performance-chart",
    ) as unknown as SVGSVGElement;
    this.mistakesListEl = document.getElementById("mistakes-list")!;
    this.correctCharsEl = document.getElementById("stat-correct-chars")!;
    this.incorrectCharsEl = document.getElementById("stat-incorrect-chars")!;
    this.extraCharsEl = document.getElementById("stat-extra-chars")!;
    this.weakSpotsListEl = document.getElementById("weak-spots-list")!;
    this.recentHistoryListEl = document.getElementById("recent-history-list")!;
    this.graphAxisLabelsEl = document.querySelector(".graph-axis-labels")!;
  }

  public render(result: SessionResult) {
    // 1. Primary Hero Result
    this.netWpmEl.textContent = result.netWpm.toString();
    this.accuracyEl.textContent = result.accuracy.toFixed(1);

    // 2. Compact Tabular Metrics Row
    this.rawWpmEl.textContent = result.rawWpm.toFixed(1);
    this.charsEl.innerHTML = `${result.correctChars} <span class="char-sub">/ ${result.incorrectChars}</span>`;
    this.consistencyEl.textContent = `${result.consistency}%`;
    this.durationEl.textContent = `${result.durationSec}s`;

    // 3. Technical Performance Graph (SVG)
    this.renderTechnicalChart(result.wpmHistory, result.durationSec);

    // 4. Mistakes Breakdown
    this.renderMistakes(result.mistakes);
    this.correctCharsEl.textContent = result.correctChars.toString();
    this.incorrectCharsEl.textContent = result.incorrectChars.toString();
    this.extraCharsEl.textContent = result.extraChars.toString();

    // 5. Weak Spots
    this.renderWeakSpots(result.weakSpots);

    // 6. Recent History Table
    this.renderHistory();
  }

  private renderTechnicalChart(points: WpmPoint[], duration: number) {
    if (!points || points.length === 0) return;

    const width = 680;
    const height = 260;
    const padTop = 15;
    const padBottom = 25;
    const padLeft = 40;
    const padRight = 20;

    const drawW = width - padLeft - padRight;
    const drawH = height - padTop - padBottom;

    // Determine scale bounds
    const allWpms = points.flatMap((p) => [p.wpm, p.rawWpm]);
    const maxVal = Math.max(
      90,
      Math.ceil((Math.max(...allWpms) + 10) / 10) * 10,
    );
    const minVal = Math.max(
      0,
      Math.floor((Math.min(...allWpms) - 10) / 10) * 10,
    );
    const valRange = Math.max(20, maxVal - minVal);

    const maxTime = Math.max(1, duration, points[points.length - 1].time);

    const getX = (t: number) => padLeft + (t / maxTime) * drawW;
    const getY = (v: number) =>
      padTop + drawH - ((v - minVal) / valRange) * drawH;

    let svgInner = "";

    // Subtle horizontal gridlines and numeric Y-axis labels
    const gridSteps = 5;
    for (let i = 0; i <= gridSteps; i++) {
      const val = Math.round(minVal + (valRange / gridSteps) * i);
      const y = getY(val);
      svgInner += `
        <line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" class="chart-grid-line" />
        <text x="${padLeft - 8}" y="${y + 3}" text-anchor="end" class="chart-grid-text">${val}</text>
      `;
    }

    // Raw WPM path (dashed subtle)
    let rawPathD = "";
    points.forEach((p, idx) => {
      const x = getX(p.time);
      const y = getY(p.rawWpm);
      rawPathD += `${idx === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)} `;
    });
    svgInner += `<path d="${rawPathD}" class="chart-raw-line" />`;

    // Net WPM path (smooth curve or crisp line)
    let netPathD = "";
    points.forEach((p, idx) => {
      const x = getX(p.time);
      const y = getY(p.wpm);
      netPathD += `${idx === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)} `;
    });
    svgInner += `<path d="${netPathD}" class="chart-line" />`;

    // Data points & error indicators
    points.forEach((p) => {
      const x = getX(p.time);
      const y = getY(p.wpm);
      if (p.errors > 0) {
        svgInner += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" class="chart-error-marker"><title>${p.time}s: ${p.wpm} WPM (${p.errors} error)</title></circle>`;
      } else {
        svgInner += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.5" class="chart-point"><title>${p.time}s: ${p.wpm} WPM</title></circle>`;
      }
    });

    this.chartSvg.innerHTML = svgInner;

    // Update X-axis labels
    if (this.graphAxisLabelsEl) {
      const step = Math.round(duration / 3);
      this.graphAxisLabelsEl.innerHTML = `
        <span>0s</span>
        <span>${step}s</span>
        <span>${step * 2}s</span>
        <span>${duration}s</span>
      `;
    }
  }

  private renderMistakes(
    mistakes: { expected: string; typed: string; count: number }[],
  ) {
    this.mistakesListEl.innerHTML = "";
    if (mistakes.length === 0) {
      this.mistakesListEl.innerHTML = `<div class="mistake-row" style="border-left-color: var(--accent);"><span style="color: var(--text-secondary); font-size: 12px;">Zero character mistakes recorded</span></div>`;
      return;
    }

    mistakes.slice(0, 3).forEach((m) => {
      const row = document.createElement("div");
      row.className = "mistake-row";
      row.innerHTML = `
        <div class="mistake-pair">
          <span class="mistake-expected">${m.expected === " " ? "␣" : m.expected}</span>
          <span class="mistake-arrow">→</span>
          <span class="mistake-typed">${m.typed === " " ? "␣" : m.typed}</span>
        </div>
        <span class="mistake-count">${m.count} ${m.count === 1 ? "mistake" : "mistakes"}</span>
      `;
      this.mistakesListEl.appendChild(row);
    });
  }

  private renderWeakSpots(weakSpots: string[]) {
    this.weakSpotsListEl.innerHTML = "";
    weakSpots.forEach((cluster) => {
      const tag = document.createElement("span");
      tag.className = "weak-cluster";
      tag.textContent = cluster;
      this.weakSpotsListEl.appendChild(tag);
    });
  }

  private renderHistory() {
    this.recentHistoryListEl.innerHTML = "";
    appState.history.slice(0, 4).forEach((item) => {
      const row = document.createElement("div");
      row.className = "recent-row";
      row.innerHTML = `
        <span class="recent-mode">${item.mode}</span>
        <span class="recent-wpm">${item.wpm} WPM</span>
        <span class="recent-acc">${item.accuracy}%</span>
        <span class="recent-time">${item.dateStr}</span>
      `;
      this.recentHistoryListEl.appendChild(row);
    });
  }
}
