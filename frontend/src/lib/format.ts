// Small text helpers for the note under each reply (tier, time, estimated cost).

const TIER_LABELS: Record<string, string> = {
  local: "Local",
  small_cloud: "Small cloud",
  strong_cloud: "Strong cloud",
};

export function tierLabel(tier: string): string {
  return TIER_LABELS[tier] ?? tier;
}

export function formatSeconds(seconds: number): string {
  return `${seconds.toFixed(seconds < 10 ? 1 : 0)} s`;
}

// The cost is an ESTIMATE from the model's published paid price (decisions A12); on free plans
// nothing is really charged.
export function formatCost(usd: number | null): string {
  if (usd === null) return "cost unknown";
  if (usd === 0) return "$0";
  if (usd < 0.000001) return "<$0.000001";
  return `$${usd.toFixed(6).replace(/0+$/, "").replace(/\.$/, "")}`;
}

// The backend writes "Planned local, answered by small_cloud. Unavailable: ..." when a tier
// could not answer. This reads the planned tier back out of it.
export function plannedTierFromNote(note: string | null): string | null {
  const match = note?.match(/^Planned (\w+),/);
  return match ? match[1] : null;
}

// "2026-11-19T10:30:00+00:00" -> "19 Nov 2026" (in the person's own time zone).
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
