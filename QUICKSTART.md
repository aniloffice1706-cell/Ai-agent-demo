# Plexus Property AI Agent - Quick Start Guide

## Installation Steps

### 1. Install Dependencies
Open terminal/PowerShell in the project root and run:

```bash
npm install --legacy-peer-deps
```

### 2. Setup Environment
Copy `.env.example` to `.env.local` and update with your values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/lucknow_ai_agent"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
```

### 3. Database Setup (if using local PostgreSQL)
```bash
npm run db:migrate
npm run db:seed
```

### 4. Development Server
```bash
npm run dev
```

Visit: http://localhost:3000

## Linting & Type Checking

```bash
npm run lint
npm run type-check
```

## Build for Production

```bash
npm run build
npm run start
```

## Testing

```bash
npm run test
npm run test:coverage
```

## Common Issues

### npm install fails
Try: `npm install --legacy-peer-deps`

### Database connection error
- Ensure PostgreSQL is running
- Verify DATABASE_URL in .env.local
- Check database exists and user has permissions

### Port 3000 already in use
Try: `PORT=3001 npm run dev`

### Prisma errors
Clear cache: `rm -rf node_modules/.prisma && npm run db:generate`

## Admin Login

After seeding:
- Email: admin@plexus-property.com  
- Password: AdminPassword123!

## Features to Try

1. **Home Page**: http://localhost:3000
2. **Chat**: Click "Chat with AI" button
3. **Voice**: http://localhost:3000/voice
4. **Admin Dashboard**: http://localhost:3000/admin/login

## Next Steps

1. Update `.env.local` with real AI API keys
2. Configure database (PostgreSQL)
3. Customize admin password
4. Test all features
5. Deploy to Vercel

## Support

See README.md for full documentation
