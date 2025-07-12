import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    if (!resend) {
      return NextResponse.json(
        { error: 'Resend API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { to, name, birthdayPersonName } = body;

    if (!to || !name || !birthdayPersonName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: 'Birthday Reminder <onboarding@resend.dev>', // Using Resend's sandbox domain
      to: [to],
      subject: `🎉 It's ${birthdayPersonName}'s Birthday Today!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🎂 Happy Birthday!</h1>
            <p style="font-size: 18px; margin: 10px 0;">Today is ${birthdayPersonName}'s special day!</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
            <h2 style="color: #333; margin-top: 0;">Don't forget to:</h2>
            <ul style="color: #555; line-height: 1.6;">
              <li>Send them a birthday message</li>
              <li>Give them a call</li>
              <li>Plan something special</li>
              <li>Make their day memorable!</li>
            </ul>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #666; font-style: italic;">
                "The more you praise and celebrate your life, the more there is in life to celebrate."
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>This reminder was sent by your Birthday Reminder app</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Birthday email sent successfully', data },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending birthday email:', error);
    return NextResponse.json(
      { error: 'Failed to send birthday email' },
      { status: 500 }
    );
  }
}

// Function to check for birthdays and send emails
export async function GET() {
  try {
    const today = new Date();
    const month = today.getMonth() + 1; // getMonth() returns 0-11
    const day = today.getDate();

    // Query birthdays for today using SQL
    const { data: birthdays, error } = await supabase
      .from('birthdays')
      .select('*')
      .eq('email_sent', false)
      .or(`date.eq.${new Date().getFullYear()}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')},date.eq.${new Date().getFullYear() - 1}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch birthdays' },
        { status: 500 }
      );
    }

    if (!birthdays || birthdays.length === 0) {
      return NextResponse.json(
        { message: 'No birthdays today' },
        { status: 200 }
      );
    }

    // Process emails sequentially to avoid rate limiting
    const results = [];
    for (const birthday of birthdays) {
      if (!birthday.email || !resend) {
        results.push(null);
        continue;
      }

      try {
        // Add delay between emails to respect rate limits
        if (results.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        }

        // Send email
        const emailResponse = await resend.emails.send({
          from: 'Birthday Reminder <onboarding@resend.dev>', // Using Resend's sandbox domain
          to: [birthday.email],
          subject: `🎉 It's ${birthday.name}'s Birthday Today!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px;">🎂 Happy Birthday!</h1>
                <p style="font-size: 18px; margin: 10px 0;">Today is ${birthday.name}'s special day!</p>
              </div>
              
              <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
                <h2 style="color: #333; margin-top: 0;">Don't forget to:</h2>
                <ul style="color: #555; line-height: 1.6;">
                  <li>Send them a birthday message</li>
                  <li>Give them a call</li>
                  <li>Plan something special</li>
                  <li>Make their day memorable!</li>
                </ul>
                
                <div style="text-align: center; margin-top: 30px;">
                  <p style="color: #666; font-style: italic;">
                    "The more you praise and celebrate your life, the more there is in life to celebrate."
                  </p>
                </div>
              </div>
              
              <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                <p>This reminder was sent by your Birthday Reminder app</p>
              </div>
            </div>
          `,
        });

        if (emailResponse.error) {
          console.error('Failed to send email for:', birthday.name, emailResponse.error);
          results.push({ success: false, birthday: birthday.name, error: emailResponse.error });
          continue;
        }

        // Mark email as sent in database
        await supabase
          .from('birthdays')
          .update({ email_sent: true, email_sent_at: new Date().toISOString() })
          .eq('id', birthday.id);

        results.push({ success: true, birthday: birthday.name });
      } catch (error) {
        console.error('Error sending email for:', birthday.name, error);
        results.push({ success: false, birthday: birthday.name, error });
      }
    }

    const successful = results.filter(r => r && r.success);
    const failed = results.filter(r => r && !r.success);

    return NextResponse.json({
      message: `Processed ${birthdays.length} birthdays`,
      successful: successful.length,
      failed: failed.length,
      details: { successful, failed }
    });

  } catch (error) {
    console.error('Error processing birthday emails:', error);
    return NextResponse.json(
      { error: 'Failed to process birthday emails' },
      { status: 500 }
    );
  }
} 