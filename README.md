# Payment Microservice

Centralized payment service for the Statex microservices ecosystem. Handles payment processing via multiple payment providers including PayPal, Stripe, PayU, Fio Banka, and ComGate.

## Features

- ✅ **Multiple Payment Methods** - PayPal, Stripe, PayU, Fio Banka, ComGate, and generic card payments
- ✅ **Unified API** - Single API for all payment methods
- ✅ **Webhook Support** - Automatic payment status updates via webhooks
- ✅ **Refund Support** - Full and partial refunds
- ✅ **Secure** - API key authentication and webhook signature verification
- ✅ **Database Integration** - PostgreSQL storage for payment records
- ✅ **Comprehensive Logging** - Centralized logging via external logging microservice
- ✅ **Transaction History** - Complete audit trail of all payment transactions

## Technology Stack

- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL (via shared database-server)
- **ORM**: TypeORM
- **Payment Providers**: PayPal, Stripe, PayU, Fio Banka, ComGate
- **Logging**: External centralized logging microservice with local fallback

## API Endpoints

### Payment Endpoints

#### POST /payments/create

Create a new payment request.

**Headers:**

- `X-API-Key: <your-api-key>`
- `Content-Type: application/json`

**Request Body:**

```json
{
  "orderId": "string",
  "applicationId": "string",
  "amount": 1000.00,
  "currency": "CZK",
  "paymentMethod": "payu|stripe|paypal|fiobanka|comgate|card",
  "callbackUrl": "https://app.statex.cz/api/payments/callback",
  "customer": {
    "email": "customer@example.com",
    "name": "John Doe",
    "phone": "+420123456789"
  },
  "metadata": {}
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "paymentId": "uuid",
    "status": "pending",
    "redirectUrl": "https://payu.cz/...",
    "expiresAt": "2025-01-01T12:00:00Z"
  }
}
```

#### GET /payments/:paymentId

Get payment status.

**Headers:**

- `X-API-Key: <your-api-key>`

**Response:**

```json
{
  "success": true,
  "data": {
    "paymentId": "uuid",
    "orderId": "string",
    "status": "completed",
    "amount": 1000.00,
    "currency": "CZK",
    "paymentMethod": "payu",
    "providerTransactionId": "string",
    "createdAt": "2025-01-01T10:00:00Z",
    "completedAt": "2025-01-01T10:05:00Z"
  }
}
```

#### POST /payments/:paymentId/refund

Refund a payment (full or partial).

**Headers:**

- `X-API-Key: <your-api-key>`
- `Content-Type: application/json`

**Request Body:**

```json
{
  "amount": 500.00,
  "reason": "Customer request"
}
```

### Webhook Endpoints

#### POST /webhooks/paypal

PayPal webhook handler

#### POST /webhooks/stripe

Stripe webhook handler

#### POST /webhooks/payu

PayU webhook handler

#### POST /webhooks/fiobanka

Fio Banka webhook handler

#### POST /webhooks/comgate

ComGate webhook handler

### Health Endpoint

#### GET /health

Returns service health status.

**Response:**

```json
{
  "success": true,
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "service": "payment-microservice"
}
```

## Configuration

### Environment Variables

See `.env.example` for all required environment variables.

Key variables:

- `PORT` - Service port (default: 3468)
- `DB_HOST` - Database host (default: db-server-postgres)
- `DB_NAME` - Database name (default: payments)
- `LOGGING_SERVICE_URL` - Logging microservice URL
- Payment provider credentials (PayPal, Stripe, PayU, Fio Banka, ComGate)
- `API_KEYS` - Comma-separated list of valid API keys

## Deployment

### Prerequisites

- Docker and Docker Compose
- Access to `nginx-network` Docker network
- PostgreSQL database (shared database-server)
- Environment variables configured in `.env`

### Deploy

```bash
# Edit .env with your configuration
nano .env

# Deploy
./scripts/deploy.sh
```

### Check Status

```bash
./scripts/status.sh
```

## Access Methods

### Production Access (HTTPS)

```bash
curl https://payments.statex.cz/health
```

### Docker Network Access

```bash
# From within a container on nginx-network
curl http://payment-microservice:3468/health
```

## Integration Example

```typescript
// Example: Creating a payment
const response = await fetch('https://payments.statex.cz/payments/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key',
  },
  body: JSON.stringify({
    orderId: 'order-123',
    applicationId: 'e-commerce',
    amount: 1000.00,
    currency: 'CZK',
    paymentMethod: 'payu',
    callbackUrl: 'https://app.statex.cz/api/payments/callback',
    customer: {
      email: 'customer@example.com',
      name: 'John Doe',
    },
  }),
});

const { data } = await response.json();
// Redirect user to data.redirectUrl for payment
```

## Logs

The service uses a centralized logging system that integrates with the external logging microservice. Logs are sent to the logging microservice via HTTP API and also stored locally as a fallback.

### Logging Configuration

- **External Logging**: Logs are sent to `http://logging-microservice:3268/api/logs`
- **Local Fallback**: If the logging service is unavailable, logs are written to local files in `./logs/` directory
- **Service Name**: All logs are tagged with service name `payment-microservice`

## Security

- **API Key Authentication**: All payment endpoints require valid API key
- **Webhook Signature Verification**: All webhook endpoints verify provider signatures
- **Rate Limiting**: Built-in rate limiting (100 requests per minute)
- **HTTPS**: All production communication uses HTTPS

## Support

For issues and questions, please refer to the main README.md or open an issue on GitHub.
