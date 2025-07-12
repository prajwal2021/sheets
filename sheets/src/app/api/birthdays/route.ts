import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, date, email, comments } = body;

    // Validate required fields
    if (!name || !date) {
      return NextResponse.json(
        { error: 'Name and date are required' },
        { status: 400 }
      );
    }

    // Insert new birthday into Supabase
    const { data, error } = await supabase
      .from('birthdays')
      .insert([
        {
          name,
          date,
          email: email || null,
          comments: comments || null,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save birthday' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Birthday saved successfully', birthday: data },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving birthday:', error);
    return NextResponse.json(
      { error: 'Failed to save birthday' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('birthdays')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to read birthdays' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error reading birthdays:', error);
    return NextResponse.json(
      { error: 'Failed to read birthdays' },
      { status: 500 }
    );
  }
} 