import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstname, lastname, email, passwd, plan_tier, stripe_customer_id, stripe_subscription_id, is_trial } = body

    // Validate required fields
    if (!firstname || !lastname || !email || !passwd || !plan_tier || !stripe_customer_id || !stripe_subscription_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    console.log('Email validation - email:', email, 'type:', typeof email)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.error('Email validation failed for:', email)
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password length
    if (passwd.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Validate plan tier
    const validPlanTiers = ['hobby', 'starter', 'professional', 'business']
    if (!validPlanTiers.includes(plan_tier)) {
      return NextResponse.json(
        { error: 'Invalid plan tier' },
        { status: 400 }
      )
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL
    
    if (!backendUrl) {
      return NextResponse.json(
        { error: 'API URL not configured' },
        { status: 500 }
      )
    }

    // Create organization in your PrestaShop API
    // backendUrl should be the base URL (without /api/v1)
    // So we add /api/v1/organizations to it
    const fullUrl = `${backendUrl}/api/v1/organizations`
    console.log('Making server-side API call to:', fullUrl)
    console.log('Request payload:', {
      email,
      password: passwd,
      firstname,
      lastname,
      plan_tier,
      stripe_customer_id,
      stripe_subscription_id,
    })
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password: passwd,
        firstname,
        lastname,
        plan_tier,
        stripe_customer_id,
        stripe_subscription_id,
      }),
    })

    console.log('Backend API response status:', response.status)
    console.log('Backend API response headers:', Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend API error:', errorText)
      
      // Parse the error response to get more details
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch (parseError) {
        errorData = { message: errorText }
      }
      
      // Handle specific error cases
      if (response.status === 409 && errorData.message?.includes('already exists')) {
        return NextResponse.json(
          { 
            error: 'Account already exists',
            details: 'A user with this email address already exists. Please try logging in instead.',
            statusCode: 409
          },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to create customer account',
          details: errorData.message || errorText,
          statusCode: response.status
        },
        { status: response.status }
      )
    }

    const organizationData = await response.json()
    console.log('Organization created successfully:', organizationData)

    // Check if the response includes access token
    if (organizationData.access_token) {
      return NextResponse.json({
        success: true,
        message: 'Account created successfully',
        organization: organizationData,
        access_token: organizationData.access_token,
        refresh_token: organizationData.refresh_token,
        user: organizationData.user,
        autoLogin: true
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      organization: organizationData,
      autoLogin: false
    })

  } catch (error) {
    console.error('Account creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
