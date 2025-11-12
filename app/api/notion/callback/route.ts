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
        new URL(`/dashboard?notion_error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/dashboard?notion_error=missing_code', request.url)
      );
    }

    // Parse state to get workspace and agent info (ensure we decode percent-encoding)
    let workspaceId = '';
    let agentId = '';
    if (state) {
      try {
        const decodedState = decodeURIComponent(state);
        const parts = decodedState.split(':');
        workspaceId = parts[0] || '';
        agentId = parts[1] || '';
      } catch {
        // Fallback to raw state if decoding fails
        const parts = state.split(':');
        workspaceId = parts[0] || '';
        agentId = parts[1] || '';
      }
    }

    // Exchange code for access token
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://git-branch-m-main.onrender.com';
    const response = await fetch(`${backendUrl}/api/notion/oauth/callback`, {
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
        new URL(`/dashboard?notion_error=token_exchange_failed`, request.url)
      );
    }

    const tokenData = await response.json();

    if (!tokenData.success || !tokenData.access_token) {
      return NextResponse.redirect(
        new URL(`/dashboard?notion_error=invalid_token`, request.url)
      );
    }

    // Encode token data to pass to client-side for saving
    const connectionData = {
      workspaceId,
      agentId: agentId || null,
      accessToken: tokenData.access_token,
      notionWorkspaceId: tokenData.notion_workspace_id,
      notionWorkspaceName: tokenData.notion_workspace_name,
      notionWorkspaceIcon: tokenData.notion_workspace_icon,
      botId: tokenData.bot_id,
      owner: tokenData.owner
    };

    // Base64 encode to safely pass through URL
    const encodedData = Buffer.from(JSON.stringify(connectionData)).toString('base64');

    // Resolve redirect target from token data (may be percent-encoded and/or absolute)
    const rawRedirect = tokenData.redirect_uri as string | undefined;
    let decodedRedirect = '';
    if (rawRedirect && rawRedirect.length > 0) {
      try {
        decodedRedirect = decodeURIComponent(rawRedirect);
      } catch {
        decodedRedirect = rawRedirect;
      }
    }

    // Determine redirect URL based on context
    let redirectUrl = decodedRedirect;

    // If no redirect provided, determine based on agent_id
    if (!redirectUrl) {
      if (agentId === 'create-new-agent' || !agentId) {
        // Redirect back to workspace dashboard when in create-new-agent flow
        // The create-new-agent page will handle the callback on its own
        redirectUrl = `/dashboard/${workspaceId}/create-new-agent/knowledgebase?type=notion`;
      } else {
        // Normal agent flow - redirect to agent's Notion sources page
        redirectUrl = `/dashboard/${workspaceId}/agents/${agentId}/sources/notion`;
      }
    }

    // Append notion_data safely
    const separator = redirectUrl.includes('?') ? '&' : '?';
    const finalRedirect = `${redirectUrl}${separator}notion_data=${encodedData}`;

    // If absolute URL, redirect directly; otherwise resolve against current origin
    const isAbsolute = /^https?:\/\//i.test(finalRedirect);
    if (isAbsolute) {
      return NextResponse.redirect(finalRedirect);
    }

    // Ensure relative paths start with '/'
    const normalized = finalRedirect.startsWith('/') ? finalRedirect : `/${finalRedirect}`;
    return NextResponse.redirect(new URL(normalized, request.url));

  } catch (error) {
    console.error('Error handling Notion OAuth callback:', error);
    return NextResponse.redirect(
      new URL('/dashboard?notion_error=unknown', request.url)
    );
  }
}
