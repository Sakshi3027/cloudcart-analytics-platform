from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.routes import router
from src.utils.logger import logger
import os

app = FastAPI(
    title="Analytics Service",
    description="Real-time analytics and metrics for CloudCart Platform",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)

@app.get("/")
async def root():
    return {
        "service": "analytics-service",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health():
    return {
        "success": True,
        "message": "Service is healthy",
        "data": {
            "service": "analytics-service",
            "status": "UP"
        }
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 3004))
    uvicorn.run(app, host="0.0.0.0", port=port)
