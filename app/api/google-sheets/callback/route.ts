import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle authorization error
    if (error) {
      return NextResponse.redirect(
        new URL(`/dashboard?google_sheets_error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/dashboard?google_sheets_error=missing_code', request.url)
      );
    }

    // Parse state to get workspace and agent info
    let workspaceId = '';
    let agentId = '';
    if (state) {
      const parts = state.split(':');
      workspaceId = parts[0] || '';
      agentId = parts[1] || '';
    }

    // Exchange code for access token
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://git-branch-m-main.onrender.com';
    const response = await fetch(`${backendUrl}/api/google-sheets/oauth/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        state
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OAuth callback error:', errorText);
      return NextResponse.redirect(
        new URL(`/dashboard?google_sheets_error=token_exchange_failed`, request.url)
      );
    }

    const tokenData = await response.json();

    if (!tokenData.success || !tokenData.access_token) {
      return NextResponse.redirect(
        new URL(`/dashboard?google_sheets_error=invalid_token`, request.url)
      );
    }

    // Encode token data to pass to client-side for saving
    const connectionData = {
      workspaceId,
      agentId: agentId || null,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in
    };

    // Base64 encode to safely pass through URL
    const encodedData = Buffer.from(JSON.stringify(connectionData)).toString('base64');

    // Redirect to sources/google-sheets page with connection data
    const redirectUrl = `/dashboard/${workspaceId}/agents/${agentId}/sources/google-sheets?google_sheets_data=${encodedData}`;

    return NextResponse.redirect(new URL(redirectUrl, request.url));

  } catch (error) {
    console.error('Error handling Google Sheets OAuth callback:', error);
    return NextResponse.redirect(
      new URL('/dashboard?google_sheets_error=unknown', request.url)
    );
  }
}
