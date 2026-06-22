/**
 * Entitlements — the single source of truth for what a user's subscription grants.
 *
 * Every function is PURE: a total function of the user's plan + status with no I/O, so the
 * rules are unit-testable and "what Pro means" is a one-line change. Callers that only hold a
 * `userId` (e.g. the hot-path access check in app/db/actions.ts) keep their own cached read but
 * route the *rule* through `isPro` here — the read is theirs, the rule is ours.
 *
 * See CONTEXT.md (Entitlement, Pro, Free tier, Plan).
 */

/**
 * Minimal structural shape every caller can satisfy — the full `User` (lib/auth), the component
 * `User`, or a raw `{ subscription_plan, subscription_status }` DB row all fit.
 */
export interface EntitledUser {
  subscription_plan?: string | null
  subscription_status?: string | null
}

/** Plans that carry paid entitlements. `team` is treated as Pro-or-better. */
const PAID_PLANS: ReadonlySet<string> = new Set(["pro", "team"])

/** Number of Projects a Free-tier user may own / see. */
export const FREE_PROJECT_LIMIT = 2

/** True when the user holds an active paid subscription (pro or team). */
export function isPro(user: EntitledUser | null | undefined): boolean {
  if (!user) return false
  return PAID_PLANS.has(user.subscription_plan ?? "") && user.subscription_status === "active"
}

/** Max number of Projects the user may own. Free tier = FREE_PROJECT_LIMIT, paid = unlimited. */
export function projectLimit(user: EntitledUser | null | undefined): number {
  return isPro(user) ? Number.POSITIVE_INFINITY : FREE_PROJECT_LIMIT
}

/** Whether the user may create another Project given how many they already own. */
export function canCreateProject(
  user: EntitledUser | null | undefined,
  currentProjectCount: number,
): boolean {
  return currentProjectCount < projectLimit(user)
}

/**
 * The subset of the user's own Projects they may access. Free-tier users keep only their most
 * recent FREE_PROJECT_LIMIT; paid users keep all. `projectsNewestFirst` MUST already be ordered
 * most-recently-updated first (the DB query owns the sort; this owns the policy).
 */
export function accessibleProjects<T>(
  user: EntitledUser | null | undefined,
  projectsNewestFirst: readonly T[],
): T[] {
  if (isPro(user)) return [...projectsNewestFirst]
  return projectsNewestFirst.slice(0, FREE_PROJECT_LIMIT)
}
