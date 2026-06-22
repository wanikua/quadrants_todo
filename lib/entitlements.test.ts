/**
 * Unit tests for the Entitlements module. Pure functions → no DB, no mocks.
 * Run: node --test --experimental-strip-types lib/entitlements.test.ts
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import {
  isPro,
  projectLimit,
  canCreateProject,
  accessibleProjects,
  FREE_PROJECT_LIMIT,
} from "./entitlements.ts"

test("isPro: active pro is entitled", () => {
  assert.equal(isPro({ subscription_plan: "pro", subscription_status: "active" }), true)
})

test("isPro: active team is entitled (team >= pro)", () => {
  assert.equal(isPro({ subscription_plan: "team", subscription_status: "active" }), true)
})

test("isPro: pro plan but non-active status is not entitled", () => {
  assert.equal(isPro({ subscription_plan: "pro", subscription_status: "canceled" }), false)
  assert.equal(isPro({ subscription_plan: "pro", subscription_status: "past_due" }), false)
})

test("isPro: free / missing / null / undefined are not entitled", () => {
  assert.equal(isPro({ subscription_plan: "free", subscription_status: "active" }), false)
  assert.equal(isPro({}), false)
  assert.equal(isPro(null), false)
  assert.equal(isPro(undefined), false)
})

test("projectLimit: pro unlimited, free capped", () => {
  assert.equal(projectLimit({ subscription_plan: "pro", subscription_status: "active" }), Infinity)
  assert.equal(projectLimit(null), FREE_PROJECT_LIMIT)
})

test("canCreateProject: free blocked at the limit", () => {
  const free = { subscription_plan: "free", subscription_status: "active" }
  assert.equal(canCreateProject(free, 0), true)
  assert.equal(canCreateProject(free, FREE_PROJECT_LIMIT - 1), true)
  assert.equal(canCreateProject(free, FREE_PROJECT_LIMIT), false)
})

test("canCreateProject: pro is unlimited", () => {
  assert.equal(canCreateProject({ subscription_plan: "pro", subscription_status: "active" }, 999), true)
})

test("accessibleProjects: free keeps newest FREE_PROJECT_LIMIT, pro keeps all", () => {
  const projects = ["a", "b", "c", "d"] // already newest-first
  assert.deepEqual(
    accessibleProjects({ subscription_plan: "free", subscription_status: "active" }, projects),
    ["a", "b"],
  )
  assert.deepEqual(
    accessibleProjects({ subscription_plan: "pro", subscription_status: "active" }, projects),
    ["a", "b", "c", "d"],
  )
})
