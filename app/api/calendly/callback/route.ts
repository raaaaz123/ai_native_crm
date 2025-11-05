import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing authorization code' 
        },
        { status: 400 }
      );
    }

    if (!state) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing state parameter' 
        },
        { status: 400 }
      );
    }

    // Parse state to get workspace_id and agent_id
    // Format: "workspace_id:agent_id"
    const [workspaceId, agentId] = state.split(':');

    if (!workspaceId || !agentId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid state parameter' 
        },
        { status: 400 }
      );
    }

    console.log('🔄 Handling Calendly OAuth callback:', {
      code: code.substring(0, 10) + '...',
      workspaceId,
      agentId,
      state
    });

    // Proxy request to backend
    const backendResponse = await fetch(`${API_BASE_URL}/api/calendly/callback`, {
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
      success: backendData.success,
      hasUserInfo: !!backendData.user_info
    });

    if (!backendResponse.ok) {
      console.error('❌ Backend callback error:', backendData);
      // Return HTML error page that can close the popup
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Calendly Connection Error</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: #f5f5f5;
              }
              .container {
                background: white;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                text-align: center;
                max-width: 400px;
              }
              h1 { color: #dc2626; margin-top: 0; }
              p { color: #666; }
              button {
                background: #3b82f6;
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 6px;
                cursor: pointer;
                font-size: 1rem;
                margin-top: 1rem;
              }
              button:hover { background: #2563eb; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Connection Failed</h1>
              <p>${backendData.detail || backendData.error || 'Failed to connect to Calendly'}</p>
              <button onclick="window.close()">Close Window</button>
            </div>
          </body>
        </html>
        `,
        {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
          },
        }
      );
    }

    // Return HTML success page that closes the popup and notifies parent
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Calendly Connected</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: #f5f5f5;
            }
            .container {
              background: white;
              padding: 2rem;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              text-align: center;
              max-width: 400px;
            }
            h1 { color: #10b981; margin-top: 0; }
            p { color: #666; }
            .spinner {
              border: 3px solid #f3f3f3;
              border-top: 3px solid #3b82f6;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 1rem auto;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Calendly Connected!</h1>
            <p>Your Calendly account has been successfully connected.</p>
            <div class="spinner"></div>
            <p>This window will close automatically...</p>
          </div>
          <script>
            // Notify parent window that connection was successful
            if (window.opener) {
              window.opener.postMessage({
                type: 'CALENDLY_CONNECTED',
                success: true
              }, '*');
            }
            
            // Close the popup after a short delay
            setTimeout(() => {
              window.close();
            }, 1500);
          </script>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );

  } catch (error: unknown) {
    console.error('❌ Error in Calendly callback API route:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    // Return HTML error page
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Calendly Connection Error</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: #f5f5f5;
            }
            .container {
              background: white;
              padding: 2rem;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              text-align: center;
              max-width: 400px;
            }
            h1 { color: #dc2626; margin-top: 0; }
            p { color: #666; }
            button {
              background: #3b82f6;
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 6px;
              cursor: pointer;
              font-size: 1rem;
              margin-top: 1rem;
            }
            button:hover { background: #2563eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Connection Error</h1>
            <p>${errorMessage}</p>
            <button onclick="window.close()">Close Window</button>
          </div>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
  }
}

