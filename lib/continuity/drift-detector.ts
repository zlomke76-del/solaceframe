export interface DriftSignal {
  type:
    | "identity"
    | "wardrobe"
    | "environment"
    | "timeline"
    | "object-permanence"
    | "emotional-state";
  severity: "low" | "medium" | "high";
  message: string;
}

export interface ContinuityDriftReport {
  score: number;
  status: "stable" | "watch" | "repair-required";
  signals: DriftSignal[];
}

export function detectContinuityDrift(signals: DriftSignal[]): ContinuityDriftReport {
  const severityWeight = signals.reduce((total, signal) => {
    if (signal.severity === "high") return total + 0.22;
    if (signal.severity === "medium") return total + 0.12;
    return total + 0.04;
  }, 0);

  const score = Math.max(0, Number((1 - severityWeight).toFixed(2)));

  return {
    score,
    status: score >= 0.86 ? "stable" : score >= 0.7 ? "watch" : "repair-required",
    signals
  };
}

export const activeDriftReport = detectContinuityDrift([
  {
    type: "identity",
    severity: "low",
    message: "Elena facial structure remains within accepted continuity bounds."
  },
  {
    type: "timeline",
    severity: "medium",
    message: "Scene 003 must preserve left-arm injury from bridge collapse."
  }
]);
