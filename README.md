# Qalam (कलम) — Scaffold, Infrastructure & Sign-up (AUTH-1 & AUTH-2)

Qalam is a mobile-responsive sanctuary where a writer stores poetry, shayari, stories, and raw ideas in Hindi (Devanagari and Roman scripts) and English.

This repository contains the foundational scaffolding, containerized local infrastructure, database migrations, authentication engine, SMTP email subsystem, and the complete **Sign-up screen and secure sign-up backend** under tickets **AUTH-1** and **AUTH-2**.

---

## 1. Prerequisites

Before running Qalam locally, ensure you have the following installed on your host system:

- **Node.js**: v20.x or v22.x LTS
- **npm**: v10.x or later
- **Docker**: v24.x or later with Docker Compose v2.20+ (`docker compose`)
- **OpenSSL**: for generating secure cryptographic secrets

Verify installations:
```bash
node -v
npm -v
docker --version
docker compose version
```

---

## 2. Repository Structure

```
├── compose.yaml                  # Docker Compose definition (app, db, mailpit)
├── Dockerfile                    # Application container specification (Node.js 22 Alpine)
├── .dockerignore                 # Container build exclusions (secrets, caches, dependencies)
├── .env.example                  # Environment configuration template (committed, no secrets)
├── .gitignore                    # Git exclusions (.env*, .next, node_modules)
├── next.config.mjs               # Next.js configuration (standalone output, strict mode)
├── postcss.config.mjs            # PostCSS configuration for Tailwind CSS v4
├── drizzle.config.ts             # Drizzle Kit CLI migration and schema configuration
├── drizzle/                      # Generated SQL migration files
│   ├── 0000_reflective_ronan.sql # Authentication tables schema DDL
│   └── meta/                     # Drizzle migration history snapshots
├── scripts/
│   ├── dev.js                    # Dev runner (normalizes CLI flags for Next.js)
│   ├── migrate.ts                # Migration execution and table verification script
│   └── test-email.ts             # Single test email sender exercising shared SMTP module
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...all]/    # Better Auth route handler for Next.js App Router
│   │   │   │   └── route.ts
│   │   │   ├── auth/register/    # Dedicated secure sign-up endpoint (/api/auth/register)
│   │   │   │   └── route.ts
│   │   │   └── health/           # Container readiness health check (/api/health)
│   │   │       └── route.ts
│   │   ├── signup/page.tsx       # Sign Up page (Google Stitch split layout & cream theme)
│   │   ├── signin/page.tsx       # Sign In page (handles post-signup redirect message)
│   │   ├── layout.tsx            # Root layout with fonts, title, and metadata
│   │   ├── page.tsx              # Minimal status and quick-access page
│   │   └── globals.css           # Tailwind CSS imports and base styles
│   └── lib/
│       ├── auth/
│       │   ├── auth.ts           # Better Auth server configuration with Drizzle PG adapter & hooks
│       │   └── auth-client.ts    # Better Auth browser client
│       ├── db/
│       │   ├── index.ts          # PostgreSQL pool connection and Drizzle client instance
│       │   └── schema.ts         # Better Auth Drizzle schema (user, session, account, verification)
│       ├── email/
│       │   └── index.ts          # Centralized SMTP email module using nodemailer
│       ├── validation/
│       │   └── auth.ts           # Shared validation rules (name, email domains, zxcvbn password)
│       └── env.ts                # Zod environment variable parsing and validation
├── tests/
│   ├── validation.test.ts        # Unit tests: email domains, zxcvbn passwords, Unicode/Hindi names
│   └── registration.test.ts      # Integration tests: in-memory PostgreSQL, hashing, session absence
└── README.md                     # Setup, verification, and developer documentation
```

---

## 3. Local Environment Setup

Copy `.env.example` to create your local `.env` file:

```bash
cp .env.example .env
```

---

## 4. Generating a Secure AUTH_SECRET

Generate a cryptographically secure 32-byte base64 secret using OpenSSL:

