# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be set up

## 2. Create the Database Table

Run this SQL in your Supabase SQL editor:

```sql
CREATE TABLE birthdays (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  email VARCHAR(255),
  comments TEXT,
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE birthdays ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (for development)
CREATE POLICY "Allow all operations" ON birthdays FOR ALL USING (true);
```

## 3. Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the following values:
   - Project URL
   - anon/public key
   - service_role key (keep this secret!)

## 4. Set Up Resend for Email Alerts

1. Go to [resend.com](https://resend.com) and create an account
2. Navigate to API Keys and create a new API key
3. Copy the API key (keep this secret!)
4. Verify your domain in Resend (or use the sandbox domain for testing)
5. Update the `from` email in `/src/app/api/send-birthday-email/route.ts` with your verified domain

## 5. Set Up Environment Variables

Create a `.env.local` file in your project root with:

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
RESEND_API_KEY=your_resend_api_key_here
```

## 6. Set Up Email Scheduling (Optional)

To automatically send birthday emails daily, you can:

1. **Use a cron job service** like Vercel Cron Jobs (if deploying to Vercel)
2. **Use a third-party service** like cron-job.org
3. **Set up a cron job** on your server

Example cron job to run daily at 9 AM:
```bash
0 9 * * * curl -X GET https://your-domain.com/api/send-birthday-email
```

## 7. Restart Your Development Server

```bash
npm run dev
```

Your birthday reminder app will now save data to Supabase and send email alerts! 