# Plexus Property AI Agent - Database Setup

Create `.env.local`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/plexus_property_ai"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"

# AI/LLM
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES="pdf,docx,txt,jpg,png"

# Security
JWT_SECRET="your-jwt-secret-key"
BCRYPT_ROUNDS=10

# Optional - Vector DB
PINECONE_API_KEY="your-pinecone-key"
PINECONE_INDEX="your-index"
```

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Setup database:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

3. Run dev server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000

## Admin Login

Default credentials (change in production):
- Email: admin@plexus-property.com
- Password: AdminPassword123!
