import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { sql } from "./database"
import { auth, currentUser } from "@clerk/nextjs/server"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "change-this-to-a-secure-secret-key-at-least-32-characters-long",
)

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
  } catch (error) {
    console.error("Token verification failed:", error)
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
  // Try Clerk authentication first
  try {
    const { userId } = await auth()
    if (userId) {
      const clerkUser = await currentUser()
      if (clerkUser) {
        const email = clerkUser.emailAddresses[0]?.emailAddress || ''

        // Default name from Clerk
        let defaultName = clerkUser.firstName || clerkUser.username
        if (!defaultName && email) {
          defaultName = email.split('@')[0]
        }
        if (!defaultName) {
          defaultName = 'User'
        }

        // Try to get user's custom name from database
        let name = defaultName
        if (sql) {
          try {
            // First, check if user exists in database by Clerk userId
            const dbResult = await sql`
              SELECT name FROM users WHERE id = ${userId} LIMIT 1
            `

            if (dbResult.length > 0) {
              // User exists with Clerk ID, use their custom name if set
              if (dbResult[0].name) {
                name = dbResult[0].name
              }
            } else {
              // Check if user exists by email (may be from old JWT auth)
              const emailResult = await sql`
                SELECT id, name FROM users WHERE email = ${email} LIMIT 1
              `

              if (emailResult.length > 0) {
                // User exists with same email but different ID, update the ID to Clerk's
                try {
                  await sql`
                    UPDATE users
                    SET id = ${userId}, password_hash = '__clerk_user__', updated_at = NOW()
                    WHERE email = ${email}
                  `
                  // Use their existing name
                  if (emailResult[0].name) {
                    name = emailResult[0].name
                  }
                } catch (updateError) {
                  console.log("Failed to update user ID:", updateError)
                }
              } else {
                // User doesn't exist at all, create new record
                try {
                  await sql`
                    INSERT INTO users (id, email, password_hash, name, created_at)
                    VALUES (${userId}, ${email}, '__clerk_user__', ${defaultName}, NOW())
                    ON CONFLICT (id) DO NOTHING
                  `
                } catch (insertError) {
                  console.log("Failed to insert user into database:", insertError)
                }
              }
            }
          } catch (dbError) {
            console.log("Failed to get/create user in database:", dbError)
          }
        }

        return {
          id: userId,
          email,
          name,
          created_at: new Date(clerkUser.createdAt).toISOString(),
        }
      }
    }
  } catch (error) {
    console.log("Clerk auth not available, trying JWT")
  }

  // Fallback to JWT authentication
  const token = await getAuthCookie()
  if (!token) return null

  const payload = await verifyToken(token)
  if (!payload) return null

  try {
    if (!sql) {
      console.error("Database not configured")
      return null
    }

    const result = await sql`
      SELECT id, email, name, created_at
      FROM users
      WHERE id = ${payload.userId}
      LIMIT 1
    `

    if (result.length === 0) {
      return null
    }

    return result[0] as User
  } catch (error) {
    console.error("Failed to get current user:", error)
    return null
  }
}

export async function signUp(email: string, password: string, name: string): Promise<AuthSession> {
  if (!sql) {
    throw new Error("Database not configured")
  }

  // Validate inputs
  if (!email || !password || !name) {
    throw new Error("Email, password, and name are required")
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters")
  }

  const existingUser = await sql`
    SELECT id FROM users WHERE email = ${email} LIMIT 1
  `

  if (existingUser.length > 0) {
    throw new Error("User already exists")
  }

  const hashedPassword = await hashPassword(password)
  const userId = generateUUID()

  await sql`
    INSERT INTO users (id, email, password_hash, name, created_at)
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
  if (!sql) {
    throw new Error("Database not configured")
  }

  // Validate inputs
  if (!email || !password) {
    throw new Error("Email and password are required")
  }

  const result = await sql`
    SELECT id, email, password_hash, name, created_at
    FROM users
    WHERE email = ${email}
    LIMIT 1
  `

  if (result.length === 0) {
    throw new Error("Invalid credentials")
  }

  const user = result[0] as User & { password_hash: string }

  if (!user.password_hash) {
    throw new Error("Account requires password reset")
  }

  const isValid = await verifyPassword(password, user.password_hash)

  if (!isValid) {
    throw new Error("Invalid credentials")
  }

  const token = await createToken(user.id)
  await setAuthCookie(token)

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name || user.email.split("@")[0],
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
