# Plexus Property AI Agent - Production Web App

A professional AI-powered real estate agent application with smart chatbot, voice assistant, and admin dashboard.

## 🚀 Features

### AI Chat
- Natural language conversations
- Support for Hindi, English, and Hinglish
- Lead qualification flow
- Context-aware responses using RAG

### Voice Assistant
- Speech-to-text recognition
- Text-to-speech responses
- Multilingual support
- Mobile-responsive interface

### Admin Dashboard
- Lead management and qualification
- Real-time lead status tracking
- CSV export functionality
- Document/knowledge base management
- Area and property data management

### Knowledge Base
- PDF/DOCX/Text upload
- Automatic text extraction and chunking
- Vector embeddings for semantic search
- RAG-powered responses

### Lucknow-Specific
- 12 major areas with facilities data
- 14+ property types
- Budget ranges for rent and purchase
- Local facility information (schools, hospitals, malls, etc.)

## 📋 Tech Stack

- **Frontend**: Next.js 14 + React 18 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth with JWT
- **Security**: bcryptjs, rate limiting, input validation with Zod
- **AI**: Claude/OpenAI API (configurable)
- **Voice**: Web Speech API
- **Testing**: Jest + React Testing Library

## 🛠 Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Git

### 1. Clone & Install

```bash
git clone <repository>
cd lucknow-ai-agent
npm install
```

### 2. Environment Setup

Create `.env.local`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/lucknow_ai_agent"

# Next Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"

# AI/LLM (optional)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# Security
JWT_SECRET="your-jwt-secret-key"
BCRYPT_ROUNDS=10

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES="pdf,docx,txt,jpg,png"
```

### 3. Database Setup

```bash
# Create migration
npm run db:migrate

# Seed initial data (admin user, areas, sample leads)
npm run db:seed

# View database (optional)
npm run db:studio
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🔐 Admin Access

Default credentials (change in production):
- **Email**: admin@plexus-property.com
- **Password**: AdminPassword123!

Admin Dashboard: [http://localhost:3000/admin/dashboard](http://localhost:3000/admin/dashboard)

## 📁 Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   ├── admin/            # Admin pages
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Landing page
│   └── voice/            # Voice assistant page
├── components/
│   ├── admin/            # Admin components
│   ├── chat/             # Chat components
│   ├── voice/            # Voice components
│   └── ui/               # Reusable UI components
├── lib/
│   ├── ai/               # AI/LLM integration
│   ├── db/               # Database utilities
│   ├── rag/              # RAG embeddings
│   ├── security/         # Auth, validation, rate limiting
│   └── lucknowData.ts    # Local Lucknow data
├── hooks/                # React hooks
├── types/                # TypeScript types
└── utils/                # Utility functions
prisma/                   # Database schema
tests/                    # Test files
scripts/                  # Seed, deployment scripts
docs/                     # Documentation
```

## 🧪 Testing

```bash
# Run tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

Tests included:
- RAG embedding tests
- Security validation tests
- Input sanitization tests
- Lead form validation tests

## 🔐 Security Features

- ✅ Rate limiting on AI endpoints
- ✅ Input validation with Zod
- ✅ SQL injection prevention (Prisma ORM)
- ✅ XSS protection (HTML sanitization)
- ✅ CSRF protection headers
- ✅ Password hashing with bcryptjs
- ✅ Secure session tokens
- ✅ Environment variable protection
- ✅ File upload validation and sanitization

## 📦 API Endpoints

### Chat
- `POST /api/chat` - Send chat message
- `GET /api/leads` - Get all leads

### Leads
- `POST /api/leads` - Create lead
- `GET /api/leads/[id]` - Get lead details
- `PATCH /api/leads/[id]` - Update lead

### Auth
- `POST /api/auth/login` - Admin login

### Location
- `GET /api/location` - Get Lucknow areas and property data

## 🚀 Deployment

### Vercel (Recommended for Frontend)

```bash
# Connect to Vercel
npm i -g vercel
vercel

# Set environment variables in Vercel dashboard
```

### Production Checklist

- [ ] Update `.env.production` with real values
- [ ] Change admin password
- [ ] Setup real database (production PostgreSQL)
- [ ] Configure real AI API keys
- [ ] Enable HTTPS
- [ ] Setup monitoring and logging
- [ ] Configure CORS properly
- [ ] Run security audit: `npm audit`
- [ ] Test all features in staging
- [ ] Backup database regularly

## 📚 Documentation

- [API Documentation](./docs/API.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Contributing Guide](./CONTRIBUTING.md)

## 🎯 Core Workflows

### Lead Qualification Flow
1. User starts chat or voice conversation
2. AI asks: property type → location → budget → rent/purchase → timeline
3. Lead captured with all details
4. Admin views in dashboard and qualifies
5. Status: new → warm → hot → contacted → converted

### Knowledge Base
1. Admin uploads PDF/DOCX
2. Text extracted and chunked
3. Embeddings generated
4. Relevant chunks retrieved for queries
5. AI responds with verified data

### Admin Dashboard
1. View all leads with filters
2. Change lead status (new, warm, hot, cold, contacted, converted)
3. Export leads as CSV
4. Manage knowledge base documents
5. Update Lucknow area data

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📝 License

MIT License - See LICENSE file for details

## 🐛 Known Limitations

- AI responses use placeholder logic (integrate real OpenAI/Anthropic)
- Voice API requires modern browser (not IE)
- Vector embeddings are placeholder (integrate real embedding service)
- File uploads need backend storage setup

## 💡 Future Enhancements

- Real estate marketplace integration
- Property image gallery and virtual tours
- Video call integration with agents
- Advanced lead scoring
- Whatsapp/Telegram bot integration
- SMS notifications
- Payment gateway integration
- Multi-language admin interface

## 📞 Support

Email: contact@lucknow-ai.com
GitHub Issues: [Create Issue](https://github.com/your-org/lucknow-ai-agent/issues)

---

Built with ❤️ for modern real estate professionals
