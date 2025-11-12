import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://git-branch-m-main.onrender.com';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // If error, return HTML page that sends error message to parent window (for popup mode)
    if (error) {
      // Parse state to get workspace and agent info
      let workspaceId = '';
      let agentId = '';
      let workspaceSlug = '';
      if (state) {
        const stateParts = state.split(':');
        workspaceId = stateParts[0] || '';
        agentId = stateParts[1] || '';
        workspaceSlug = stateParts[2] || '';
      }

      const baseUrl = request.url.split('/api')[0];
      const errorMsg = errorDescription || error;
      
      // Return HTML page that sends error message to parent window
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>WhatsApp Connection Error</title>
        </head>
        <body>
          <script>
            // Send error message to parent window
            if (window.opener) {
              window.opener.postMessage({
                type: 'WHATSAPP_ERROR',
                error: '${errorMsg.replace(/'/g, "\\'")}'
              }, '${baseUrl}');
              // Close popup after a short delay
              setTimeout(function() {
                window.close();
              }, 2000);
            } else {
              // If not in popup, redirect normally
              window.location.href = '${workspaceSlug ? `${baseUrl}/dashboard/${workspaceSlug}/agents/${agentId}/deploy/whatsapp?whatsapp_error=${encodeURIComponent(errorMsg)}` : `${baseUrl}/dashboard?whatsapp_error=${encodeURIComponent(errorMsg)}`}';
            }
          </script>
          <p>Error: ${errorMsg}</p>
          <p>This window will close automatically.</p>
        </body>
        </html>
      `;
      
      return new NextResponse(htmlContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }

    if (!code || !state) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing authorization code or state' 
        },
        { status: 400 }
      );
    }

    // Parse state to get workspace_id, agent_id, and optionally workspace_slug
    // Format: "workspace_id:agent_id" or "workspace_id:agent_id:workspace_slug"
    const stateParts = state.split(':');
    const workspaceId = stateParts[0];
    const agentId = stateParts[1];
    const workspaceSlug = stateParts[2] || ''; // Optional workspace slug

    if (!workspaceId || !agentId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid state parameter' 
        },
        { status: 400 }
      );
    }

    console.log('🔄 Handling WhatsApp OAuth callback:', {
      code: code.substring(0, 10) + '...',
      workspaceId,
      agentId,
      state
    });

    // Proxy request to backend
    const backendResponse = await fetch(`${API_BASE_URL}/api/whatsapp/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        state,
        workspace_id: workspaceId,
        agent_id: agentId
      }),
    });

    const backendData = await backendResponse.json();

    console.log('📥 Backend callback response:', {
      status: backendResponse.status,
      success: backendData.success
    });

    const baseUrl = request.url.split('/api')[0];

    if (!backendResponse.ok) {
      // Return HTML page that sends error message to parent window (for popup mode)
      const errorMsg = backendData.detail || backendData.error || 'Connection failed';
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>WhatsApp Connection Error</title>
        </head>
        <body>
          <script>
            // Send error message to parent window
            if (window.opener) {
              window.opener.postMessage({
                type: 'WHATSAPP_ERROR',
                error: '${errorMsg.replace(/'/g, "\\'")}'
              }, '${baseUrl}');
              // Close popup after a short delay
              setTimeout(function() {
                window.close();
              }, 2000);
            } else {
              // If not in popup, redirect normally
              window.location.href = '${workspaceSlug ? `${baseUrl}/dashboard/${workspaceSlug}/agents/${agentId}/deploy/whatsapp?whatsapp_error=${encodeURIComponent(errorMsg)}` : `${baseUrl}/dashboard?whatsapp_error=${encodeURIComponent(errorMsg)}`}';
            }
          </script>
          <p>Error: ${errorMsg}</p>
          <p>This window will close automatically.</p>
        </body>
        </html>
      `;
      
      return new NextResponse(htmlContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }

    // Success - return HTML page that sends message to parent window (for popup mode)
    // This allows the popup to communicate with the parent window
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>WhatsApp Connected</title>
      </head>
      <body>
        <script>
          // Send success message to parent window
          if (window.opener) {
            window.opener.postMessage({
              type: 'WHATSAPP_CONNECTED',
              workspaceId: '${workspaceId}',
              agentId: '${agentId}'
            }, '${baseUrl}');
            // Close popup after a short delay
            setTimeout(function() {
              window.close();
            }, 1000);
          } else {
            // If not in popup, redirect normally
            window.location.href = '${workspaceSlug ? `${baseUrl}/dashboard/${workspaceSlug}/agents/${agentId}/deploy/whatsapp?whatsapp_connected=true` : `${baseUrl}/dashboard?whatsapp_connected=true&workspace_id=${workspaceId}&agent_id=${agentId}`}';
          }
        </script>
        <p>WhatsApp connected successfully! This window will close automatically.</p>
      </body>
      </html>
    `;
    
    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error: unknown) {
    console.error('❌ Error in WhatsApp callback API route:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    // Redirect to dashboard with error
    const redirectUrl = new URL('/dashboard', request.url);
    redirectUrl.searchParams.set('whatsapp_error', errorMessage);
    return NextResponse.redirect(redirectUrl);
  }
}


