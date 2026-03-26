# PPR Backend

A robust NestJS backend API for the PPR (Programa de Participación Regional) platform, enabling project funding management, evidence tracking, and blockchain integration for transparency.

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **NestJS** | 11.x | Core framework |
| **MongoDB** | 8.x | Database (via Mongoose) |
| **Keycloak** | 26.x | Authentication & authorization |
| **ethers.js** | 6.x | Blockchain integration |
| **Swagger** | 11.x | API documentation |
| **TypeScript** | 5.x | Language |

## Architecture

The project follows **Clean Architecture** principles with three main layers:

```
src/
├── application/     # Use cases and DTOs (business logic)
├── domain/          # Entities, repositories interfaces, enums
├── infrastructure/  # External concerns (HTTP, DB, auth, integrations)
└── bootstrap/       # App initialization and configuration
```

### Domain Modules

| Module | Description |
|--------|-------------|
| `projects` | Core project management |
| `phases` | Project phases/stages |
| `tasks` | Phase tasks |
| `contributions` | Funding contributions |
| `evidences` | Evidence files and blockchain anchoring |
| `users` | User management (sponsor, provider, user, verifier) |
| `organizations` | Organization management |
| `transactions` | Transaction audit trail |
| `audit-revisions` | Audit revision tracking |

### Integrations

| Integration | Purpose |
|-------------|---------|
| **POK API** | External service integration |
| **Blockchain (LACChain)** | Transaction anchoring and verification |
| **File Storage (GCS)** | Evidence file storage |

## Prerequisites

- **Node.js** 22.x (see Dockerfile)
- **MongoDB** instance (local or remote)
- **Keycloak** server configured with `ppr-realm`
- Access to LACChain network (optional, for blockchain features)

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and configure:

```env
# Server
NODE_ENV="development"
PORT="3000"
GLOBAL_PREFIX="ppr"

# MongoDB
MONGODB_URI="mongodb://user:pass@localhost:27017/ppr_db"
MONGODB_DB="ppr_db"

# Keycloak
KEYCLOAK_AUTH_SERVER_URL="https://your-keycloak.example.com"
KEYCLOAK_REALM="ppr-realm"
KEYCLOAK_CLIENT_ID="ppr-api-client"
KEYCLOAK_REALM_PUBLIC_KEY="<your-public-key>"

# External Services
FILE_STORE_API_URL="<file-storage-api-url>"
FILE_STORE_API_KEY="<your-api-key>"

# Blockchain (optional)
RPC_URL="<lacchain-rpc-url>"
PRIVATE_KEY="<blockchain-private-key>"
ADDRESS_CONTRACT="<smart-contract-address>"
```

### 3. Run the application

```bash
# Development (with hot reload)
npm run start:dev

# Production
npm run build
npm run start:prod
```

### 4. Access the API

- **API Base URL**: `http://localhost:3000/ppr`
- **Swagger Docs**: `http://localhost:3000/ppr/docs`
- **Health Check**: `http://localhost:3000/ppr/health`

## API Endpoints

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/projects` | List all projects |
| `GET` | `/projects/:id` | Get project by ID |
| `POST` | `/projects` | Create new project |
| `PUT` | `/projects/:id` | Update project |
| `GET` | `/projects/:projectId/phases` | List project phases |
| `POST` | `/projects/:projectId/phases` | Add phase to project |
| `GET` | `/projects/:projectId/members` | List project members |
| `GET` | `/projects/:projectId/contributions` | List contributions |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/users` | List users |
| `GET` | `/users/:id` | Get user by ID |
| `POST` | `/users` | Create user |

### Evidences
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/evidences` | List evidences |
| `POST` | `/evidences` | Upload evidence |

> **Note**: All endpoints require Bearer token authentication via Keycloak.

## Docker

### Build and run

```bash
# Build image
docker build -t ppr-backend .

