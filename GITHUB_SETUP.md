# Git & GitHub Setup Guide

## Initialize Git Repository

If not already initialized:

```bash
cd d:\Aiagentdemo

# Initialize git
git init

# Set user (if not configured)
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Add all files
git add .

# Initial commit
git commit -m "Initial commit: Plexus Property AI Agent - Production-ready web app"
```

## Remote Repository Setup

### On GitHub

1. Create new repository on GitHub
   - Name: `plexus-property-ai`
   - Description: "Plexus Property AI Agent - Professional AI-powered real estate assistant with chatbot, voice, and admin dashboard"
   - Public or Private (your choice)
   - DO NOT initialize with README (we have one)
   - Add .gitignore: None (we have one)
   - License: MIT

2. Add remote and push:

```bash
# Add remote
git remote add origin https://github.com/YOUR_USERNAME/plexus-property-ai.git

# Rename branch if needed
git branch -M main

# Push to GitHub
git push -u origin main
```

## GitHub Repository Settings

### 1. General
- ✅ Default branch: `main`
- ✅ Delete branch on merge: Enabled
- ✅ Require conversation resolution: Enabled

### 2. Branch Protection (Optional)
- Require pull request reviews: 1
- Require status checks to pass: Yes
- Include administrators: Yes

### 3. Actions (CI/CD)
- Create `.github/workflows/build.yml`:

```yaml
name: Build & Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - run: npm ci --legacy-peer-deps
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      - run: npm run build
```

## Commit Messages Convention

Use conventional commits:

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Code style changes (formatting, missing semicolons, etc)
refactor: Code refactoring
test: Add tests
chore: Dependency updates, build config
perf: Performance improvements
ci: CI/CD configuration
```

Examples:
```bash
git commit -m "feat: Add voice assistant with speech recognition"
git commit -m "fix: Fix rate limiting on chat endpoint"
git commit -m "docs: Update deployment guide for Vercel"
git commit -m "test: Add validation tests for lead form"
```

## Branching Strategy

For development:

```bash
# Create feature branch
git checkout -b feature/chat-improvements

# Make changes and commit
git add .
git commit -m "feat: Improve chat response handling"

# Push to GitHub
git push origin feature/chat-improvements

# Create Pull Request on GitHub
# After merge, delete branch
git branch -d feature/chat-improvements
```

Branch naming:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation
- `refactor/` - Code refactoring
- `test/` - Tests

## Secrets & Sensitive Data

NEVER commit:
- `.env.local`
- `.env.production`
- API keys
- Database passwords
- Private credentials

Check `.gitignore` (already configured):
```
.env
.env.local
.env.production
.env.production.local
```

## GitHub Badges (Optional)

Add to README.md:

```markdown
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Node.js CI](https://github.com/YOUR_USERNAME/plexus-property-ai/workflows/Build%20&%20Test/badge.svg)](https://github.com/YOUR_USERNAME/plexus-property-ai/actions)
[![Code coverage](https://img.shields.io/badge/coverage-50%25-green.svg)](./docs/testing.md)
```

## Release Management

For releases:

```bash
# Tag version
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push tags
git push origin v1.0.0

# Create Release on GitHub with changelog
```

## Collaboration

For team development:

1. **Code Review Process**
   - Create PR for all changes
   - Request review from team members
   - Address review comments
   - Merge only after approval

2. **Issue Tracking**
   - Use GitHub Issues for bugs/features
   - Link PRs to issues: "Fixes #123"
   - Label issues (bug, feature, documentation, help-wanted)

3. **Project Management**
   - Use GitHub Projects for kanban board
   - Track issues and PRs
   - Plan sprints

## Deployment Automation

### Vercel Integration

1. Connect GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Auto-deploy on push to main branch

```bash
# Vercel CLI (optional)
npm install -g vercel
vercel link
vercel deploy
vercel deploy --prod
```

## GitHub Pages (Optional)

Deploy docs to GitHub Pages:

1. Enable GitHub Pages in Settings
2. Source: `docs/` folder or `gh-pages` branch
3. Access at: `https://YOUR_USERNAME.github.io/plexus-property-ai`

## Maintenance

Regular maintenance tasks:

```bash
# Check for outdated packages
npm outdated

# Update dependencies
npm update

# Security audit
npm audit

# Fix vulnerabilities
npm audit fix
```

Commit updates:
```bash
git commit -m "chore: Update dependencies"
```

## Useful GitHub Features

### 1. GitHub Actions (CI/CD)
- Already configured with `.github/workflows/build.yml`
- Runs on every push and PR
- Checks linting, types, tests, build

### 2. GitHub Discussions
- Enable in repository settings
- Use for Q&A and discussions
- Keep issues for bugs/features only

### 3. Security Features
- Enable branch protection
- Enable CODEOWNERS file
- Setup security scanning
- Review dependabot alerts

## CODEOWNERS (Optional)

Create `.github/CODEOWNERS`:

```
# Default owners for repo
* @yourname

# API routes need review
src/app/api/ @yourname @coauthor

# Database schema
prisma/ @yourname @dba

# Admin dashboard
src/app/admin/ @yourname @ui-team
```

## Final Checklist

- [ ] Repository created on GitHub
- [ ] Remote added locally
- [ ] Initial commit pushed
- [ ] README displays correctly
- [ ] All files present
- [ ] No secrets in repo
- [ ] Branch protection enabled (optional)
- [ ] GitHub Actions running (optional)
- [ ] Vercel connected (optional)
- [ ] Collaborators added (optional)

---

Now your project is GitHub-ready! 🎉

**Pro Tips:**
- Keep commits atomic (one change per commit)
- Write clear commit messages
- Use PRs for all changes
- Keep main branch stable
- Review code before merging
- Update documentation with changes
