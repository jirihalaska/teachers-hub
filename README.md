# TeachersHub

TeachersHub is a minimal, self‑hosted platform for publishing courses, managing tutors and accepting student registrations. It uses **Next.js** for the frontend and **Supabase** for the backend (Postgres + Auth + Storage + Edge Functions). This repository contains all the source code you need to run your own instance.

## Features

- List upcoming courses with dates, prices and capacity.
- Display a detailed course page with featured image, YouTube video, schedule, tutor info and a registration button.
- Manage tutors and courses via an admin dashboard (role‑based access control).
- Student account page showing profile information and their course registrations.
- Register for a course using Google OAuth or magic‑link email login. Capacity is enforced via an Edge Function that locks the course row and prevents overselling.
- Fully typed and ready to extend.

## Prerequisites

- **Node.js ≥18** and `npm` installed on your development machine.
- A **Supabase** project with the free or pro plan.
- **Supabase CLI** installed (`npm install -g supabase`).

## Getting started

1. **Clone** this repository or download it from your Git provider.

2. **Environment variables**: copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

   ```bash
   cp .env.local.example .env.local
   # Then edit .env.local and set:
   # NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
   # NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   # SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
   ```

3. **Install dependencies**:

   ```bash
   npm install
   ```

4. **Initialize the database**: make sure the Supabase CLI is logged in (`supabase login`) and linked to your project. Then push the schema in `supabase/schema.sql` to your database:

   ```bash
   supabase db push
   ```

   This will create the `profiles`, `tutors`, `courses` and `registrations` tables, the `course_counts` view, the `lock_course_and_count` RPC, and configure row‑level security policies.

5. **Deploy Edge Function**: deploy the `claim-seat` function which enforces capacity when registering:

   ```bash
   supabase functions deploy claim-seat
   ```

6. **Run locally**: start the Next.js development server. In another terminal you can run the functions server for local testing.

   ```bash
   # start Next.js
   npm run dev
   
   # (optional) start Edge Functions locally
   supabase functions serve
   ```

7. **Create data**: using the Supabase dashboard, insert tutors and courses. Each course must reference a tutor. You can also use the SQL editor to insert data directly.

8. **Deploy to Vercel**: sign in to Vercel, import this Git repository and set the environment variables there. Vercel will automatically build and deploy your Next.js app. Make sure to add the `SUPABASE_SERVICE_ROLE_KEY` as an environment variable in the **Server** scope so that the API route can call the Edge Function.

## File structure

```
supabase/schema.sql           # Database schema and policies
supabase/functions/claim-seat # Edge Function to reserve seats
src/lib/supabaseBrowser.ts    # Helper for Supabase client in the browser
src/lib/supabaseServer.ts     # Helper for Supabase client on the server
src/app/page.tsx              # Home page (course list)
src/app/courses/[id]/page.tsx # Course detail page
src/app/courses/[id]/RegisterButton.tsx  # Client component for registration
src/app/tutors/*              # Tutor pages
src/app/account/page.tsx      # User account page
src/app/admin/*               # Admin dashboard and course detail pages
```

Feel free to extend the functionality: add editing interfaces for admins, support recurring courses, or integrate payment processing with Stripe. The supplied code provides a strong foundation without relying on WordPress or other heavy systems.