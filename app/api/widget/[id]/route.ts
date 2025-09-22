import { NextRequest, NextResponse } from 'next/server';
import { getChatWidget } from '@/app/lib/chat-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const widgetId = params.id;
    
    if (!widgetId) {
      return NextResponse.json(
        { error: 'Widget ID is required' },
        { status: 400 }
      );
    }

    const result = await getChatWidget(widgetId);
    
    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: 'Widget not found' },
        { status: 404 }
      );
    }

    const widget = result.data;
    
    // Return only the necessary configuration for the embed script
    const config = {
      id: widget.id,
      name: widget.name,
      welcomeMessage: widget.welcomeMessage,
      primaryColor: widget.primaryColor,
      position: widget.position,
      buttonText: widget.buttonText,
      placeholderText: widget.placeholderText,
      offlineMessage: widget.offlineMessage,
      collectEmail: widget.collectEmail,
      collectPhone: widget.collectPhone,
      autoReply: widget.autoReply,
      businessHours: widget.businessHours,
      isActive: widget.isActive
    };

    return NextResponse.json(config, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error fetching widget config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}