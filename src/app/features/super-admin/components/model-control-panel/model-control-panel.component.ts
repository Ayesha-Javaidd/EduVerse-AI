import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ENDPOINTS } from '../../../../core/constants/api.constants';

interface ModelMetric {
  model_name: string;
  avg_score: number;
  avg_rag_score: number;
  pass_rate: number;
  total_generations: number;
  avg_latency_ms: number;
}

interface LeaderboardResponse {
  active_model: string;
  leaderboard: Array<{
    model: string;
    avg_score: number;
    pass_rate: number;
    total_runs: number;
    avg_layer2: number;
    avg_latency_ms: number;
  }>;
}

@Component({
  selector: 'app-model-control-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="model-manager">
      <div class="header">
        <h2>Local LLM Worker Management</h2>
        <div class="actions">
          <button id="run-benchmark-btn" [disabled]="benchmarking" (click)="runBenchmark()">
            {{ benchmarking ? '⌛ Running 10-Prompt Benchmark...' : '🚀 Run System Benchmark' }}
          </button>
        </div>
      </div>

      <!-- Active Model Selector -->
      <div class="active-model-card">
        <div class="card-content">
          <div class="status-indicator">
            <span class="pulse"></span>
            <label>Active Worker Model</label>
          </div>
          <div class="selector-row">
            <select id="active-model-select" [(ngModel)]="selectedModel">
              <option value="phi3.5">Microsoft Phi 3.5 (Fast / Efficient)</option>
              <option value="qwen2.5:3b">Alibaba Qwen 2.5 3B (Precise)</option>
              <option value="llama3.2:3b">Meta Llama 3.2 3B (Balanced)</option>
            </select>
            <button id="set-active-model-btn" [disabled]="updating" (click)="setActiveModel()">
              {{ updating ? 'Updating...' : 'Switch Model' }}
            </button>
          </div>
          <p class="hint">Switching takes effect immediately for all tenants.</p>
        </div>
      </div>

      <!-- Leaderboard -->
      <div class="leaderboard-section">
        <h3>Model Performance Leaderboard</h3>
        <p class="subtitle">Ranked by ROUGE, BERTScore, and RAG Grounding across all generations.</p>
        
        <div *ngIf="loading" class="skeleton-loader">Loading performance data...</div>

        <table *ngIf="!loading">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Model Name</th>
              <th>Avg Score (out of 100)</th>
              <th>Avg RAG Score</th>
              <th>Pass Rate</th>
              <th>Total Runs</th>
              <th>Avg Latency</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let m of leaderboard; let i = index" [class.active]="m.model_name === activeModelInDb">
              <td class="rank">#{{ i + 1 }}</td>
              <td class="model-name">
                {{ m.model_name }}
                <span *ngIf="m.model_name === activeModelInDb" class="active-pill">ACTIVE</span>
              </td>
              <td>
                <div class="score-bar">
                  <div class="fill" [style.width.%]="m.avg_score"></div>
                  <span>{{ m.avg_score | number:'1.1-1' }}</span>
                </div>
              </td>
              <td>{{ m.avg_rag_score | number:'1.1-1' }}</td>
              <td [class.high]="m.pass_rate > 80" [class.low]="m.pass_rate < 50">
                {{ m.pass_rate | number:'1.0-0' }}%
              </td>
              <td>{{ m.total_generations }}</td>
              <td>{{ m.avg_latency_ms }}ms</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .model-manager { padding: 2rem; color: #1e293b; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    h2 { margin: 0; font-weight: 700; }
    
    .active-model-card { background: #1e293b; color: white; padding: 1.5rem; border-radius: 16px; margin-bottom: 2rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
    .status-indicator { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; }
    .pulse { width: 10px; height: 10px; background: #10b981; border-radius: 50%; box-shadow: 0 0 0 0 rgba(16, 185, 129, 1); animation: pulse-green 2s infinite; }
    @keyframes pulse-green { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
    
    .selector-row { display: flex; gap: 1rem; }
    select { flex: 1; background: #334155; color: white; border: 1px solid #475569; padding: 0.75rem; border-radius: 8px; font-size: 1rem; }
    #set-active-model-btn { background: #6366f1; border: none; padding: 0 1.5rem; border-radius: 8px; color: white; cursor: pointer; font-weight: 600; }
    .hint { font-size: 0.8rem; color: #94a3b8; margin-top: 0.75rem; }

    #run-benchmark-btn { background: white; color: #1e293b; border: 1px solid #e2e8f0; padding: 0.75rem 1.25rem; border-radius: 10px; font-weight: 600; cursor: pointer; }

    .leaderboard-section { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.5rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    th { text-align: left; padding: 1rem; border-bottom: 2px solid #f1f5f9; color: #64748b; font-size: 0.85rem; text-transform: uppercase; }
    td { padding: 1rem; border-bottom: 1px solid #f1f5f9; }
    .rank { font-weight: 700; color: #94a3b8; }
    .model-name { font-weight: 600; }
    .active-pill { background: #dcfce7; color: #15803d; font-size: 0.7rem; padding: 0.2rem 0.5rem; border-radius: 100px; margin-left: 0.5rem; }
    .score-bar { display: flex; align-items: center; gap: 0.75rem; }
    .score-bar .fill { height: 8px; background: #6366f1; border-radius: 4px; }
    .score-bar span { font-weight: 700; font-size: 0.9rem; }
    .high { color: #10b981; font-weight: 600; }
    .low { color: #ef4444; font-weight: 600; }
    tr.active { background: #f8fafc; }
  `],
})
export class ModelControlPanelComponent implements OnInit {
  leaderboard: ModelMetric[] = [];
  activeModelInDb: string = '';
  selectedModel: string = 'phi3.5';
  loading = true;
  updating = false;
  benchmarking = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.refreshData();
  }

  refreshData(): void {
    this.loading = true;
    this.http.get<LeaderboardResponse>(ENDPOINTS.ADMIN_MODELS.LEADERBOARD)
      .subscribe({
        next: (data) => {
          this.leaderboard = data.leaderboard.map((metric) => ({
            model_name: metric.model,
            avg_score: metric.avg_score,
            avg_rag_score: metric.avg_layer2,
            pass_rate: metric.pass_rate,
            total_generations: metric.total_runs,
            avg_latency_ms: metric.avg_latency_ms,
          }));
          this.activeModelInDb = data.active_model;
          this.selectedModel = data.active_model;
          this.loading = false;
        },
        error: () => this.loading = false
      });
  }

  setActiveModel(): void {
    this.updating = true;
    this.http.post(ENDPOINTS.ADMIN_MODELS.SET_ACTIVE, { model_name: this.selectedModel })
      .subscribe({
        next: () => {
          this.activeModelInDb = this.selectedModel;
          this.updating = false;
          this.refreshData();
        },
        error: (err) => {
          alert(`Failed to set model: ${err.error?.detail || err.message}`);
          this.updating = false;
        }
      });
  }

  runBenchmark(): void {
    if (!confirm('Run sequential benchmark across all 3 models?\n\n⚠️ This takes 8-15 minutes on local hardware (phi3.5 is slow).\nThe page will update automatically when done.')) return;

    this.benchmarking = true;
    this.http.post(ENDPOINTS.ADMIN_MODELS.BENCHMARK, {})
      .subscribe({
        next: (res: any) => {
          this.benchmarking = false;
          this.refreshData();
          const modelResults = res?.results ?? res ?? {};
          const modelCount = Object.keys(modelResults).length || 3;
          alert(`✅ Benchmark complete! ${modelCount} models tested. Leaderboard updated.`);
        },
        error: (err) => {
          this.benchmarking = false;
          // err.error?.detail can be a string or an object; handle both
          const detail = err.error?.detail;
          const msg = typeof detail === 'string'
            ? detail
            : typeof detail === 'object' && detail !== null
              ? JSON.stringify(detail)
              : err.message || `HTTP ${err.status}`;
          alert(`Benchmark failed: ${msg}`);
        }
      });
  }
}
