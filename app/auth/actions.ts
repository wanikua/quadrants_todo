"use server"

import { signUp as authSignUp, signIn as authSignIn, signOut as authSignOut } from "@/lib/auth"

export async function signUp(email: string, password: string, name: string) {
  try {
    await authSignUp(email, password, name)
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Sign up failed" }
  }
}

export async function signIn(email: string, password: string) {
  try {
    await authSignIn(email, password)
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Sign in failed" }
  }
}

export async function signOut() {
  try {
    await authSignOut()
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Sign out failed" }
  }
}
