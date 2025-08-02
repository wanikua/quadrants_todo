import { NextResponse } from "next/server"

function isValidClerkKey(key: string | undefined, prefix: string): boolean {
  return !!(
    (
      key &&
      key.startsWith(prefix) &&
      key.length > 10 &&
      !key.includes("your-") && // Exclude template keys
      !key.includes("test_") && // Exclude test placeholders
      !key.includes("example")
    ) // Exclude example keys
  )
}

export async function GET() {
  try {
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    const secretKey = process.env.CLERK_SECRET_KEY

    const isValidPublishableKey = isValidClerkKey(publishableKey, "pk_")
    const isValidSecretKey = isValidClerkKey(secretKey, "sk_")
    const isConfigured = isValidPublishableKey && isValidSecretKey

    return NextResponse.json({
      success: isConfigured,
      configured: !!(publishableKey && secretKey),
      validFormat: isValidPublishableKey && isValidSecretKey,
      publishableKeyValid: isValidPublishableKey,
      secretKeyValid: isValidSecretKey,
      details: {
        hasPublishableKey: !!publishableKey,
        hasSecretKey: !!secretKey,
        publishableKeyFormat: publishableKey?.startsWith("pk_") ? "correct" : "incorrect",
        secretKeyFormat: secretKey?.startsWith("sk_") ? "correct" : "incorrect",
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Configuration check failed" })
  }
}
