# Deployment Guide - Plexus Property AI Agent

## Prerequisites
- Vercel account (for frontend)
- PostgreSQL database (cloud-hosted)
- OpenAI/Anthropic API keys

## Vercel Deployment (Frontend)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-repo
git push -u origin main
```

### Step 2: Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import GitHub repository
3. Configure environment variables in Vercel dashboard:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (your deployed URL)
   - `OPENAI_API_KEY` (optional)
   - `ANTHROPIC_API_KEY` (optional)

### Step 3: Deploy
```bash
vercel deploy --prod
```

## Database Setup

### Option 1: Supabase (PostgreSQL + Vector Support)
1. Create project on [supabase.com](https://supabase.com)
2. Get connection string from project settings
3. Add to `.env.production`:
   ```
   DATABASE_URL="postgresql://user:password@host:port/dbname"
   ```

### Option 2: AWS RDS
1. Create RDS PostgreSQL instance
2. Configure security groups
3. Use connection string

### Option 3: Railway
1. Create project on [railway.app](https://railway.app)
2. Add PostgreSQL plugin
3. Copy connection string

### Database Migration
```bash
# Production database migration
NODE_ENV=production npm run db:migrate

# Seed production (optional)
NODE_ENV=production npm run db:seed
```

## Environment Variables (Production)

```env
# Database - Use cloud PostgreSQL
DATABASE_URL="postgresql://user:password@db-host:5432/plexus_property_ai"

# Authentication
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"

# AI APIs (choose one or both)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# Security
JWT_SECRET="long-random-secret-key"
BCRYPT_ROUNDS=12

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES="pdf,docx,txt,jpg,png"
```

## Security Checklist

- [ ] Change default admin password immediately
- [ ] Enable HTTPS (automatic on Vercel)
- [ ] Set strong `NEXTAUTH_SECRET`
- [ ] Use environment variables for all secrets
- [ ] Enable database backups
- [ ] Setup rate limiting
- [ ] Monitor API usage
- [ ] Regular security audits
- [ ] Update dependencies: `npm audit fix`

## CI/CD Setup

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

## Monitoring & Logging

### Application Monitoring
- Use Vercel Analytics: Dashboard → Analytics
- Monitor error rates and performance

### Database Monitoring
- Setup automatic backups
- Monitor query performance
- Check connection pool usage

### Security Monitoring
- Monitor failed login attempts
- Track API endpoint usage
- Setup alerts for unusual activity

## Backup & Recovery

### Database Backup
```bash
# Weekly backup with pg_dump
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup-20240101.sql
```

## Scaling

### Database Scaling
- Monitor connection pool limits
- Upgrade PostgreSQL plan if needed
- Add read replicas for high load

### Frontend Scaling
- Vercel handles auto-scaling
- Monitor bandwidth usage
- Optimize images and assets

## Troubleshooting

### Build Fails
```bash
npm run build --verbose
# Check build errors in logs
```

### Database Connection Issues
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Memory Issues
```bash
# Check memory usage
node --max-old-space-size=4096 node_modules/.bin/next build
```

## Performance Optimization

### Frontend
- Enable image optimization
- Code splitting
- Caching strategies

### Backend
- Database indexing
- Query optimization
- Connection pooling

### Monitoring
```bash
npm run build --analyze
```

## Support

Issues? Check logs:
- Vercel: Dashboard → Deployments → Logs
- Database: Cloud provider dashboard
- Application: Monitor → Logs
