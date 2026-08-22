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
├── django-backend/   # Django + REST API 
└── frontend/         # React + Vite 
```

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

###
<p align="center"><em>NeighbourConnect</em></p>
