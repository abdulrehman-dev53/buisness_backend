# BizPilot AI — Backend

Production-ready backend for **BizPilot AI**, an AI-powered Business Intelligence & Marketing SaaS platform. It gives businesses AI-generated strategic analysis, marketing copy, content calendars, competitor insights, and a context-aware business chat assistant — all powered by Groq.

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Architecture](#architecture)
5. [Folder Structure](#folder-structure)
6. [Environment Setup](#environment-setup)
7. [Installation](#installation)
8. [Authentication Flow](#authentication-flow)
9. [Groq AI Integration](#groq-ai-integration)
10. [Database Models](#database-models)
11. [API Endpoints](#api-endpoints)
12. [Example Requests & Responses](#example-requests--responses)
13. [AI Usage Limits](#ai-usage-limits)
14. [Security](#security)
15. [Future Improvements](#future-improvements)
16. [Deployment](#deployment)

---

## Overview

BizPilot AI helps small and mid-sized businesses get consultant-grade strategy and marketing output without hiring a consultant. Users create a business profile, and the platform's AI layer (backed by Groq) generates:

- Full SWOT-style business analyses with a health score
- Platform-specific marketing ad copy with variations
- Individual content pieces (captions, blog outlines, emails, ad copy, etc.)
- 30-day social content calendars
- Competitor analyses based on user-provided competitor info
- Campaign ad copy tied to specific paid campaigns
- A conversational assistant that answers questions using the user's actual business context

This repository contains **only the backend**. It is designed to be consumed by a React (or any) frontend over REST.

---

## Features

- 🔐 JWT authentication (register, login, logout, profile, password change)
- 🏢 Business & product/service management
- 🤖 AI Business Analyzer (SWOT, personas, action plan, growth score)
- 📢 AI Marketing Generator (multi-platform ad copy + variations)
- ✍️ AI Content Generator (9 content types, save/delete/regenerate/history)
- 🗓️ AI 30-Day Content Calendar Generator
- 🎯 Competitor tracking + AI competitor analysis
- 📊 Campaign management with AI-generated campaign copy
- 💬 AI Business Chat Assistant with persisted conversation history, grounded in the user's real business data
- 📈 Usage tracking with monthly plan-based AI request limits (Free / Pro / Business)
- 🧩 Single-request Dashboard aggregation endpoint
- 🛡️ Helmet, CORS, rate limiting (general + auth + AI-specific), input validation, Mongo sanitization, centralized error handling

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (>= 18) |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Auth | JSON Web Tokens (JWT) + bcryptjs |
| AI Provider | Groq API (via `groq-sdk`) |
| Validation | express-validator |
| Security | helmet, cors, express-rate-limit, express-mongo-sanitize |
| Logging | morgan |
| Config | dotenv |

---

## Architecture

All AI requests flow through a strict, isolated pipeline so the Groq provider can be swapped without touching business logic, and so the API key **never** reaches the frontend:

```text
React (frontend)
      │  HTTPS + JWT
      ▼
Express Routes  →  Middleware (auth, validation, rate limit)
      ▼
Controllers      (request/response, usage-limit checks)
      ▼
AI / Domain Services  (businessAnalysisService, contentService, competitorService)
      ▼
aiPromptService   (builds the system/user prompts)
      ▼
groqService       (the ONLY module that touches the Groq SDK)
      ▼
Groq API
      ▼
groqService → Service → Controller → Response → React
```

General (non-AI) request flow:

```text
Routes → Middleware → Controllers → Models (Mongoose) → MongoDB
```

---

## Folder Structure

```text
backend/
│
├── src/
│   ├── config/
│   │   ├── db.js               # MongoDB connection
│   │   └── groq.js             # Groq client (API key isolated here)
│   │
│   ├── controllers/            # Request/response handlers
│   ├── middleware/             # auth, error handling, rate limiting, validation
│   ├── models/                 # Mongoose schemas
│   ├── routes/                 # Express routers
│   ├── services/                # Business logic + AI orchestration
│   ├── utils/                  # token generation, response helpers, usage tracker, constants
│   │
│   ├── app.js                  # Express app (middleware + route wiring)
│   └── server.js               # Entry point (DB connect + listen)
│
├── .env
├── .env.example
├── package.json
└── README.md
```

---

## Environment Setup

Create a `.env` file (or copy `.env.example`):

```env
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/bizpilot_ai

# JWT
JWT_SECRET=replace_this_with_a_long_random_secret
JWT_EXPIRES_IN=7d

# Groq AI
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile

# Client
CLIENT_URL=http://localhost:5173

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300
AI_RATE_LIMIT_WINDOW_MS=60000
AI_RATE_LIMIT_MAX=15
```

> **Never commit `.env`.** It's already excluded via `.gitignore`. `GROQ_API_KEY`, `JWT_SECRET`, and `MONGO_URI` must stay server-side only.

---

## Installation

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# then edit .env with your real MongoDB URI, JWT secret, and Groq API key

# 3. Run in development (auto-restart)
npm run dev

# 4. Run in production
npm start
```

Health check: `GET http://localhost:5000/health`

---

## Authentication Flow

1. **Register** (`POST /api/auth/register`) — creates a user, password hashed with bcrypt (12 salt rounds), returns a JWT.
2. **Login** (`POST /api/auth/login`) — verifies credentials, returns a JWT.
3. Frontend stores the JWT (e.g. in memory or `httpOnly` cookie via a proxy layer) and sends it as:
   ```text
   Authorization: Bearer <token>
   ```
4. The `protect` middleware verifies the token on every private route, loads the user (excluding password), and attaches it to `req.user`.
5. `authorize('admin')` middleware is available to restrict specific routes to admins.
6. JWT payload only contains `{ userId, role }` — no sensitive data.

---

## Groq AI Integration

- The Groq client is instantiated once in `src/config/groq.js` using `GROQ_API_KEY` from `.env`.
- **Only** `src/services/groqService.js` imports that config and calls the Groq SDK directly.
- Controllers never build prompts inline — they call domain services (`businessAnalysisService`, `contentService`, `competitorService`), which call `aiPromptService` to build prompts, then `groqService` to execute them.
- Two Groq call modes are supported:
  - `getJSONCompletion()` — uses Groq's JSON response mode for all structured AI features (analysis, marketing, content, calendar, competitor analysis, campaign copy).
  - `getTextCompletion()` — free-form conversational text, used only by the chat assistant.
- This isolation means the AI provider can be replaced (e.g. swapped for another LLM API) by rewriting `groqService.js` alone — no controller or route changes required.
- The Groq API key is **never** sent to, or reachable by, the frontend. All AI calls are proxied server-side.

### Competitor Analysis Honesty

The competitor-analysis AI prompt explicitly instructs the model **not** to claim it browsed or scraped the competitor's website. Analysis is based only on the name/website/description the user entered, plus general industry reasoning. If real web-scraping is added later, it must live in its own dedicated service (e.g. `services/competitorScrapeService.js`) and be passed in as additional, clearly-labeled context — never silently assumed.

---

## Database Models

| Model | Purpose |
|---|---|
| `User` | Auth, role (`user`/`admin`), plan (`free`/`pro`/`business`) |
| `Business` | One business profile per user |
| `Product` | Products/services under a business |
| `Competitor` | Tracked competitors under a business |
| `AIAnalysis` | Stores business-analysis and competitor-analysis AI results |
| `GeneratedContent` | Stores marketing copy, content pieces, calendars |
| `Campaign` | Marketing campaigns + AI-generated copy |
| `Conversation` | Chat assistant conversation history |
| `Usage` | Per-request AI usage log (feature, model, tokens) used for monthly limits |

All models use Mongoose timestamps (`createdAt`, `updatedAt`). `User.password` is `select: false` and stripped from all JSON output.

---

## API Endpoints

All private routes require `Authorization: Bearer <token>`.

### Auth — `/api/auth`
| Method | Route | Access |
|---|---|---|
| POST | `/register` | Public |
| POST | `/login` | Public |
| POST | `/logout` | Private |
| GET | `/me` | Private |
| PUT | `/profile` | Private |
| PUT | `/change-password` | Private |

### Business — `/api/business`
| Method | Route |
|---|---|
| POST | `/` |
| GET | `/` |
| PUT | `/` |
| DELETE | `/` |

### Products — `/api/products`
| Method | Route |
|---|---|
| POST | `/` |
| GET | `/` |
| GET | `/:id` |
| PUT | `/:id` |
| DELETE | `/:id` |

### Competitors — `/api/competitors`
| Method | Route |
|---|---|
| POST | `/` |
| GET | `/` |
| DELETE | `/:id` |

### AI — `/api/ai`
| Method | Route | Feature |
|---|---|---|
| POST | `/business-analysis` | Full SWOT-style business analysis |
| POST | `/generate-marketing` | Platform ad copy + variations |
| POST | `/generate-content` | Single content piece |
| POST | `/content-calendar` | 30-day content calendar |
| POST | `/competitor-analysis/:id` | Competitor AI analysis |
| POST | `/campaign-copy` | AI copy for a campaign |

### Content History — `/api/content`
| Method | Route |
|---|---|
| GET | `/` (supports `?source=`, `?contentType=`, `?page=`, `?limit=`) |
| GET | `/:id` |
| PUT | `/:id` (toggle `isSaved`) |
| DELETE | `/:id` |
| POST | `/:id/regenerate` |

### Campaigns — `/api/campaigns`
| Method | Route |
|---|---|
| POST | `/` |
| GET | `/` (supports `?status=`) |
| GET | `/:id` |
| PUT | `/:id` |
| DELETE | `/:id` |

### Dashboard — `/api/dashboard`
| Method | Route |
|---|---|
| GET | `/` |

### Chat — `/api/chat`
| Method | Route |
|---|---|
| POST | `/` |
| GET | `/history` (supports `?conversationId=` for a single conversation) |
| DELETE | `/:id` |

---

## Example Requests & Responses

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Ayesha Khan",
  "email": "ayesha@example.com",
  "password": "SuperSecure123"
}
```
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": { "_id": "...", "name": "Ayesha Khan", "email": "ayesha@example.com", "role": "user", "plan": "free" },
    "token": "eyJhbGciOi..."
  }
}
```

### Generate Marketing Copy
```http
POST /api/ai/generate-marketing
Authorization: Bearer <token>
Content-Type: application/json

{
  "product": "Handmade leather wallets",
  "targetAudience": "Men aged 25-45 who value craftsmanship",
  "platform": "Instagram",
  "tone": "warm and premium",
  "objective": "drive online store purchases"
}
```
```json
{
  "success": true,
  "message": "Marketing content generated successfully",
  "data": {
    "content": {
      "_id": "...",
      "source": "marketing",
      "contentType": "Marketing Ad",
      "output": {
        "headline": "Crafted to Last a Lifetime",
        "primaryText": "...",
        "description": "...",
        "callToAction": "Shop Now",
        "hashtags": ["#handmadeleather", "#giftsforhim"],
        "variations": [ { "...": "..." } ]
      }
    }
  }
}
```

### Error Response (usage limit reached)
```json
{
  "success": false,
  "message": "You have reached your monthly AI request limit (20) for the free plan. Upgrade your plan or wait until next month.",
  "error": { "usage": { "allowed": false, "used": 20, "limit": 20, "remaining": 0 } }
}
```

---

## AI Usage Limits

Usage is tracked per request in the `Usage` collection and summed against the start of the current calendar month (UTC).

| Plan | Monthly AI Requests |
|---|---|
| Free | 20 |
| Pro | 200 |
| Business | 1000 |

When a user exceeds their limit, AI endpoints respond with `429 Too Many Requests` and a structured usage payload. Separately, an IP-based `aiLimiter` (default: 15 requests/minute) protects against short-burst abuse regardless of plan.

---

## Security

- **Helmet** — sets secure HTTP headers
- **CORS** — restricted to `CLIENT_URL`
- **express-rate-limit** — general API limiter, stricter auth limiter, and a dedicated AI limiter
- **express-validator** — validates and sanitizes all request bodies/params
- **express-mongo-sanitize** — strips `$`/`.` operators to prevent NoSQL injection
- **bcryptjs** — 12 salt-round password hashing
- **JWT** — stateless auth, minimal payload
- **Centralized error handler** — normalizes Mongoose/JWT errors, hides stack traces in production
- Passwords are never returned in API responses (`select: false` + `toJSON` transform)
- `GROQ_API_KEY`, `JWT_SECRET`, and `MONGO_URI` are never exposed in responses, logs, or to the frontend

---

## Future Improvements

- Refresh token rotation / token blacklisting on logout
- Real competitor website scraping as a separate, clearly-labeled service feeding additional context into the AI prompt
- Streaming responses for the chat assistant (SSE/WebSocket)
- Stripe billing integration tied to `plan` upgrades
- Redis-backed rate limiting and usage counters for multi-instance deployments
- Automated test suite (Jest + Supertest)
- Webhook support for campaign status changes

---

## Deployment

1. Provision a MongoDB instance (Atlas recommended).
2. Set all environment variables from `.env.example` on your host (Render, Railway, Fly.io, EC2, etc.).
3. Ensure `NODE_ENV=production`.
4. Run `npm install --production` then `npm start`.
5. Put the service behind a reverse proxy/load balancer that forwards the client's real IP (the app already sets `trust proxy: 1` for correct rate limiting behind one proxy hop — adjust if you have more hops).
6. Set `CLIENT_URL` to your deployed frontend's origin for CORS.
7. Monitor `/health` for uptime checks.
