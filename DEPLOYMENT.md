# InterviewBoost AI — Deployment Guide

## Prerequisites

- Node.js 18+ installed
- A [Supabase](https://supabase.com) project
- An [OpenAI](https://platform.openai.com) API key
- A [Stripe](https://stripe.com) account (for subscriptions)
- A [Vercel](https://vercel.com) account (for deployment)

---

## Step 1: Clone & Install

```bash
cd interview-boost-ai
npm install
```

## Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Go to **Settings > API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`
4. Go to **Authentication > Providers** and enable:
   - **Email** (enabled by default)
   - **Google** (add your Google OAuth credentials)

## Step 3: Set Up OpenAI

1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an API key
3. Copy it → `OPENAI_API_KEY`

> **Note**: The app works without an OpenAI key using heuristic fallbacks, but AI features will use template responses.

## Step 4: Set Up Stripe (Optional)

1. Go to [stripe.com](https://stripe.com) and create an account
2. Create two products in Stripe Dashboard:
   - **Premium Monthly**: $9.99/month → copy Price ID → `STRIPE_PREMIUM_MONTHLY_PRICE_ID`
   - **Premium Yearly**: $99.00/year → copy Price ID → `STRIPE_PREMIUM_YEARLY_PRICE_ID`
3. Copy your keys:
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY`
4. For webhooks (after deployment):
   - Add webhook endpoint: `https://your-domain.com/api/stripe/webhook`
   - Events to listen for: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
   - Copy Webhook signing secret → `STRIPE_WEBHOOK_SECRET`

## Step 5: Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=sk-your-api-key

# Stripe
STRIPE_SECRET_KEY=sk_test_your_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_xxx
STRIPE_PREMIUM_YEARLY_PRICE_ID=price_xxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 6: Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 7: Deploy to Vercel or Netlify

### Option A: Deploy to Netlify (Recommended)

1. Push your code to a GitHub repository.
2. Go to your [Netlify Dashboard](https://app.netlify.com/) and click **Add new site > Import an existing project**.
3. Select your git provider (GitHub) and authorize it.
4. Select your repository.
5. In **Build settings**, configure the following:
   - **Base directory**: `interview-boost-ai` (very important since the project is in a subdirectory)
   - **Build command**: `npm run build`
   - **Publish directory**: `interview-boost-ai/.next`
6. Click **Environment variables** and add the following keys from your `.env.local` file:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
   - `JOOBLE_API_KEY`
   - `NEXT_PUBLIC_APP_URL` (Set this to your live Netlify domain once generated, e.g., `https://careerlift-ai.netlify.app`)
7. Click **Deploy**.

### Option B: Deploy to Vercel

#### 1. Vercel CLI
```bash
npm i -g vercel
vercel
```

#### 2. GitHub Integration
1. Push your code to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new).
3. Import your repository.
4. Add all environment variables from `.env.local`.
5. Set `NEXT_PUBLIC_APP_URL` to your Vercel domain (e.g., `https://careerlift-ai.vercel.app`).
6. Deploy.

### Post-Deployment (Both Platforms)

1. Update `NEXT_PUBLIC_APP_URL` in your Netlify/Vercel settings to your new production URL.
2. Add Stripe webhook endpoint pointing to `https://your-domain.com/api/stripe/webhook` (if Stripe is configured).
3. Update Google OAuth redirect URL in Google Cloud Console to include your production domain.
4. Update Supabase redirect URLs in Authentication settings.


---

## Project Structure

```
interview-boost-ai/
├── src/
│   ├── app/
│   │   ├── (auth)/                  # Auth pages (login, signup, forgot-password)
│   │   ├── (dashboard)/             # Dashboard pages (all features)
│   │   ├── api/                     # API routes
│   │   │   ├── applications/        # CRUD for job applications
│   │   │   ├── career-coach/        # AI chat endpoint
│   │   │   ├── cover-letter/        # Cover letter generation
│   │   │   ├── interview/           # Interview prep generation
│   │   │   ├── job/                 # Job description analysis
│   │   │   ├── resume/              # Resume analysis & optimization
│   │   │   └── stripe/              # Checkout & webhook
│   │   ├── auth/callback/           # OAuth callback
│   │   ├── globals.css              # Design system
│   │   ├── layout.tsx               # Root layout
│   │   └── page.tsx                 # Landing page
│   ├── components/
│   │   ├── dashboard/               # Dashboard components
│   │   ├── landing/                 # Landing page sections
│   │   └── ui/                      # Reusable UI components
│   ├── lib/                         # Clients & utilities
│   └── types/                       # TypeScript types
├── supabase/
│   └── schema.sql                   # Database schema
├── middleware.ts                     # Auth middleware
├── vercel.json                      # Deployment config
└── DEPLOYMENT.md                    # This file
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Missing env variable" errors | Check all env vars are set in `.env.local` |
| Supabase auth not working | Verify redirect URLs in Supabase dashboard |
| Google login not working | Check OAuth credentials and redirect URIs |
| Stripe webhooks failing | Verify webhook secret and endpoint URL |
| Build errors | Run `npm run build` locally to check for type errors |
