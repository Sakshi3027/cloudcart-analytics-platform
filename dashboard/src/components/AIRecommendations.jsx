import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function AIRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3004/api/ai/recommendations/popular?limit=5');
      setRecommendations(response.data.data.popular_products);
      setError(null);
    } catch (err) {
      setError('Failed to load AI recommendations');
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        background: 'rgba(30, 41, 59, 0.6)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <Sparkles style={{ color: '#8b5cf6', width: '24px', height: '24px' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'white', margin: 0 }}>
            AI Recommendations
          </h3>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
          Loading AI predictions...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: 'rgba(30, 41, 59, 0.6)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <AlertCircle style={{ color: '#ef4444', width: '24px', height: '24px' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'white', margin: 0 }}>
            AI Recommendations
          </h3>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#f87171' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.6)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(148, 163, 184, 0.1)',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            padding: '0.5rem',
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '8px'
          }}>
            <Sparkles style={{ color: '#8b5cf6', width: '20px', height: '20px' }} />
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'white', margin: 0 }}>
            AI-Powered Recommendations
          </h3>
        </div>
        <span style={{
          padding: '0.25rem 0.75rem',
          background: 'rgba(139, 92, 246, 0.1)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '999px',
          fontSize: '0.75rem',
          color: '#a78bfa',
          fontWeight: '500'
        }}>
          ML Powered
        </span>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
          Products trending based on purchase patterns
        </p>
      </div>

      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {recommendations.map((product, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem',
              background: 'rgba(15, 23, 42, 0.4)',
              borderRadius: '8px',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)';
              e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(15, 23, 42, 0.4)';
              e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.1)';
            }}
          >
            <div style={{
              flexShrink: 0,
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              color: 'white',
              fontSize: '1.125rem'
            }}>
              {index + 1}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                color: 'white',
                fontWeight: '500',
                margin: 0,
                marginBottom: '0.25rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {product.product_name}
              </p>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
                {product.total_sold} sold • {product.order_count} orders
              </p>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              color: '#10b981',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              <TrendingUp style={{ width: '16px', height: '16px' }} />
              <span>Hot</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: '1rem',
        padding: '0.75rem',
        background: 'rgba(139, 92, 246, 0.05)',
        border: '1px solid rgba(139, 92, 246, 0.1)',
        borderRadius: '8px',
        fontSize: '0.75rem',
        color: '#a78bfa',
        textAlign: 'center'
      }}>
        ✨ Powered by Machine Learning • Collaborative Filtering Algorithm
      </div>
    </div>
  );
}
