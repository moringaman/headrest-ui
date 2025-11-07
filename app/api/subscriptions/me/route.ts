import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareSupabaseClient } from '@/lib/supabase-middleware'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://prestashop-api-staging.up.railway.app'

export async function GET(request: NextRequest) {
  try {
    console.log('[SUBSCRIPTIONS API] GET /api/subscriptions/me - Request received')
    console.log('[SUBSCRIPTIONS API] Request URL:', request.url)
    console.log('[SUBSCRIPTIONS API] Request headers:', Object.fromEntries(request.headers.entries()))
    
    const { supabase } = createMiddlewareSupabaseClient(request)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    console.log('[SUBSCRIPTIONS API] Session check:', {
      hasSession: !!session,
      hasAccessToken: !!session?.access_token,
      accessTokenPreview: session?.access_token ? `${session.access_token.substring(0, 20)}...` : 'none',
      sessionError: sessionError?.message,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
    })

    if (!session) {
      console.log('[SUBSCRIPTIONS API] No session found - returning 401')
      return NextResponse.json(
        { error: 'Unauthorized - No session found' },
        { status: 401 }
      )
    }

    if (!session.access_token) {
      console.log('[SUBSCRIPTIONS API] No access token in session - returning 401')
      return NextResponse.json(
        { error: 'Unauthorized - No access token' },
        { status: 401 }
      )
    }

    console.log('[SUBSCRIPTIONS API] Making request to backend:', `${API_BASE_URL}/api/v1/subscriptions/me`)
    console.log('[SUBSCRIPTIONS API] Authorization header will be: Bearer token (length:', session.access_token.length, ')')

    const response = await fetch(`${API_BASE_URL}/api/v1/subscriptions/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    })

    console.log('[SUBSCRIPTIONS API] Backend response status:', response.status)
    console.log('[SUBSCRIPTIONS API] Backend response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      // Handle 404 as "no subscription found" - this is expected for organizations without subscriptions
      if (response.status === 404) {
        console.log('[SUBSCRIPTIONS API] No subscription found for organization - returning 404')
        return NextResponse.json(
          { error: 'Subscription not found', message: 'No subscription found for this organization' },
          { status: 404 }
        )
      }
      
      const errorText = await response.text()
      console.error('[SUBSCRIPTIONS API] Backend error:', errorText)
      return NextResponse.json(
        { error: errorText || 'Failed to fetch subscription', status: response.status },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('[SUBSCRIPTIONS API] Subscription data received:', { id: data.id, plan_tier: data.plan_tier, status: data.status })
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[SUBSCRIPTIONS API] Error fetching subscription:', error)
    console.error('[SUBSCRIPTIONS API] Error stack:', error.stack)
    return NextResponse.json(
      { error: 'Failed to fetch subscription', details: error.message },
      { status: 500 }
    )
  }
}

