"use server"

import { cookies } from "next/headers"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"
import { SignJWT, jwtVerify } from "jose"
import { redirect } from "next/navigation"
import { stackServerApp } from "@/stack"

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

const sql = neon(DATABASE_URL)
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "change-this-to-a-secure-secret-key-at-least-32-characters-long",
)

interface User {
  id: string
  email: string
  display_name: string | null
}

interface JWTPayload {
  userId: string
  email: string
}

async function createToken(payload: JWTPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET)
}

async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) return null

    const payload = await verifyToken(token)
    if (!payload) return null

    const result = await sql`
      SELECT id, email, display_name
      FROM users
      WHERE id = ${payload.userId}
    `

    return result.length > 0 ? (result[0] as User) : null
  } catch (error) {
    console.error("Error getting user:", error)
    return null
  }
}

export async function getUserId(): Promise<string | null> {
  const user = await stackServerApp.getUser()
  return user?.id ?? null
}

export async function requireAuth(): Promise<string> {
  const userId = await getUserId()
  if (!userId) {
    throw new Error("Unauthorized")
  }
  return userId
}

export async function getUser() {
  return await stackServerApp.getUser()
}

export async function signUp(email: string, password: string, displayName?: string) {
  try {
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`
    if (existing.length > 0) return { error: "User already exists" }

    const passwordHash = await bcrypt.hash(password, 10)
    const userId = crypto.randomUUID()

    await sql`
      INSERT INTO users (id, email, password_hash, display_name, created_at)
      VALUES (${userId}, ${email}, ${passwordHash}, ${displayName || null}, NOW())
    `

    const token = await createToken({ userId, email })
    const cookieStore = await cookies()
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    })

    return { success: true }
  } catch (error) {
    console.error("Sign up error:", error)
    return { error: "Failed to create account" }
  }
}

export async function signIn(email: string, password: string) {
  try {
    const result = await sql`
      SELECT id, email, password_hash
      FROM users
      WHERE email = ${email}
    `

    if (result.length === 0) return { error: "Invalid email or password" }

    const user = result[0]
    const validPassword = await bcrypt.compare(password, user.password_hash)
    if (!validPassword) return { error: "Invalid email or password" }

    const token = await createToken({ userId: user.id, email: user.email })
    const cookieStore = await cookies()
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    })

    return { success: true }
  } catch (error) {
    console.error("Sign in error:", error)
    return { error: "Failed to sign in" }
  }
}

export async function signOut() {
  const cookieStore = await cookies()
  cookieStore.delete("auth_token")
  redirect("/auth/signin")
}
