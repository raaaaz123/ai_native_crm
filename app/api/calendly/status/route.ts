import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get('workspace_id');
    const agentId = searchParams.get('agent_id');

    if (!workspaceId || !agentId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing workspace_id or agent_id query parameters' 
        },
        { status: 400 }
      );
    }

    console.log('📊 Proxying Calendly status request:', { workspaceId, agentId });

    // Proxy request to backend
    const backendResponse = await fetch(
      `${API_BASE_URL}/api/calendly/status?workspace_id=${workspaceId}&agent_id=${agentId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const backendData = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: backendData.detail || backendData.error || 'Failed to get Calendly status' 
        },
        { status: backendResponse.status }
      );
    }

    // Return the backend response directly
    return NextResponse.json(backendData);

  } catch (error: unknown) {
    console.error('❌ Error in Calendly status API route:', error);
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

