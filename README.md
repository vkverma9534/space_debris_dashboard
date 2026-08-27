# space_debris_dashboard
A custom web-based dashboard for monitoring space debris and orbital populations, analyzing simulated collision risks, and exploring orbital environments. It provides interactive charts, 3D satellite visualization, risk alerts, advanced orbital analytics, and catalog exploration without relying on Streamlit hosting.

## Local development

Open two terminals from the repository root.

Backend:

```powershell
Push-Location backend
uvicorn main:app --reload --port 8000
Pop-Location
```

Frontend:

```powershell
Push-Location frontend
npm install
npm run dev
Pop-Location
```

Open http://localhost:3000. The backend health endpoint is http://localhost:8000/api/health.

## Production deployment

Deploy the backend as a persistent Python web service and the frontend as a separate Next.js service. Render plus Vercel is the supported setup in this repository.

### 1. Push the repository

Commit and push the repository to GitHub or another Git provider. Do not commit `backend/.venv`, `frontend/node_modules`, `.next`, `.env.local`, or generated Python cache files.

The tracked CSV files under `backend/backend/data` are the initial fallback catalog. The backend refreshes them at runtime when the upstream data sources are reachable.

### 2. Deploy the backend on Render

1. In Render, choose **New > Blueprint**.
2. Select the repository and the `render.yaml` file in the repository root.
3. Create the service.
4. The blueprint configures:
	- Root directory: `backend`
	- Build command: `pip install -r requirements.txt`
	- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
	- Health check: `/api/health`
5. Copy the deployed backend URL, for example `https://space-debris-api.onrender.com`.

The backend loads the packaged catalog immediately, then attempts a background refresh. This means the service can answer health and dashboard requests without waiting for an upstream timeout. The footer reports whether the active data is live or fallback data.

The backend is pinned to Python 3.12.8 in `backend/runtime.txt`. This matches the pinned NumPy and Pandas versions. If Render reports Python 3.14 and starts building Pandas from source, add `PYTHON_VERSION` as described below, save the environment variables, and deploy again.

### 3. Configure backend CORS

In the Render service environment variables, add both variables:

```text
PYTHON_VERSION=3.12.8
```

```text
FRONTEND_URLS=https://your-project.vercel.app
```

For multiple frontend domains, separate origins with commas:

```text
FRONTEND_URLS=https://your-project.vercel.app,https://dashboard.example.com
```

Use origins only, with no path or trailing API route. Redeploy after changing environment variables.

### 4. Verify the backend

Replace the host below with the actual Render URL:

```powershell
$api = "https://space-debris-api.onrender.com"
Invoke-WebRequest "$api/api/health" -UseBasicParsing
Invoke-WebRequest "$api/api/categories" -UseBasicParsing
```

The health response should include `status: "ok"`, a positive `objects` count, and `data_source` set to `refreshing`, `live`, or `fallback`.

To request a strict fresh CSV download:

```powershell
Invoke-WebRequest `
  "$api/api/catalog/download" `
  -OutFile space-debris-catalog.csv
```

This endpoint returns a CSV only when every configured dataset was downloaded from CelesTrak or the mirror. It returns HTTP 503 instead of silently exporting old local data when an upstream source is unavailable.

### 5. Deploy the frontend on Vercel

1. In Vercel, choose **Add New > Project** and import the repository.
2. Set the project root directory to `frontend`.
3. Keep the framework preset as **Next.js**.
4. Set the environment variable:

```text
NEXT_PUBLIC_API_URL=https://space-debris-api.onrender.com
```

5. Deploy the project.
6. Copy the Vercel URL and add it to the Render `FRONTEND_URLS` variable if it was not already configured.
7. Redeploy the backend after changing CORS, then redeploy the frontend if necessary.

### 6. Confirm fresh data in production

1. Open the deployed Vercel URL.
2. Confirm the dashboard categories load.
3. Check the footer indicator:
	- `Data source: downloading fresh data` means the background refresh is still running.
	- `Data source: live download` means upstream data was downloaded and recalculated.
	- `Data source: local fallback` means the packaged CSVs were used because an upstream source failed.
4. Use **Download fresh CSV** in Catalog Explorer to force a strict live refresh.

### Deployment limitations

The live data sources must be reachable from the deployed backend. Render is recommended for the backend because it keeps a running Python process and permits the background refresh to finish. A serverless-only deployment can terminate background work and has shorter request time limits, so it should not be used as the primary backend for fresh catalog downloads.
