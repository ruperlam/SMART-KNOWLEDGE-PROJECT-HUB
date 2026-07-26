// SLA & Aging Engine
// Δt = T_current - T_added (in whole days)
// daysRemaining = slaDays - Δt
// Badge:
//   status === READ            -> "Đã đọc" (green)
//   daysRemaining < 0           -> "Quá hạn (X ngày)" (red)
//   daysRemaining <= 2          -> "Sắp quá hạn (Còn X ngày)" (yellow)
//   else                        -> "Mới thêm" (green)

export type ReadStatus = "UNREAD" | "IN_PROGRESS" | "READ" | "ARCHIVED";

export type SlaBadge = {
  level: "green" | "yellow" | "red";
  label: string;
  emoji: "🟢" | "🟡" | "🔴";
  ageDays: number;
  daysRemaining: number;
};

export function getAgeDays(addedAt: Date, now: Date = new Date()): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = now.getTime() - new Date(addedAt).getTime();
  return Math.max(0, Math.floor(diff / msPerDay));
}

export function getSlaBadge(
  addedAt: Date,
  slaDays: number,
  status: ReadStatus,
  now: Date = new Date()
): SlaBadge {
  const ageDays = getAgeDays(addedAt, now);
  const daysRemaining = slaDays - ageDays;

  if (status === "READ") {
    return {
      level: "green",
      emoji: "🟢",
      label: "Đã đọc",
      ageDays,
      daysRemaining,
    };
  }

  if (daysRemaining < 0) {
    return {
      level: "red",
      emoji: "🔴",
      label: `Quá hạn (${Math.abs(daysRemaining)} ngày)`,
      ageDays,
      daysRemaining,
    };
  }

  if (daysRemaining <= 2) {
    return {
      level: "yellow",
      emoji: "🟡",
      label: `Sắp quá hạn (Còn ${daysRemaining} ngày)`,
      ageDays,
      daysRemaining,
    };
  }

  return {
    level: "green",
    emoji: "🟢",
    label: "Mới thêm",
    ageDays,
    daysRemaining,
  };
}

export const badgeClasses: Record<SlaBadge["level"], string> = {
  green: "bg-status-green/20 text-status-green border border-status-green/40",
  yellow:
    "bg-status-yellow/20 text-status-yellow border border-status-yellow/40",
  red: "bg-status-red/20 text-status-red border border-status-red/40",
};
