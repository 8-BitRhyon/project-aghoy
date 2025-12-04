export enum Verdict {
  SAFE = 'SAFE',
  SUSPICIOUS = 'SUSPICIOUS',
  HIGH_RISK = 'HIGH_RISK'
}

export interface AnalysisResult {
  verdict: Verdict;
  riskScore: number; // 0 to 10
  redFlags: string[];
  analysis: string;
  scamType: string; // e.g., "Task Scam", "Investment Scam"
  senderEntity?: string; // The number or name of the sender
  educationalTip: string; // Contextual education content
}

export interface ChartData {
  name: string;
  value: number;
  fill: string;
}