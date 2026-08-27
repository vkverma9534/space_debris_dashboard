from fastapi import FastAPI

app = FastAPI()


@app.get("/api")
def api_root():
    return {
        "status": "ok",
        "message": "FastAPI is running on Vercel"
    }


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "message": "Health endpoint is working"
    }