# Run container
docker run -p 3000:3000 --env-file .env ppr-backend
```

### Using docker-compose

```bash
docker-compose up -d
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run start:dev` | Start with hot reload |
| `npm run start:debug` | Start with debugger |
| `npm run build` | Build for production |
| `npm run start:prod` | Run production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run e2e tests |
| `npm run test:cov` | Run tests with coverage |

## User Roles

| Role | Description |
|------|-------------|
| **Sponsor** | Creates and funds projects |
| **Provider** | Delivers project services, uploads evidence |
| **User** | Benefits from projects |
| **Verifier** | Audits evidence and project progress |

## Keycloak Setup

The application requires a properly configured Keycloak server for authentication. Below is the required setup.

### Realm Configuration

1. **Create a new realm** named `ppr-realm`
2. Configure the realm settings:
   - Enable user registration if needed
   - Set session timeouts as required

### Client Configuration

Create a client for the backend API:

| Setting | Value |
|---------|-------|
| **Client ID** | `ppr-api-client` |
| **Client Protocol** | `openid-connect` |
| **Access Type** | `confidential` |
| **Standard Flow Enabled** | `ON` |
| **Direct Access Grants** | `ON` |
| **Service Accounts** | `ON` (if using machine-to-machine auth) |

### Valid Redirect URIs

```
http://localhost:3000/*
https://your-production-domain.com/*
```

### Roles

Create the following realm roles:

| Role | Description |
|------|-------------|
| `sponsor` | Can create and fund projects |
| `provider` | Can deliver services and upload evidence |
| `user` | Can view and participate in projects |
| `verifier` | Can audit evidence and approve phases |

### Obtaining the Realm Public Key

1. Go to **Realm Settings** → **Keys**
2. Click on the **Public key** button for the RSA key
3. Copy the key and add it to your `.env`:

```env
KEYCLOAK_REALM_PUBLIC_KEY="MIIBIjANBgkq..."
```

### Environment Variables

```env
KEYCLOAK_AUTH_SERVER_URL="https://your-keycloak.example.com"
KEYCLOAK_REALM="ppr-realm"
KEYCLOAK_CLIENT_ID="ppr-api-client"
KEYCLOAK_SECRET="<your-client-secret>"
KEYCLOAK_REALM_PUBLIC_KEY="<your-realm-public-key>"
```

> **Note**: The backend uses `nest-keycloak-connect` for JWT validation. All API endpoints (except `/health`) require a valid Bearer token.

---

# Recommended Fixes & Improvements

## 🔴 Critical

### 1. Security: Remove Hardcoded Secrets from `.env`
**Issue**: The `.env` file contains real credentials and private keys committed to version control.

**Fix**:
- Remove `.env` from git tracking: `git rm --cached .env`
- Add `.env` to `.gitignore`
- Create `.env.example` with placeholder values
- Use secrets management (e.g., HashiCorp Vault, AWS Secrets Manager)

### 2. CORS Configuration Hardcoded
**Issue**: CORS origins are hardcoded in `main.ts`.

**Fix**:
```typescript
// Move to environment variables
const allowedOrigins = configService.get<string>('CORS_ORIGINS')?.split(',') || [];
app.enableCors({ origin: allowedOrigins, ... });
```

### 3. Missing Input Validation on Some Endpoints
**Issue**: Some controller methods lack proper DTO validation.

**Fix**: Ensure all endpoints use DTOs with class-validator decorators.

## 🟡 Moderate

### 4. Duplicate CORS Handling
**Issue**: CORS is configured both manually (preflight middleware) and via `enableCors()`.

**Fix**: Remove the manual OPTIONS handler and rely on NestJS's built-in CORS.

```typescript
// Remove this block from main.ts (lines 15-24)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') { ... }
});
```

### 5. Add Consistent Error Response DTOs
**Issue**: Error responses vary across endpoints.

**Fix**: Implement a global exception filter with standardized error format.

### 6. Repository Pattern Inconsistency
**Issue**: Some use cases directly access repositories, others go through services.

**Fix**: Establish and enforce consistent data access patterns.

### 7. Add Request Logging Middleware
**Fix**: Add structured logging for all requests/responses for debugging and monitoring.

### 8. Missing Unit Tests
**Issue**: Limited test coverage visible.

**Fix**: Add unit tests for use cases and integration tests for controllers.

## 🟢 Nice to Have

### 9. Add Rate Limiting
**Fix**: Implement `@nestjs/throttler` for API rate limiting.

### 10. Implement API Versioning
**Fix**: Add version prefix (e.g., `/v1/projects`) for future compatibility.

### 11. Add Database Migrations
**Issue**: No migration strategy for MongoDB schema changes.

**Fix**: Consider using `migrate-mongo` for schema migrations.

### 12. Improve Swagger Documentation
**Fix**: Add more detailed descriptions, examples, and response types to Swagger decorators.

### 13. Add Health Check Dependencies
**Fix**: Extend health check to verify MongoDB, Keycloak, and external service connectivity.

### 14. Centralize Configuration
**Issue**: Configuration is spread across multiple modules.

**Fix**: Use a single configuration schema with Joi validation.
