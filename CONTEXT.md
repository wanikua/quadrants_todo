# Quadrants — Context

Domain glossary for Quadrants, an AI-assisted task manager that places **Tasks** on an
Eisenhower **Matrix**. This file names the concepts that recur across the code so the same
word means the same thing everywhere. It is grown lazily as architecture work resolves terms.

## Language

**Entitlement**:
What a user's subscription grants them (Pro features, project limits). Owned by the pure
`lib/entitlements` module — the single place the rule lives.
_Avoid_: permission, access level, tier-check.

**Pro**:
An active paid subscription. Concretely: `subscription_plan ∈ {pro, team}` **and**
`subscription_status === 'active'`. A user is either Pro or on the **Free tier**.
_Avoid_: premium, paid user, subscriber.

**Free tier**:
The default, unpaid entitlement. Capped at owning/seeing `FREE_PROJECT_LIMIT` (2) **Projects**.
_Avoid_: basic plan, freemium.

**Plan**:
The subscription product a user holds (`free`, `pro`, `team`). Distinct from **Status**
(`active`, `canceled`, …), which says whether that plan is currently in force. A user is **Pro**
only when both align.

## Relationships

- A user has exactly one **Plan** and one **Status**; together they determine **Entitlement**.
- **Pro** entitlement removes the **Free tier**'s `FREE_PROJECT_LIMIT` on **Projects**.

## Example dialogue

> **Dev:** "A user on the `team` **Plan** — are they **Pro**?"
> **Domain expert:** "Yes. `team` is a paid plan at least as capable as `pro`, so as long as
> their **Status** is `active`, they have full **Entitlement**. Only the **Free tier** is capped."

## Flagged ambiguities

- **`team` plan**: previously *no code path* treated `team` as entitled, so paying team users
  were silently on the **Free tier**. Resolved: `team` ≥ `pro` for all **Entitlement** checks.
- **Plan vs Status duplication**: entitlement was inlined as `plan === 'pro' && status === 'active'`
  in 6 places. Resolved: the rule lives only in `lib/entitlements`.
- **Expiry**: `subscription_period_end` is display-only; entitlement trusts **Status**, not expiry
  (revisit if/when the Stripe webhook is made reliable).
