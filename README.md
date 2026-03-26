# Toolkit PPR (Pagos por resultado)

## Introduction

This document presents a comprehensive overview of the activities, methodologies, and key results associated with the Toolkit. Its purpose is to detail the architecture, components, and their relationships, as well as the installation, configuration, and implementation procedures for a results-based traceability and payment project using the existing toolkit, secure authentication mechanisms, blockchain traceability, and payments via tokens and stablecoins.

---

## Content

1. [General Architecture Diagram](#1-general-architecture)
2. [Database](#2-database) 
3. [SSO (Authentication)](#3-sso-authentication)
4. [Backend (API)](#4-backend-api)
5. [Frontend](#5-frontend)


---

## 1. General Architecture

![Arquitectura](./img/arquitectura.png)

### Main Components

This diagram describes the four main components for running the PPR application and their relationships.

---

## 2. Database
https://github.com/mongodb/mongo

### MongoDB Quick Install Guide

#### Run MongoDB Container

```bash
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=admin123 \
  mongo:latest
```

---

## 3. SSO (Authentication)

### Keycloak Setup
https://github.com/keycloak/keycloak

The application requires a properly configured Keycloak server for authentication. Below is the required setup.

### Realm Configuration

- Create a new realm named `ppr-realm`
- Configure the realm settings:
  - Enable user registration if needed
  - Set session timeouts as required

### Client Configuration

Create a client for the backend API:

| Setting | Value |
|---|---|
| Client ID | `ppr-api-client` |
| Client Protocol | `openid-connect` |
| Access Type | `confidential` |
| Standard Flow Enabled | ON |
| Direct Access Grants | ON |
| Service Accounts | ON (if using machine-to-machine auth) |

**Valid Redirect URIs**

```
http://localhost:3000/*
https://your-production-domain.com/*
```

### Roles

Create the following realm roles:

| Role | Description |
|---|---|
| `Sponsor` | Can create and fund projects |
| `Provider` | Can deliver services and upload evidence |
| `User` | Can view and participate in projects |
| `Verifier` | Can audit evidence and approve phases |

### Obtaining the Realm Public Key

1. Go to **Realm Settings → Keys**
2. Click on the **Public key** button for the RSA key
3. Copy the key and add it to your `.env`:

```env
KEYCLOAK_REALM_PUBLIC_KEY="<realm-pk>"
```

### Environment Variables

```env
KEYCLOAK_AUTH_SERVER_URL="https://your-keycloak.example.com"
KEYCLOAK_REALM="ppr-realm"
KEYCLOAK_CLIENT_ID="ppr-api-client"
KEYCLOAK_SECRET="<your-client-secret>"
KEYCLOAK_REALM_PUBLIC_KEY="<your-realm-public-key>"
```

> **Note:** The backend uses `nest-keycloak-connect` for JWT validation. All API endpoints (except `/health`) require a valid Bearer token.

---

## 4. Backend (API)
https://github.com/LACNetNetworks/PPR/tree/main/ppr-backend

A robust NestJS backend API for the PPR  platform, enabling project funding management, evidence tracking, and blockchain integration for transparency.

### Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| NestJS | 11.x | Core framework |
| MongoDB | 8.x | Database (via Mongoose) |
| Keycloak | 26.x | Authentication & authorization |
| ethers.js | 6.x | Blockchain integration |
| Swagger | 11.x | API documentation |
| TypeScript | 5.x | Language |

### Architecture

The project follows Clean Architecture principles with three main layers:

```
src/
├── application/     # Use cases and DTOs (business logic)
├── domain/          # Entities, repositories interfaces, enums
├── infrastructure/  # External concerns (HTTP, DB, auth, integrations)
└── bootstrap/       # App initialization and configuration
```

### Domain Modules

| Module | Description |
|---|---|
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
|---|---|
| POK API | External service integration |
| Blockchain (LNet) | Transaction anchoring and verification |
| File Storage (GCS) | Evidence file storage |

### Prerequisites

- Node.js 22.x (see Dockerfile)
- MongoDB instance (local or remote)
- Keycloak server configured with `ppr-realm`
- Access to LNet network (optional, for blockchain features)
- Access to ZKSync Network
- Access to any EVM System

### Quick Start

#### 1. Install dependencies

```bash
npm install
```

#### 2. Configure environment

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

#### 3. Run the application

```bash
# Development (with hot reload)
npm run start:dev

# Production
npm run build
npm run start:prod
```

#### 4. Access the API

- **API Base URL:** `http://localhost:3000/ppr`
- **Swagger Docs:** `http://localhost:3000/ppr/docs`
- **Health Check:** `http://localhost:3000/ppr/health`

### API Endpoints

#### Projects

| Method | Endpoint | Description |
|---|---|---|
| GET | `/projects` | List all projects |
| GET | `/projects/:id` | Get project by ID |
| POST | `/projects` | Create new project |
| PUT | `/projects/:id` | Update project |
| GET | `/projects/:projectId/phases` | List project phases |
| POST | `/projects/:projectId/phases` | Add phase to project |
| GET | `/projects/:projectId/members` | List project members |
| GET | `/projects/:projectId/contributions` | List contributions |

#### Users

| Method | Endpoint | Description |
|---|---|---|
| GET | `/users` | List users |
| GET | `/users/:id` | Get user by ID |
| POST | `/users` | Create user |

#### Evidences

| Method | Endpoint | Description |
|---|---|---|
| GET | `/evidences` | List evidences |
| POST | `/evidences` | Upload evidence |

> **Note:** All endpoints require Bearer token authentication via Keycloak.

### Docker

#### Build and run

```bash
# Build image
docker build -t ppr-backend .

# Run container
docker run -p 3000:3000 --env-file .env ppr-backend
```

#### Using docker-compose

```bash
docker-compose up -d
```

### Scripts

| Script | Description |
|---|---|
| `npm run start:dev` | Start with hot reload |
| `npm run start:debug` | Start with debugger |
| `npm run build` | Build for production |
| `npm run start:prod` | Run production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run e2e tests |
| `npm run test:cov` | Run tests with coverage |

### User Roles

| Role | Description |
|---|---|
| `Sponsor` | Creates and funds projects |
| `Provider` | Delivers project services, uploads evidence |
| `User` | Benefits from projects |
| `Verifier` | Audits evidence and project progress |

---

## 5. Frontend
https://github.com/LACNetNetworks/PPR/tree/main/ppr-frontend

A modern Next.js 15 frontend for the PPR platform, providing role-based dashboards for project funding management, evidence tracking, and contribution monitoring.

### Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 15.x | React framework (App Router) |
| React | 19.x | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Styling |
| Keycloak JS | 26.x | Authentication |
| Recharts | 3.x | Data visualization |
| Motion | 12.x | Animations |
| Headless UI | 2.x | Accessible UI primitives |

### Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── (app)/              # Protected routes
│   │   ├── sponsor/        # Sponsor dashboard
│   │   ├── provider/       # Provider dashboard
│   │   ├── user/           # User dashboard
│   │   └── verifier/       # Verifier dashboard
│   └── (auth)/             # Auth routes (login, register)
├── components/             # Reusable UI components
│   ├── grids/              # Grid layouts
│   ├── tables/             # Data tables
│   ├── dashboards/         # Dashboard components
│   ├── sidebars/           # Navigation sidebars
│   └── ...                 # Modals, forms, etc.
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities and API services
└── types/                  # TypeScript types
```

### Key Components

| Component | Description |
|---|---|
| `sidebar.tsx` | Role-based navigation sidebar |
| `projects-table.tsx` | Project listing and management |
| `contribution-modal.tsx` | Contribution entry |
| `evidence-detail-modal.tsx` | Evidence viewing |
| `audit-modal.tsx` | Verification workflows |
| `keycloak-provider.tsx` | Auth context provider |

### User Roles

| Role | Dashboard | Capabilities |
|---|---|---|
| `Sponsor` | `/sponsor` | Create projects, manage funding, add collaborators |
| `Provider` | `/provider` | Deliver services, upload evidence, track phases |
| `User` | `/user` | View projects, track benefits |
| `Verifier` | `/verifier` | Audit evidence, approve phases |

### Prerequisites

- Node.js 18.x or later
- npm 9.x or later
- Access to the PPR Backend API
- Keycloak server for authentication

### Quick Start

#### 1. Install dependencies

```bash
npm install
```

#### 2. Configure environment

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/ppr
NEXT_PUBLIC_KEYCLOAK_URL=https://your-keycloak.example.com
NEXT_PUBLIC_KEYCLOAK_REALM=ppr-realm
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=ppr-frontend
```

#### 3. Run development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

#### 4. Build for production

```bash
npm run build
npm run start
```

### Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |
| `NEXT_PUBLIC_KEYCLOAK_URL` | Keycloak server URL |
| `NEXT_PUBLIC_KEYCLOAK_REALM` | Keycloak realm name |
| `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID` | Keycloak client ID |

### Docker

#### Build and run

```bash
# Build image
docker build -t ppr-frontend .

# Run container
docker run -p 8080:8080 ppr-frontend
```

> The production container runs on port `8080`.

### Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server on port 5173 |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

### API Integration

The frontend connects to the backend using:

- `src/lib/api-client.ts` — Axios-based HTTP client with auth
- `src/lib/api-services.ts` — React hooks for API operations (client-side)
- `src/lib/api-services-server.ts` — Server-side API calls

#### Example Usage

```typescript
import { useFetchProjects, useCreateProject } from '@/lib/api-services'

function ProjectsList() {
  const fetchProjects = useFetchProjects()
  const createProject = useCreateProject()

  useEffect(() => {
    fetchProjects().then(setProjects)
  }, [])

  const handleCreate = async (data) => {
    await createProject(data)
  }
}
```

### Keycloak Login Theme

A custom Keycloak login theme is included in `keycloak-login-theme/`. Deploy to your Keycloak server's `themes/` directory.

### Keycloak Setup

The frontend requires a Keycloak server for authentication. It uses `keycloak-js` and `@react-keycloak/web` for client-side authentication.

#### Realm Configuration

Use the same `ppr-realm` as the backend. Ensure the following are configured:

- **Realm name:** `ppr-realm`
- **Login settings:** Configure as needed (registration, password policies, etc.)

#### Frontend Client Configuration

Create a public client for the frontend (separate from the backend client):

| Setting | Value |
|---|---|
| Client ID | `ppr-frontend` |
| Client Protocol | `openid-connect` |
| Access Type | `public` (no client secret) |
| Standard Flow Enabled | ON |
| Direct Access Grants | OFF |
| Implicit Flow Enabled | OFF |

**Valid Redirect URIs**

```
http://localhost:5173/*
https://your_domain.com/*
```

#### Web Origins (CORS)

```
http://localhost:5173
https://yourdomain.com
```

#### Roles

| Role | Dashboard Route |
|---|---|
| `sponsor` | `/sponsor` |
| `provider` | `/provider` |
| `user` | `/user` |
| `verifier` | `/verifier` |

> Users should be assigned one role that determines their dashboard access.

#### Environment Variables

```env
NEXT_PUBLIC_KEYCLOAK_URL="https://your-keycloak.example.com"
NEXT_PUBLIC_KEYCLOAK_REALM="ppr-realm"
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID="ppr-frontend"
```

### Authentication Flow

1. User navigates to the app
2. `KeycloakProvider` initializes and checks for existing session
3. If not authenticated, user is redirected to Keycloak login
4. After login, Keycloak redirects back with tokens
5. Frontend stores tokens and includes them in API requests

### Custom Login Theme

To use the custom theme:

1. Copy `keycloak-login-theme/` to `<KEYCLOAK_HOME>/themes/ppr-theme`
2. In Keycloak Admin Console, go to **Realm Settings → Themes**
3. Set **Login Theme** to `ppr-theme`
