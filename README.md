# NeighbourHub

> **Your neighborhood. Connected.**

NeighbourHub is a full-stack community platform that helps neighbors stay in touch, share resources, coordinate carpools, plan local events, and look out for one another. It pairs a **Django 5.2 / Django REST Framework** API with a modern **React 19 + Vite** single-page app.

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
├── backend/     # Django + REST API
└── frontend/    # React + Vite SPA
```

---

## Backend setup

From `backend/`:

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

4. **Apply migrations**

   ```bash
   python manage.py migrate
   ```

5. **(Optional) Seed demo data**

   ```bash
   python manage.py seed_demo
   ```

6. **Create your own admin (optional)**

   ```bash
   python manage.py createsuperuser
   ```

7. **Run the server**

   ```bash
   python manage.py runserver          # http://localhost:8000
   ```

The Django admin is available at `http://localhost:8000/admin/`, the API docs at `http://localhost:8000/api/docs/`.

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

3. **Run the dev server**

   ```bash
   npm run dev                         # http://localhost:5173
   ```

## Running in development

Run both servers side by side:

| Service | Command | URL |
| --- | --- | --- |
| Backend API | `python manage.py runserver` | http://localhost:8000 |
| Frontend SPA | `npm run dev` | http://localhost:5173 |

---

## Deployment

The project ships with configuration for **Render** (API) + **Vercel** (SPA), backed by managed PostgreSQL.

### 1. Backend on Render

`backend/render.yaml` is a Render Blueprint that provisions the web service and a free PostgreSQL database. Either use **Blueprint deploy** from the Render dashboard, or create the service manually with:

- **Root directory:** `backend`
- **Build command:** `./build.sh`
- **Start command:** `gunicorn config.wsgi:application`

Required environment variables:

| Variable | Example | Notes |
| --- | --- | --- |
| `DJANGO_SECRET_KEY` | (generate) | Render can auto-generate this |
| `DJANGO_DEBUG` | `False` | |
| `DJANGO_ALLOWED_HOSTS` | `neighbourhub-api.onrender.com` | Your Render domain |
| `CORS_ALLOWED_ORIGINS` | `https://your-frontend.vercel.app` | Your Vercel domain |
| `CSRF_TRUSTED_ORIGINS` | `https://your-frontend.vercel.app` | Same as above |
| `DATABASE_URL` | — | Injected automatically by the Blueprint |

Health check: `GET /healthz/` returns `200 ok`. Migrations run automatically on every deploy via the `release` phase in `Procfile`.

### 2. Frontend on Vercel

Import the repository in Vercel and set **Root Directory** to `frontend` — `vercel.json` configures the build and SPA rewrites automatically. Then set:

| Variable | Example |
| --- | --- |
| `VITE_API_BASE_URL` | `https://neighbourhub-api.onrender.com/api` |

### 3. Media storage (optional)

Uploads are stored on the server's local disk by default, which is fine for testing but **ephemeral on Render's free tier**. For persistent uploads set `USE_S3=True` plus `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_STORAGE_BUCKET_NAME` (and optionally `AWS_S3_CUSTOM_DOMAIN` for a CDN).

---

<p align="center"><em>NeighbourConnect</em></p>
