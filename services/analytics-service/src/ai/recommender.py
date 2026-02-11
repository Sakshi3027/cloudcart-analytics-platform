import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from collections import defaultdict
from src.kafka_consumer.clickhouse_client import clickhouse_client
from src.utils.logger import logger

class ProductRecommender:
    def __init__(self):
        self.user_item_matrix = None
        self.product_similarity = None
        self.product_names = {}
        
    def load_data(self):
        """Load order data from ClickHouse"""
        try:
            # Get all order items
            query = """
                SELECT 
                    oi.order_id,
                    oe.user_id,
                    oi.product_id,
                    oi.product_name,
                    oi.quantity,
                    oi.subtotal
                FROM order_items_analytics oi
                JOIN order_events oe ON oi.order_id = oe.order_id
                WHERE oe.event_type = 'order.created'
            """
            
            result = clickhouse_client.client.execute(query)
            
            if not result:
                logger.warning("No order data available for recommendations")
                return pd.DataFrame()
            
            # Convert to DataFrame
            df = pd.DataFrame(result, columns=[
                'order_id', 'user_id', 'product_id', 'product_name', 'quantity', 'subtotal'
            ])
            
            # Store product names
            self.product_names = dict(zip(df['product_id'], df['product_name']))
            
            logger.info(f"Loaded {len(df)} order items for recommendation engine")
            return df
            
        except Exception as e:
            logger.error(f"Failed to load recommendation data: {e}")
            return pd.DataFrame()
    
    def build_user_item_matrix(self, df):
        """Create user-item interaction matrix"""
        if df.empty:
            return None
            
        # Group by user and product, sum quantities
        user_product = df.groupby(['user_id', 'product_id'])['quantity'].sum().reset_index()
        
        # Pivot to create user-item matrix
        matrix = user_product.pivot(
            index='user_id',
            columns='product_id',
            values='quantity'
        ).fillna(0)
        
        return matrix
    
    def calculate_product_similarity(self, df):
        """Calculate product-to-product similarity"""
        if df.empty:
            return None
            
        # Create product co-occurrence matrix
        product_product = df.groupby('order_id')['product_id'].apply(list).reset_index()
        
        # Build co-purchase matrix
        products = df['product_id'].unique()
        n_products = len(products)
        product_idx = {pid: idx for idx, pid in enumerate(products)}
        
        co_matrix = np.zeros((n_products, n_products))
        
        for _, row in product_product.iterrows():
            items = row['product_id']
            for i in range(len(items)):
                for j in range(len(items)):
                    if i != j:
                        idx_i = product_idx[items[i]]
                        idx_j = product_idx[items[j]]
                        co_matrix[idx_i][idx_j] += 1
        
        # Calculate cosine similarity
        similarity = cosine_similarity(co_matrix)
        
        return pd.DataFrame(similarity, index=products, columns=products)
    
    def train(self):
        """Train the recommendation model"""
        try:
            logger.info("Training recommendation model...")
            
            # Load data
            df = self.load_data()
            
            if df.empty:
                logger.warning("No data available for training")
                return False
            
            # Build matrices
            self.user_item_matrix = self.build_user_item_matrix(df)
            self.product_similarity = self.calculate_product_similarity(df)
            
            logger.info("Recommendation model trained successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to train recommendation model: {e}")
            return False
    
    def get_user_recommendations(self, user_id, n=5):
        """Get product recommendations for a user"""
        try:
            if self.user_item_matrix is None or self.user_item_matrix.empty:
                return []
            
            # Check if user exists
            if user_id not in self.user_item_matrix.index:
                # Return popular products for new users
                return self.get_popular_products(n)
            
            # Get user's purchase history
            user_items = self.user_item_matrix.loc[user_id]
            purchased = user_items[user_items > 0].index.tolist()
            
            # Calculate similarity-based scores
            scores = {}
            for product in self.product_similarity.index:
                if product not in purchased:
                    # Score based on similarity to purchased items
                    score = sum(
                        self.product_similarity.loc[product, p] * user_items[p]
                        for p in purchased
                    )
                    scores[product] = score
            
            # Sort and get top N
            top_products = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:n]
            
            recommendations = [
                {
                    'product_id': pid,
                    'product_name': self.product_names.get(pid, 'Unknown'),
                    'score': float(score)
                }
                for pid, score in top_products
            ]
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Failed to get user recommendations: {e}")
            return []
    
    def get_similar_products(self, product_id, n=5):
        """Get similar products based on co-purchase patterns"""
        try:
            if self.product_similarity is None or self.product_similarity.empty:
                return []
            
            if product_id not in self.product_similarity.index:
                return []
            
            # Get similarity scores
            similarities = self.product_similarity[product_id].sort_values(ascending=False)
            
            # Exclude the product itself
            similarities = similarities[similarities.index != product_id]
            
            # Get top N
            top_similar = similarities.head(n)
            
            recommendations = [
                {
                    'product_id': pid,
                    'product_name': self.product_names.get(pid, 'Unknown'),
                    'similarity': float(score)
                }
                for pid, score in top_similar.items()
            ]
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Failed to get similar products: {e}")
            return []
    
    def get_popular_products(self, n=5):
        """Get most popular products (fallback for cold start)"""
        try:
            query = f"""
                SELECT 
                    product_id,
                    product_name,
                    sum(quantity) as total_sold,
                    count(DISTINCT order_id) as order_count
                FROM order_items_analytics
                GROUP BY product_id, product_name
                ORDER BY total_sold DESC
                LIMIT {n}
            """
            
            result = clickhouse_client.client.execute(query)
            
            recommendations = [
                {
                    'product_id': row[0],
                    'product_name': row[1],
                    'total_sold': row[2],
                    'order_count': row[3]
                }
                for row in result
            ]
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Failed to get popular products: {e}")
            return []

# Global recommender instance
recommender = ProductRecommender()
