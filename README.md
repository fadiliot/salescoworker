# Sales Co-worker — Full Stack App

AI-powered sales assistant with Zoho CRM, Outlook, and Yeastar PBX integrations.

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (running on localhost:5432)

---

## Backend Setup

```bash
cd backend

# 1. Create virtual environment
python -m venv venv
venv\Scripts\activate    # Windows
# source venv/bin/activate  # Mac/Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Copy and configure environment
copy .env.example .env
# Edit .env with your credentials

# 4. Start the API server
uvicorn app.main:app --reload --port 8000
```

The API will auto-create all database tables on startup.

To seed dummy data:
```bash
python seed.py
```

API docs: http://localhost:8000/docs

---

## Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
```

Open http://localhost:3000

---

## Environment Variables (backend/.env)

| Variable | Description |
|---|---|
| DATABASE_URL | PostgreSQL connection string |
| ZOHO_CLIENT_ID / SECRET | From https://api-console.zoho.com/ |
| MS_CLIENT_ID / SECRET | From https://portal.azure.com |
| GEMINI_API_KEY | From https://aistudio.google.com/app/apikey |
| YEASTAR_HOST / USERNAME / PASSWORD | Your PBX details |

---

## OAuth Setup

### Zoho
1. Go to https://api-console.zoho.com/
2. Create a Server-based Application
3. Set redirect URI: `http://localhost:8000/api/auth/callback/zoho`
4. Scopes: `ZohoCRM.modules.ALL,ZohoBooks.fullaccess.all`

### Microsoft (Outlook)
1. Go to https://portal.azure.com → App Registrations → New
2. Set redirect URI: `http://localhost:8000/api/auth/callback/microsoft`
3. Add API permissions: `Mail.ReadWrite, Mail.Send, Calendars.Read, User.Read, offline_access`

---

## Pages
| Route | Description |
|---|---|
| `/` | Dashboard — stats, hot leads, AI insights, reminders |
| `/leads` | Lead table with search, filter, AI scoring |
| `/pipeline` | Kanban board with drag-and-drop |
| `/inbox` | Email inbox with AI reply suggestions |
| `/activities` | Timeline of calls, emails, meetings |
| `/reminders` | Follow-up reminders with urgency tracking |
| `/settings` | Integration connections + config guide |

---

## Deployment (Production)

### Backend & Database (Render)
1. Push your code to a GitHub repository.
2. Sign in to [Render](https://render.com/).
3. Click **New** → **Blueprint** from your dashboard.
4. Connect the GitHub repository. Render will automatically detect the `render.yaml` file in the root of the project.
5. Important: Ensure you fill out the required environment variables (Zoho, MS, Gemini) in the Render dashboard during setup since they are marked as `sync: false` for security.
6. Click **Apply**. Render will provision your PostgreSQL database and deploy the FastAPI backend.

### Frontend (Vercel)
1. Sign in to [Vercel](https://vercel.com/) and click **Add New** → **Project**.
2. Import the same GitHub repository.
3. Keep the **Framework Preset** as `Next.js`.
4. Set the **Root Directory** to `frontend`.
5. Add the environment variable to connect the frontend to the backend:
   - `NEXT_PUBLIC_API_URL` = `<your-render-backend-url>` (e.g., `https://sales-coworker-api.onrender.com`)
6. Click **Deploy**.
