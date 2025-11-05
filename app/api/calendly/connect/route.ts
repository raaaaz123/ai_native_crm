import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, agentId } = body;

    if (!workspaceId || !agentId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing workspaceId or agentId' 
        },
        { status: 400 }
      );
    }

    console.log('🔗 Proxying Calendly connection request:', { workspaceId, agentId });

    // Proxy request to backend
    const backendResponse = await fetch(`${API_BASE_URL}/api/calendly/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workspace_id: workspaceId,
        agent_id: agentId
      }),
    });

    const backendData = await backendResponse.json();

    console.log('📥 Backend response:', {
      status: backendResponse.status,
      success: backendData.success,
      hasAuthUrl: !!backendData.data?.authorization_url
    });

    if (!backendResponse.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: backendData.detail || backendData.error || 'Failed to initiate Calendly connection' 
        },
        { status: backendResponse.status }
      );
    }

    // Return the backend response directly
    return NextResponse.json(backendData);

  } catch (error: unknown) {
    console.error('❌ Error in Calendly connect API route:', error);
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

