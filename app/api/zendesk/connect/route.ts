import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, agentId, subdomain } = body;

    if (!workspaceId || !agentId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing workspaceId or agentId' 
        },
        { status: 400 }
      );
    }

    if (!subdomain) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing subdomain. Please provide your Zendesk subdomain.' 
        },
        { status: 400 }
      );
    }

    console.log('🔗 Proxying Zendesk connection request:', { workspaceId, agentId, subdomain });

    // Proxy request to backend
    const backendResponse = await fetch(`${API_BASE_URL}/api/zendesk/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workspace_id: workspaceId,
        agent_id: agentId,
        subdomain: subdomain
      }),
    });

    let backendData;
    try {
      backendData = await backendResponse.json();
    } catch (jsonError) {
      console.error('❌ Failed to parse backend response:', jsonError);
      const textResponse = await backendResponse.text();
      console.error('❌ Raw backend response:', textResponse);
      return NextResponse.json(
        { 
          success: false, 
          error: `Backend error: ${backendResponse.status} ${backendResponse.statusText}` 
        },
        { status: backendResponse.status || 500 }
      );
    }

    console.log('📥 Backend response:', {
      status: backendResponse.status,
      success: backendData.success,
      hasAuthUrl: !!backendData.data?.authorization_url,
      error: backendData.detail || backendData.error
    });

    if (!backendResponse.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: backendData.detail || backendData.error || 'Failed to initiate Zendesk connection' 
        },
        { status: backendResponse.status }
      );
    }

    // Return the backend response directly
    return NextResponse.json(backendData);

  } catch (error: unknown) {
    console.error('❌ Error in Zendesk connect API route:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    );
  }
}

