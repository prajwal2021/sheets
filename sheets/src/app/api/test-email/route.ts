import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Call the birthday email endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/send-birthday-email`, {
      method: 'GET',
    });

    const result = await response.json();

    return NextResponse.json({
      message: 'Test email check completed',
      result
    });
  } catch (error) {
    console.error('Error testing email:', error);
    return NextResponse.json(
      { error: 'Failed to test email functionality' },
      { status: 500 }
    );
  }
} 