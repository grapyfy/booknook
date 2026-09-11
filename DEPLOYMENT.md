# Deployment to Vercel

**Quick Setup (5 min):**

1. Go to **https://vercel.com/new**
2. Click **Import Git Repository**
3. Enter: `https://github.com/abhayyy-singh/booknook`
4. Click **Import**
5. On the environment variables screen, add these 5 variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://tapcxqglvwyuyejqlukn.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_zAFyelrtlO7tZv9Smo67Rg_Y4G3rUw6`
   - `SUPABASE_SECRET_KEY` = `sb_secret_VSeeNho8KXcEZb8W4nuwyw_9aGfKtXb`
   - `DATABASE_URL` = `postgresql://postgres:rishupratham%235911@db.tapcxqglvwyuyejqlukn.supabase.co:5432/postgres?pgbouncer=true`
   - `DIRECT_URL` = `postgresql://postgres:rishupratham%235911@db.tapcxqglvwyuyejqlukn.supabase.co:5432/postgres`
6. Click **Deploy**
7. Wait for deployment to complete (2-3 min)

**Your app will be live at:** `https://booknook.vercel.app` (or similar)

---

## After Deployment

1. Navigate to the deployed URL
2. Login with: `demo@hotel.com` / `demo123456`
3. All pages now load live data from Supabase, not mocks

---

## Auto-Deployments

Every `git push` to `main` will auto-deploy to Vercel (configured in `vercel.json`)

