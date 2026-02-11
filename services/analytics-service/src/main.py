from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.routes import router as analytics_router
from src.api.ai_routes import router as ai_router
from src.ai.recommender import recommender
from src.utils.logger import logger
import os

app = FastAPI(
    title="CloudCart Analytics API",
    description="Real-time analytics and AI-powered recommendations",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(analytics_router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(ai_router, prefix="/api/ai", tags=["AI Recommendations"])

@app.on_event("startup")
async def startup_event():
    """Train recommendation model on startup"""
    logger.info("Starting Analytics API with AI capabilities...")
    # Train model in background
    try:
        recommender.train()
        logger.info("AI recommendation model initialized")
    except Exception as e:
        logger.error(f"Failed to initialize AI model: {e}")

@app.get("/health")
async def health_check():
    return {
        "success": True,
        "message": "Analytics Service with AI is healthy",
        "data": {
            "service": "analytics-service",
            "status": "UP",
            "ai_enabled": True
        }
    }

@app.get("/")
async def root():
    return {
        "message": "CloudCart Analytics API with AI",
        "version": "2.0.0",
        "features": ["Real-time Analytics", "AI Recommendations"]
    }
