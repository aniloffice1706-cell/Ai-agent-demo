# Integration Testing Checklist - Plexus Property AI Agent

## UI/UX Testing

### Landing Page
- [ ] Hero section displays correctly
- [ ] Features section responsive on mobile/tablet/desktop
- [ ] "Chat with AI" button functional
- [ ] "Voice Assistant" link navigates correctly
- [ ] Admin link navigates to login
- [ ] Footer displays with proper links
- [ ] No console errors

### Chat Widget
- [ ] Opens and displays welcome message
- [ ] Input field accepts text
- [ ] Send button triggers API
- [ ] Messages display with proper formatting
- [ ] Loading state shows while awaiting response
- [ ] Mobile responsive

### Voice Assistant
- [ ] Page loads without errors
- [ ] Microphone button toggles state
- [ ] Transcript area updates
- [ ] Stop button appears when listening
- [ ] No browser errors

### Admin Login
- [ ] Login form displays
- [ ] Email field validation works
- [ ] Password field hidden
- [ ] Submit button functional
- [ ] Invalid credentials show error
- [ ] Valid login redirects to dashboard

### Admin Dashboard
- [ ] Loads leads from database
- [ ] Filter dropdown works
- [ ] Status dropdown updates leads
- [ ] Export CSV downloads file
- [ ] Logout button functional
- [ ] Responsive design on mobile

## API Testing

### Chat API
- [ ] POST /api/chat accepts valid message
- [ ] Returns response object
- [ ] Rate limiting works (429 after 30 requests/min)
- [ ] Invalid request returns 400

### Leads API
- [ ] POST /api/leads creates lead
- [ ] GET /api/leads returns array
- [ ] GET /api/leads/[id] returns single lead
- [ ] PATCH /api/leads/[id] updates lead
- [ ] Invalid data returns 400
- [ ] Database saves data correctly

### Auth API
- [ ] POST /api/auth/login with valid credentials returns token
- [ ] Invalid credentials return 401
- [ ] Valid token can be used for authenticated requests

### Location API
- [ ] GET /api/location returns areas data
- [ ] Response includes all 12 Lucknow areas
- [ ] Property types included
- [ ] Budget ranges included

## Database Testing

### Schema
- [ ] All migrations apply successfully
- [ ] Tables created correctly
- [ ] Indexes present for performance
- [ ] Foreign keys establish relationships

### Seed Data
- [ ] Admin user created
- [ ] 12 Lucknow areas seeded
- [ ] Sample leads created
- [ ] Knowledge base document added

### Data Integrity
- [ ] User passwords hashed
- [ ] Lead phone format validated
- [ ] Timestamps set correctly
- [ ] Relationships maintained

## Security Testing

### Input Validation
- [ ] Oversized input rejected
- [ ] Special characters sanitized
- [ ] HTML tags removed
- [ ] SQL injection attempts blocked

### Authentication
- [ ] Session tokens generated correctly
- [ ] Expired sessions rejected
- [ ] Unauthorized access denied
- [ ] CSRF protection active

### Rate Limiting
- [ ] 30 requests per minute limit enforced
- [ ] 429 status returned on excess
- [ ] Rate limit headers present
- [ ] Per-IP tracking works

### Headers
- [ ] X-Content-Type-Options set
- [ ] X-Frame-Options set
- [ ] X-XSS-Protection set
- [ ] Referrer-Policy set
- [ ] Permissions-Policy set

## Performance Testing

### Frontend
- [ ] Page load time < 2 seconds
- [ ] First Contentful Paint < 1 second
- [ ] No memory leaks in chat
- [ ] Voice UI doesn't freeze UI

### Backend
- [ ] API response time < 500ms
- [ ] Database queries optimized
- [ ] No N+1 queries
- [ ] Connection pooling works

### Build
- [ ] Production build completes
- [ ] No build warnings
- [ ] Bundle size reasonable
- [ ] Tree shaking works

## Browser Compatibility

### Desktop
- [ ] Chrome/Edge latest
- [ ] Firefox latest
- [ ] Safari latest

### Mobile
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] Mobile responsiveness

## Accessibility

- [ ] Color contrast WCAG AA
- [ ] Keyboard navigation works
- [ ] Forms have proper labels
- [ ] Inputs have aria-labels
- [ ] Images have alt text

## Error Handling

- [ ] 404 for not found resources
- [ ] 400 for bad requests
- [ ] 401 for unauthorized
- [ ] 429 for rate limit
- [ ] 500 with generic message (no stack trace)
- [ ] Toast notifications for errors

## Documentation

- [ ] README.md complete and accurate
- [ ] API.md has all endpoints
- [ ] DEPLOYMENT.md covers Vercel
- [ ] QUICKSTART.md works
- [ ] .env.example has all vars
- [ ] CONTRIBUTING.md clear

## Git & Repository

- [ ] All files committed
- [ ] .gitignore excludes node_modules
- [ ] .gitignore excludes .env files
- [ ] .gitignore excludes build files
- [ ] No API keys in repository
- [ ] README in root
- [ ] LICENSE file present

---

## Before Production

### Mandatory
- [ ] npm run lint passes
- [ ] npm run type-check passes
- [ ] npm run test passes
- [ ] npm run build succeeds
- [ ] No warnings in build
- [ ] Security headers enabled
- [ ] Rate limiting active
- [ ] Database backed up

### Recommended
- [ ] npm audit shows no critical issues
- [ ] All tests pass with >50% coverage
- [ ] Performance benchmarks met
- [ ] Accessibility audit passed
- [ ] Security audit completed
- [ ] Load testing done (>100 concurrent users)

### Pre-Deployment
- [ ] Production environment variables set
- [ ] Database migrations run on prod DB
- [ ] Admin password changed
- [ ] HTTPS enabled
- [ ] Domain configured
- [ ] Email notifications ready
- [ ] Monitoring/logging setup
- [ ] Backup system configured

---

**All tests passing? Deploy with confidence! 🚀**
