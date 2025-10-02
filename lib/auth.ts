import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { sql } from "./database"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-this-in-production")

const COOKIE_NAME = "auth-token"

export interface User {
  id: string
  email: string
  name: string
  created_at: string
}

export interface AuthSession {
  user: User
  token: string
}

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function createToken(userId: string): Promise<string> {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET)

  return token
}

export async function verifyToken(token: string): Promise<{ userId: string } | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET)
    return verified.payload as { userId: string }
  } catch {
    return null
  }
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })
}

export async function getAuthCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(COOKIE_NAME)
  return cookie?.value || null
}

export async function removeAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getCurrentUser(): Promise<User | null> {
  const token = await getAuthCookie()
  if (!token) return null

  const payload = await verifyToken(token)
  if (!payload) return null

  try {
    const result = await sql`
      SELECT id, email, name, created_at
      FROM users
      WHERE id = ${payload.userId}
      LIMIT 1
    `

    if (result.length === 0) return null

    return result[0] as User
  } catch (error) {
    console.error("Failed to get current user:", error)
    return null
  }
}

export async function signUp(email: string, password: string, name: string): Promise<AuthSession> {
  const existingUser = await sql`
    SELECT id FROM users WHERE email = ${email} LIMIT 1
  `

  if (existingUser.length > 0) {
    throw new Error("User already exists")
  }

  const hashedPassword = await hashPassword(password)
  const userId = generateUUID()

  await sql`
    INSERT INTO users (id, email, password, name, created_at)
    VALUES (${userId}, ${email}, ${hashedPassword}, ${name}, NOW())
  `

  const token = await createToken(userId)
  await setAuthCookie(token)

  const user: User = {
    id: userId,
    email,
    name,
    created_at: new Date().toISOString(),
  }

  return { user, token }
}

export async function signIn(email: string, password: string): Promise<AuthSession> {
  const result = await sql`
    SELECT id, email, password, name, created_at
    FROM users
    WHERE email = ${email}
    LIMIT 1
  `

  if (result.length === 0) {
    throw new Error("Invalid credentials")
  }

  const user = result[0] as User & { password: string }
  const isValid = await verifyPassword(password, user.password)

  if (!isValid) {
    throw new Error("Invalid credentials")
  }

  const token = await createToken(user.id)
  await setAuthCookie(token)

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.created_at,
    },
    token,
  }
}

export async function signOut() {
  await removeAuthCookie()
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user
}

export async function getUserId(): Promise<string | null> {
  const user = await getCurrentUser()
  return user?.id || null
}

export async function getUser(): Promise<User | null> {
  return getCurrentUser()
}
