# API Documentation - Plexus Property AI Agent

## Base URL
`http://localhost:3000/api`

## Endpoints

### Chat API

#### Send Message
```
POST /chat
Content-Type: application/json

{
  "message": "Tell me about 2BHK apartments in Gomti Nagar"
}

Response:
{
  "success": true,
  "reply": "I'd be happy to help you find apartments..."
}
```

### Leads API

#### Create Lead
```
POST /leads
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "9876543210",
  "email": "john@example.com",
  "budget": "50-75 Lakhs",
  "location": "Gomti Nagar",
  "propertyType": "2 BHK Apartment",
  "intent": "purchase",
  "timeline": "3months"
}

Response:
{
  "success": true,
  "lead": {
    "id": "cuid...",
    "name": "John Doe",
    ...
  }
}
```

#### Get All Leads
```
GET /leads?status=new&limit=10

Response:
{
  "success": true,
  "leads": [...]
}
```

#### Get Lead by ID
```
GET /leads/[leadId]

Response:
{
  "success": true,
  "lead": {...}
}
```

#### Update Lead
```
PATCH /leads/[leadId]
Content-Type: application/json

{
  "status": "hot",
  "notes": "Very interested, callback next week"
}

Response:
{
  "success": true,
  "lead": {...}
}
```

### Authentication API

#### Admin Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "admin@plexus-property.com",
  "password": "AdminPassword123!"
}

Response:
{
  "success": true,
  "sessionToken": "token...",
  "user": {
    "id": "...",
    "email": "...",
    "role": "admin"
  }
}
```

### Location API

#### Get Location Data
```
GET /location

Response:
{
  "success": true,
  "data": {
    "areas": ["Gomti Nagar", "Indira Nagar", ...],
    "propertyTypes": ["1 BHK Apartment", "2 BHK Villa", ...],
    "budgetRanges": ["20-30 Lakhs", "30-50 Lakhs", ...],
    "facilities": [...]
  }
}
```

## Error Handling

All errors follow this format:
```json
{
  "success": false,
  "error": "Error message"
}
```

### HTTP Status Codes
- `200`: Success
- `400`: Bad Request (validation error)
- `401`: Unauthorized
- `404`: Not Found
- `429`: Rate Limit Exceeded
- `500`: Server Error

## Rate Limiting

- 30 requests per minute per IP
- Rate limit headers in response:
  - `X-RateLimit-Limit: 30`
  - `X-RateLimit-Remaining: 25`
  - `X-RateLimit-Reset: 1234567890`

## Authentication

Some endpoints require admin authentication via session token:

```
Authorization: Bearer [sessionToken]
```

## Examples

### JavaScript/Fetch

```javascript
// Create a lead
const response = await fetch('/api/leads', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    phone: '9876543210',
    budget: '50-75 Lakhs'
  })
});

const data = await response.json();
console.log(data);
```

### cURL

```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "9876543210",
    "budget": "50-75 Lakhs"
  }'
```
