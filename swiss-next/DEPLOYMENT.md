# SwissCars Deployment Guide

This guide covers different deployment options for the SwissCars Next.js application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Build the Application](#build-the-application)
3. [Deployment Options](#deployment-options)
   - [Option 1: Manual VPS Deployment (File Manager)](#option-1-manual-vps-deployment-file-manager)
   - [Option 2: VPS with SSH](#option-2-vps-with-ssh)
   - [Option 3: Vercel (Recommended)](#option-3-vercel-recommended)
   - [Option 4: Docker](#option-4-docker)
4. [Environment Variables](#environment-variables)
5. [Post-Deployment](#post-deployment)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- Node.js 18+ installed locally
- Supabase project set up with:
  - Database tables created
  - Storage bucket `car-images` configured
  - Auth user(s) created for admin access
- Domain name (optional but recommended)

---

## Build the Application

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Create Environment File

Create `.env.local` (for local) or `.env.production` (for production):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX  # Optional
```

### Step 3: Build for Production

```bash
npm run build
```

This creates:
- `.next/` folder - Compiled application
- `.next/standalone/` - Standalone server (if configured)

---

## Deployment Options

### Option 1: Manual VPS Deployment (File Manager)

This method is for VPS hosting with cPanel, DirectAdmin, or similar file managers.

#### Requirements
- VPS with Node.js 18+ support
- File manager access (cPanel, DirectAdmin, etc.)
- SSH access OR ability to run Node.js apps from panel

#### Step-by-Step Guide

**1. Prepare the Build Locally**

```bash
# Clean previous builds
rm -rf .next node_modules

# Install and build
npm install
npm run build
```

**2. Create Deployment Package**

Create a ZIP file with these files/folders:

```
Files to include:
├── .next/                 # Compiled application (REQUIRED)
├── public/                # Static assets (REQUIRED)
├── package.json           # Dependencies (REQUIRED)
├── package-lock.json      # Lock file (REQUIRED)
├── next.config.ts         # Next.js config (REQUIRED)
├── middleware.ts          # Middleware (REQUIRED)
├── i18n/                  # i18n config (REQUIRED)
├── messages/              # Translations (REQUIRED)
├── .env.production        # Environment variables (REQUIRED)
└── node_modules/          # Dependencies (Optional - can npm install on server)
```

**Create ZIP (excluding node_modules to reduce size):**

```bash
zip -r swisscars-deploy.zip \
  .next \
  public \
  package.json \
  package-lock.json \
  next.config.ts \
  middleware.ts \
  i18n \
  messages \
  .env.production \
  -x "*.git*" \
  -x "*.DS_Store"
```

**3. Upload to VPS**

Using File Manager:
1. Log into your hosting panel (cPanel/DirectAdmin)
2. Open File Manager
3. Navigate to your website directory (e.g., `/home/user/swisscars/`)
4. Upload `swisscars-deploy.zip`
5. Extract the ZIP file

**4. Install Dependencies on Server**

If your hosting has Terminal/SSH access in the panel:

```bash
cd /home/user/swisscars
npm install --production
```

If no terminal, include `node_modules` in your ZIP (larger file, ~200MB+).

**5. Configure Node.js Application**

In cPanel (Node.js Selector):
1. Go to "Setup Node.js App"
2. Click "Create Application"
3. Configure:
   - Node.js version: 18.x or higher
   - Application mode: Production
   - Application root: `/home/user/swisscars`
   - Application URL: your-domain.com
   - Application startup file: `node_modules/next/dist/bin/next`
   - Arguments: `start`

In DirectAdmin (similar process):
1. Go to Node.js Selector
2. Create new application
3. Set entry point to run: `npm start`

**6. Set Environment Variables**

In the Node.js app configuration:
- Add each variable from `.env.production`
- Or ensure `.env.production` file is in the root directory

**7. Start the Application**

Click "Run" or "Start" in your Node.js app panel.

Your site should be live at your configured domain!

---

### Option 2: VPS with SSH

Direct server access via SSH for more control.

#### Step 1: Connect to Server

```bash
ssh user@your-server-ip
```

#### Step 2: Install Node.js (if not installed)

```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

#### Step 3: Clone or Upload Project

```bash
# Option A: Clone from Git
git clone https://github.com/your-repo/swisscars.git
cd swisscars

# Option B: Upload via SCP
scp -r ./swisscars-deploy user@server:/home/user/
```

#### Step 4: Install and Build

```bash
cd /home/user/swisscars
npm install
npm run build
```

#### Step 5: Create Environment File

```bash
nano .env.production
```

Add your environment variables.

#### Step 6: Run with PM2 (Process Manager)

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start npm --name "swisscars" -- start

# Save PM2 config (auto-restart on reboot)
pm2 save
pm2 startup
```

#### Step 7: Configure Nginx (Reverse Proxy)

```nginx
# /etc/nginx/sites-available/swisscars
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/swisscars /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 8: SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

### Option 3: Vercel (Recommended)

Easiest deployment option - automatic builds, SSL, CDN.

#### Step 1: Push to GitHub

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

#### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Import Project"
4. Select your repository
5. Configure:
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (or subdirectory if needed)
6. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_GA_MEASUREMENT_ID` (optional)
7. Click "Deploy"

Vercel automatically:
- Builds on every push
- Provides SSL certificate
- Sets up CDN
- Handles serverless functions

---

### Option 4: Docker

For containerized deployments.

#### Create Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### Update next.config.ts for Standalone

```typescript
const nextConfig: NextConfig = {
  output: 'standalone',
  // ... other config
};
```

#### Build and Run

```bash
# Build image
docker build -t swisscars .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your-url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  swisscars
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | No | Google Analytics ID |

**Security Notes:**
- Never commit `.env` files to git
- Use hosting provider's environment variable settings when possible
- The `NEXT_PUBLIC_` prefix means these are exposed to the browser (safe for anon key)

---

## Post-Deployment

### 1. Verify Supabase Connection

- Check that cars load on homepage
- Test admin login at `/login`
- Verify image uploads work

### 2. Configure Supabase Auth Redirect

In Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `https://your-domain.com`
- Redirect URLs: Add `https://your-domain.com/auth/callback`

### 3. Test All Features

- [ ] Homepage loads with cars
- [ ] Language switching works (RO/RU/EN)
- [ ] Car detail pages load
- [ ] Contact form submits
- [ ] Admin login works
- [ ] Admin can add/edit/delete cars
- [ ] Image uploads work

### 4. Set Up Monitoring (Optional)

- Vercel Analytics (if using Vercel)
- Google Analytics
- Uptime monitoring (UptimeRobot, Pingdom)

---

## Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### 500 Error on Production

- Check environment variables are set
- Verify Supabase credentials are correct
- Check server logs: `pm2 logs swisscars`

### Images Not Loading

- Verify Supabase storage bucket is public
- Check `next.config.ts` has correct remote patterns
- Ensure image URLs are correct in database

### Admin Login Not Working

- Verify Supabase Auth is configured
- Check redirect URLs in Supabase dashboard
- Ensure user exists in Supabase Auth

### Rate Limiting Issues

The contact form has rate limiting (10 requests/minute per IP). For testing, wait 1 minute or restart the server.

---

## Quick Reference

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build && npm start
```

### Run Tests
```bash
npm test
```

### View Logs (PM2)
```bash
pm2 logs swisscars
pm2 monit
```

### Restart Application (PM2)
```bash
pm2 restart swisscars
```
