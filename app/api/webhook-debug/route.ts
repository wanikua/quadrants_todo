import { NextRequest, NextResponse } from 'next/server'

// Debug endpoint to see raw webhook data
export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')
    const headers = Object.fromEntries(req.headers.entries())

    console.log('=== WEBHOOK DEBUG ===')
    console.log('Headers:', JSON.stringify(headers, null, 2))
    console.log('Signature:', signature)
    console.log('Body length:', body.length)
    console.log('Body preview:', body.substring(0, 500))

    // Try to parse as JSON
    let parsedBody
    try {
      parsedBody = JSON.parse(body)
      console.log('Event type:', parsedBody.type)
      console.log('Event data:', JSON.stringify(parsedBody.data?.object, null, 2))
    } catch (e) {
      console.log('Failed to parse body as JSON:', e)
    }

    return NextResponse.json({
      success: true,
      message: 'Debug info logged to console',
      headers,
      signature,
      bodyLength: body.length,
      eventType: parsedBody?.type,
      hasMetadata: !!parsedBody?.data?.object?.metadata,
      userId: parsedBody?.data?.object?.metadata?.userId || parsedBody?.data?.object?.client_reference_id
    })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
