import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/register - Register proxy to Core Platform
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, organizationName } = body;

    if (!name || !email || !password || !organizationName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Call Core Platform register API
    const coreUrl = process.env.CORE_API_URL || 'http://localhost:3000';
    const response = await fetch(`${coreUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, organizationName }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Forward the Set-Cookie header from Core Platform
    const headers = new Headers();
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      headers.set('set-cookie', setCookie);
    }

    return NextResponse.json(data, { headers, status: response.status });
  } catch (error) {
    console.error('Register proxy error:', error);
    return NextResponse.json(
      { error: `Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