```bash
openssl rand -base64 32
```

Add the generated secret to your `.env` file under `AUTH_SECRET`:

```dotenv
AUTH_SECRET="your-generated-base64-secret-here"
```

---

## 5. Environment Variables Reference

| Variable | Purpose | Local Host Default | Docker Compose Service Value |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://qalam:qalam_dev_password@localhost:5432/qalam_dev` | `postgresql://qalam:qalam_dev_password@db:5432/qalam_dev` |
| `AUTH_SECRET` | Cryptographic key for Better Auth tokens & sessions | Generated via `openssl rand -base64 32` | Generated via `openssl rand -base64 32` |
| `BASE_URL` | Application root URL for auth callbacks | `http://localhost:3000` | `http://localhost:3000` |
| `SMTP_HOST` | Hostname of SMTP server | `localhost` | `mailpit` |
| `SMTP_PORT` | Port of SMTP server | `1025` | `1025` |
| `SMTP_USER` | SMTP authentication user (optional for Mailpit) | *(empty)* | *(empty)* |
| `SMTP_PASS` | SMTP authentication password (optional for Mailpit) | *(empty)* | *(empty)* |
| `SMTP_FROM` | Default sender header | `Qalam <noreply@qalam.local>` | `Qalam <noreply@qalam.local>` |
| `ALLOWED_EMAIL_DOMAINS` | Enforced email domain allowlist (comma-separated) | `gmail.com,outlook.com,hotmail.com,yahoo.com,icloud.com` | `gmail.com,outlook.com,hotmail.com,yahoo.com,icloud.com` |

---

## 6. Building and Starting All Services

Build container images and start all three services in detached mode:

```bash
docker compose up -d --build
```

---

## 7. Verifying Service Health

Inspect the health status of the running containers:

```bash
docker compose ps
```

---

## 8. Accessing Services Locally

- **Web Application**: [http://localhost:3000](http://localhost:3000)
- **Sign Up Screen**: [http://localhost:3000/signup](http://localhost:3000/signup)
- **Sign In Screen**: [http://localhost:3000/signin](http://localhost:3000/signin)
- **Registration API**: `POST http://localhost:3000/api/auth/register`
- **Health Check API**: [http://localhost:3000/api/health](http://localhost:3000/api/health)
- **Better Auth API**: [http://localhost:3000/api/auth/ok](http://localhost:3000/api/auth/ok)
- **Mailpit Web Interface**: [http://localhost:8025](http://localhost:8025)
- **PostgreSQL Database**: `localhost:5432` (`qalam` / `qalam_dev_password` / `qalam_dev`)

---

## 9. Running Automated Tests

Run the full suite of automated unit and integration tests (25 tests covering validation, domain allowlisting, password strength, Unicode/Devanagari names, database persistence, password hashing, and session absence):

```bash
npm test
```

Or run test files individually:
```bash
# Validation unit tests (domains, passwords, names)
node --import tsx --test tests/validation.test.ts

# Database persistence, hashing, and session absence tests
node --import tsx --test --test-force-exit tests/registration.test.ts
```

---

## 10. Applying Database Migrations

Apply the generated SQL migrations to the PostgreSQL database:

**Option A — From the host:**
```bash
npm run db:migrate
```

**Option B — Inside the running app container:**
```bash
docker compose exec app npm run db:migrate
```

---

## 11. Running the Email Test Script

Dispatch a test message through the centralized SMTP email module:

```bash
npm run test:email
```

---

## 12. Resetting the Database

To completely reset the database and clear all stored data:

> ⚠️ **WARNING: PERMANENT DATA DELETION**  
> Running the command below deletes the `postgres_data` named Docker volume. All local database tables, records, users, and migrations will be permanently removed.

```bash
docker compose down -v
```

To reinitialize from a clean state after resetting:
```bash
docker compose up -d
npm run db:migrate
```

---

## 13. Stopping Services

To stop all running services without deleting database data:

```bash
docker compose down
```
