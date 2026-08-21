# NeighbourHub

> **Your neighborhood. Connected.**

NeighbourHub is a full-stack community platform that helps neighbors stay in touch, share resources, coordinate carpools, plan local events, and look out for one another. It pairs a **Django 5.2 / Django REST Framework** API with a modern **React 19 + Vite** single-page app.

---

## Table of contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Backend setup](#backend-setup)
- [Frontend setup](#frontend-setup)
- [Environment variables](#environment-variables)
- [Running in development](#running-in-development)
- [API documentation](#api-documentation)
- [Testing](#testing)
- [Project structure](#project-structure)
- [Production deployment](#production-deployment)
- [Security notes](#security-notes)

---

## Features

- **Community feed** — text posts, image posts, and polls with likes, threaded comments, and vote tallies.
- **Resource sharing** — a neighborhood lending library: list items, mark availability, and send borrow requests.
- **Carpool** — offer or request rides, filter by date/type/status, and manage seat requests.
- **Events** — create and RSVP to local events, track attendees and capacity.
- **Direct messaging** — one-to-one conversations with read receipts.
- **Notifications** — in-app activity feed (likes, comments, requests, RSVPs) with read/unread state.
- **Community notices** — pinned, prioritized announcements visible to the whole neighborhood.
- **Member directory & profiles** — browse neighbors, view profiles and their activity, edit your own profile and avatar.
- **Global search** — search people, posts, resources, events, and rides from one place.
- **Polished UX** — loading skeletons, empty/error states, toasts, confirmation dialogs, light/dark themes, and a fully responsive layout (320px → desktop).

---

## Architecture

This repository is a monorepo with two independently deployable applications:

```
NeighbourHub/
├── django-backend/   # Django 5.2 + DRF REST API (token auth, 18 models)
└── frontend/         # React 19 + Vite single-page application
```

- The **backend** exposes a versioned REST API under `/api/`, authenticated with DRF token auth (`Authorization: Token <key>`). It uses **SQLite** for local development and **PostgreSQL** in production (switched automatically via `DATABASE_URL`). Uploaded media is stored on the local filesystem in development and on **AWS S3** in production (via `USE_S3`).
- The **frontend** is a client-side SPA that talks to the API through a centralized Axios client. It reads the API base URL from `VITE_API_BASE_URL` at build time.

Responses are paginated (`page_size = 12`) and returned as `{ count, num_pages, page, page_size, next, previous, results }`.

---

## Tech stack

**Backend**

| Concern | Choice |
| --- | --- |
| Language / runtime | Python 3.12 |
| Framework | Django 5.2, Django REST Framework 3.16 |
| Auth | DRF token authentication |
| Filtering | django-filter |
| API docs | drf-spectacular (OpenAPI 3, Swagger UI + ReDoc) |
| Database | SQLite (dev) · PostgreSQL (prod, via dj-database-url + psycopg) |
| Media storage | Local filesystem (dev) · AWS S3 (prod, via django-storages + boto3) |
| Static files | WhiteNoise |
| Server | Gunicorn |
| Images | Pillow |
| Testing | pytest + pytest-django |

**Frontend**

| Concern | Choice |
| --- | --- |
| Language | JavaScript (JSX), React 19 |
| Build tool | Vite 6 |
| Routing | React Router DOM v7 |
| Styling | Tailwind CSS v3.4 + shadcn/ui-style components on Radix UI |
| Icons | Lucide React |
| Animation | Framer Motion |
| HTTP | Axios |
| State | Zustand |
| Forms & validation | React Hook Form + Zod |
| Notifications | Sonner (toasts) |
| Dates | date-fns |
| Testing | Vitest + React Testing Library + jsdom |

---

## Prerequisites

- **Python** 3.12+
- **Node.js** 20+ and **npm** (Vite 6 requires Node 18+; 20 LTS recommended)
- **Git**

PostgreSQL and an AWS S3 bucket are only needed for production; local development runs on SQLite and local file storage out of the box.

---

## Quick start

```bash
# 1. Backend
cd django-backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py seed_demo        # optional: realistic demo data
python manage.py runserver        # → http://localhost:8000

# 2. Frontend (in a second terminal)
cd frontend
npm install
cp .env.example .env
npm run dev                       # → http://localhost:5173
```

Open **http://localhost:5173** and sign in with a demo account (see [demo credentials](#demo-credentials)).

---

## Backend setup

From `django-backend/`:

1. **Create and activate a virtual environment**

   ```bash
   python -m venv .venv
   source .venv/bin/activate        # Windows: .venv\Scripts\activate
   ```

2. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   For local development the defaults work as-is (SQLite, `DEBUG=True`, local media). See [environment variables](#environment-variables).

4. **Apply migrations**

   ```bash
   python manage.py migrate
   ```

5. **(Optional) Seed demo data**

   ```bash
   python manage.py seed_demo          # add --reset to wipe app data first
   ```

   This creates a set of demo residents, posts, resources, rides, events, notices, and conversations, plus an admin user.

6. **Create your own admin (optional)**

   ```bash
   python manage.py createsuperuser
   ```

7. **Run the server**

   ```bash
   python manage.py runserver          # http://localhost:8000
   ```

The Django admin is available at `http://localhost:8000/admin/`.

---

## Frontend setup

From `frontend/`:

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Set `VITE_API_BASE_URL` to your backend's API root (default `http://localhost:8000/api`).

3. **Run the dev server**

   ```bash
   npm run dev                         # http://localhost:5173
   ```

Available scripts:

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |
| `npm run test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |

---

## Environment variables

### Backend (`django-backend/.env`)

| Variable | Default | Description |
| --- | --- | --- |
| `DJANGO_SECRET_KEY` | insecure dev fallback | **Required in production.** Long random string. |
| `DJANGO_DEBUG` | `True` | Set to `False` in production. |
| `DJANGO_ALLOWED_HOSTS` | `localhost,127.0.0.1` | Comma-separated hostnames. |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,...` | Origins allowed to call the API (your frontend). |
| `CSRF_TRUSTED_ORIGINS` | _(empty)_ | Trusted origins for the admin/browsable API behind HTTPS. |
| `DATABASE_URL` | _(empty → SQLite)_ | PostgreSQL connection string in production. |
| `USE_S3` | `False` | Store uploaded media on S3 when `True`. |
| `AWS_ACCESS_KEY_ID` | _(empty)_ | S3 credentials (production only). **Never commit.** |
| `AWS_SECRET_ACCESS_KEY` | _(empty)_ | S3 credentials (production only). **Never commit.** |
| `AWS_STORAGE_BUCKET_NAME` | _(empty)_ | S3 bucket name. |
| `AWS_S3_REGION_NAME` | `us-east-1` | S3 region. |
| `AWS_S3_CUSTOM_DOMAIN` | _(empty)_ | Optional CloudFront/custom media domain. |
| `MAX_UPLOAD_SIZE` | `5242880` | Max upload size in bytes (5 MB). |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:8000/api` | Base URL of the REST API (include the trailing `/api`). |

> AWS credentials are read exclusively from environment variables and are never hard-coded. Do not commit real secrets — commit only `.env.example`.

---

## Running in development

Run both servers side by side:

| Service | Command | URL |
| --- | --- | --- |
| Backend API | `python manage.py runserver` | http://localhost:8000 |
| Frontend SPA | `npm run dev` | http://localhost:5173 |

The frontend proxies all data through `VITE_API_BASE_URL`, so make sure the backend is running and its `CORS_ALLOWED_ORIGINS` includes the frontend origin.

### Demo credentials

After running `python manage.py seed_demo`:

| Role | Login (email or username) | Password |
| --- | --- | --- |
| Resident | `sanjay@example.com` (or `sanjay`) | `demopass123` |
| Admin | `admin` | `adminpass123` |

All seeded residents share the password `demopass123`. Login accepts either email or username.

---

## API documentation

Interactive, always-up-to-date API docs are generated from the code with drf-spectacular:

| Resource | URL |
| --- | --- |
| Swagger UI | http://localhost:8000/api/docs/ |
| ReDoc | http://localhost:8000/api/redoc/ |
| OpenAPI schema | http://localhost:8000/api/schema/ |

### Authentication

Register or log in to receive a token, then send it on every request:

```
Authorization: Token <your-token>
```

- `POST /api/auth/register/` — create an account → `{ token, user }`
- `POST /api/auth/login/` — log in (email or username) → `{ token, user }`
- `POST /api/auth/logout/` — invalidate the current token
- `GET  /api/auth/me/` — the authenticated user

### Main resource endpoints

| Group | Base path |
| --- | --- |
| Users / members | `/api/users/` |
| Posts & comments | `/api/posts/`, `/api/comments/` |
| Resources & requests | `/api/resources/`, `/api/resource-requests/` |
| Carpool rides & requests | `/api/rides/`, `/api/ride-requests/` |
| Events | `/api/events/` |
| Conversations & messages | `/api/conversations/` |
| Notifications | `/api/notifications/` |
| Community notices | `/api/notices/` |
| Global search | `/api/search/?q=` |
| Dashboard stats | `/api/stats/dashboard/` |

List endpoints support pagination and filtering (e.g. `?page=2`, `?search=`, and resource-specific filters such as `?category=`, `?is_available=`).

---

## Testing

**Backend** (from `django-backend/`):

```bash
pytest
```

Covers authentication, the community feed, and resources/events/carpool flows.

**Frontend** (from `frontend/`):

```bash
npm run test          # single run
npm run test:watch    # watch mode
```

Vitest + React Testing Library cover utility functions, form-error mapping, and component rendering. Test setup lives in `src/test/setup.js`.

---

## Project structure

```
NeighbourHub/
├── django-backend/
│   ├── api/
│   │   ├── models.py          # 18 domain models
│   │   ├── serializers.py     # DRF serializers
│   │   ├── views.py           # ViewSets & API views
│   │   ├── urls.py            # API routing
│   │   ├── permissions.py     # object-level ownership checks
│   │   ├── services.py        # business logic
│   │   ├── validators.py      # file type/size validation
│   │   ├── signals.py         # notification triggers
│   │   ├── admin.py
│   │   ├── management/commands/seed_demo.py
│   │   └── tests/             # pytest suite
│   ├── config/                # settings, urls, wsgi/asgi
│   ├── requirements.txt
│   ├── Procfile · build.sh · render.yaml · runtime.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── pages/             # route-level screens
    │   ├── components/        # UI + feature components
    │   ├── layouts/           # app & auth shells
    │   ├── services/          # Axios API clients
    │   ├── store/             # Zustand stores
    │   ├── schemas/           # Zod validation schemas
    │   ├── hooks/ · lib/ · utils/
    │   └── test/setup.js
    ├── package.json
    ├── vite.config.js · tailwind.config.js
    └── .env.example
```

---

## Production deployment

### Backend

1. Set production environment variables: `DJANGO_DEBUG=False`, a strong `DJANGO_SECRET_KEY`, your real `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, and `CSRF_TRUSTED_ORIGINS`.
2. Provision PostgreSQL and set `DATABASE_URL`.
3. To store media on S3, set `USE_S3=True` and provide the `AWS_*` variables.
4. Collect static files and migrate:

   ```bash
   python manage.py collectstatic --noinput
   python manage.py migrate
   ```

5. Serve with Gunicorn (static files handled by WhiteNoise):

   ```bash
   gunicorn config.wsgi
   ```

The repo includes `Procfile`, `build.sh`, `render.yaml`, and `runtime.txt` for one-click deployment on platforms such as Render.

### Frontend

1. Set `VITE_API_BASE_URL` to your deployed API URL.
2. Build the static bundle:

   ```bash
   npm run build
   ```

3. Serve the generated `dist/` directory from any static host or CDN (Netlify, Vercel, S3 + CloudFront, etc.).

---

## Security notes

- **No hard-coded secrets.** All secrets (Django secret key, database URL, AWS credentials) come from environment variables. Only `.env.example` is committed.
- **Object-level authorization.** Users can only modify or delete their own content; ownership is enforced with DRF permissions on every write.
- **File validation.** Uploads are validated for type and size (default max 5 MB).
- **Production hardening.** Run with `DEBUG=False`, an explicit `ALLOWED_HOSTS`, a configured `CORS_ALLOWED_ORIGINS`, HTTPS, and secure database credentials.

---

<p align="center"><em>NeighbourHub — your neighborhood, connected.</em></p>
