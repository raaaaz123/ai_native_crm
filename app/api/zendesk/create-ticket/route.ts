import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, agentId, subject, commentBody, requesterEmail, requesterName, tags } = body;

    if (!workspaceId || !agentId || !subject || !commentBody) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: workspaceId, agentId, subject, and commentBody are required' 
        },
        { status: 400 }
      );
    }

    console.log('🎫 Proxying Zendesk ticket creation request:', { workspaceId, agentId, subject, requesterName });

    // Proxy request to backend
    const backendResponse = await fetch(`${API_BASE_URL}/api/zendesk/create-ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workspace_id: workspaceId,
        agent_id: agentId,
        subject: subject,
        comment_body: commentBody,
        requester_email: requesterEmail,
        requester_name: requesterName || 'Customer',
        tags: tags
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
      ticketId: backendData.data?.ticket_id
    });

    if (!backendResponse.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: backendData.detail || backendData.error || 'Failed to create Zendesk ticket' 
        },
        { status: backendResponse.status }
      );
    }

    // Return the backend response directly
    return NextResponse.json(backendData);

  } catch (error: unknown) {
    console.error('❌ Error in Zendesk create ticket API route:', error);
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

