from fastapi import APIRouter, HTTPException, BackgroundTasks
from src.ai.recommender import recommender
from src.utils.logger import logger
from datetime import datetime

router = APIRouter()

@router.post("/train")
async def train_model(background_tasks: BackgroundTasks):
    """Train the recommendation model in the background"""
    try:
        background_tasks.add_task(recommender.train)
        return {
            "success": True,
            "message": "Model training started",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to start model training: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recommendations/user/{user_id}")
async def get_user_recommendations(user_id: str, limit: int = 5):
    """Get personalized product recommendations for a user"""
    try:
        recommendations = recommender.get_user_recommendations(user_id, limit)
        
        return {
            "success": True,
            "data": {
                "user_id": user_id,
                "recommendations": recommendations,
                "count": len(recommendations),
                "algorithm": "collaborative_filtering"
            }
        }
    except Exception as e:
        logger.error(f"Failed to get user recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recommendations/product/{product_id}")
async def get_similar_products(product_id: str, limit: int = 5):
    """Get similar products (customers who bought this also bought...)"""
    try:
        recommendations = recommender.get_similar_products(product_id, limit)
        
        return {
            "success": True,
            "data": {
                "product_id": product_id,
                "similar_products": recommendations,
                "count": len(recommendations),
                "algorithm": "item_similarity"
            }
        }
    except Exception as e:
        logger.error(f"Failed to get similar products: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recommendations/popular")
async def get_popular_products(limit: int = 10):
    """Get most popular products"""
    try:
        recommendations = recommender.get_popular_products(limit)
        
        return {
            "success": True,
            "data": {
                "popular_products": recommendations,
                "count": len(recommendations),
                "algorithm": "popularity_based"
            }
        }
    except Exception as e:
        logger.error(f"Failed to get popular products: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/model/status")
async def get_model_status():
    """Get recommendation model status"""
    try:
        is_trained = (
            recommender.user_item_matrix is not None and
            recommender.product_similarity is not None
        )
        
        return {
            "success": True,
            "data": {
                "is_trained": is_trained,
                "products_count": len(recommender.product_names),
                "timestamp": datetime.now().isoformat()
            }
        }
    except Exception as e:
        logger.error(f"Failed to get model status: {e}")
        raise HTTPException(status_code=500, detail=str(e))
