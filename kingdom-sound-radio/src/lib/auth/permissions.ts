export const PERMISSIONS = [
  "admin.access",
  "station.manage",
  "programs.manage",
  "presenters.manage",
  "schedule.manage",
  "episodes.manage",
  "episodes.publish",
  "media.upload",
  "content.manage",
  "community.moderate",
  "prayer.view_assigned",
  "prayer.manage",
  "users.manage",
  "finance.view",
  "integrations.manage",
  "audit.view",
  "sample.purge",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export function hasPermission(granted: ReadonlySet<string> | readonly string[], p: Permission): boolean {
  const set = granted instanceof Set ? granted : new Set(granted);
  return set.has(p);
}

export function hasAny(granted: ReadonlySet<string> | readonly string[], ps: readonly Permission[]): boolean {
  return ps.some((p) => hasPermission(granted, p));
}
