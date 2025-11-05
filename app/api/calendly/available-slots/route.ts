import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get('workspace_id');
    const agentId = searchParams.get('agent_id');
    const eventTypeUri = searchParams.get('event_type_uri');
    const startTime = searchParams.get('start_time');
    const endTime = searchParams.get('end_time');

    if (!workspaceId || !agentId || !eventTypeUri) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameters: workspace_id, agent_id, or event_type_uri' 
        },
        { status: 400 }
      );
    }

    console.log('📅 Proxying Calendly available slots request:', {
      workspaceId,
      agentId,
      eventTypeUri,
      startTime,
      endTime
    });

    // Build query parameters
    const params = new URLSearchParams({
      workspace_id: workspaceId,
      agent_id: agentId,
      event_type_uri: eventTypeUri
    });
    
    if (startTime) params.append('start_time', startTime);
    if (endTime) params.append('end_time', endTime);

    // Proxy request to backend
    const backendResponse = await fetch(
      `${API_BASE_URL}/api/calendly/available-slots?${params.toString()}`,
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
          error: backendData.detail || backendData.error || 'Failed to get available slots' 
        },
        { status: backendResponse.status }
      );
    }

    // Return the backend response directly
    return NextResponse.json(backendData);

  } catch (error: unknown) {
    console.error('❌ Error in Calendly available slots API route:', error);
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

