import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingCart, TrendingUp, Users, RefreshCw, Activity } from 'lucide-react';
import { analyticsAPI } from './services/api';
import StatCard from './components/StatCard';
import SalesChart from './components/SalesChart';
import TopProducts from './components/TopProducts';
import OrderStatus from './components/OrderStatus';
import './App.css';

function App() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsAPI.getDashboard();
      setDashboard(response.data.data);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to fetch dashboard data. Make sure backend services are running.');
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !dashboard) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw style={{
            width: '48px',
            height: '48px',
            color: '#3b82f6',
            margin: '0 auto 1rem',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: '#94a3b8', fontSize: '1.125rem' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !dashboard) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        padding: '2rem'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '500px' }}>
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '1.5rem'
          }}>
            <p style={{ color: '#f87171', fontSize: '1rem', lineHeight: '1.6' }}>{error}</p>
          </div>
          <button
            onClick={fetchDashboard}
            style={{
              padding: '0.75rem 2rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '2rem',
      boxSizing: 'border-box',
      overflow: 'auto'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(30, 41, 59, 0.6)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        borderRadius: '16px',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <Activity style={{ color: '#3b82f6', width: '40px', height: '40px' }} />
              <h1 style={{
                fontSize: '2.5rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0
              }}>
                CloudCart Analytics
              </h1>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '1.125rem', margin: 0 }}>
              Real-time business insights and metrics
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
            <button
              onClick={fetchDashboard}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
            >
              <RefreshCw style={{
                width: '16px',
                height: '16px',
                animation: loading ? 'spin 1s linear infinite' : 'none'
              }} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid - Full Width */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <StatCard
          title="Total Revenue"
          value={`$${dashboard?.overview?.total_revenue?.toFixed(2) || '0.00'}`}
          change={12.5}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Total Orders"
          value={dashboard?.overview?.total_orders || 0}
          change={8.2}
          icon={ShoppingCart}
          color="blue"
        />
        <StatCard
          title="Avg Order Value"
          value={`$${dashboard?.overview?.average_order_value?.toFixed(2) || '0.00'}`}
          change={-2.4}
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          title="Active Users"
          value="124"
          change={15.3}
          icon={Users}
          color="orange"
        />
      </div>

      {/* Charts Row - Full Width */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        <SalesChart data={dashboard?.recent_sales} />
        <OrderStatus distribution={dashboard?.order_status} />
      </div>

      {/* Top Products - Full Width */}
      <TopProducts products={dashboard?.top_products} />

      {/* Footer */}
      <div style={{
        marginTop: '3rem',
        textAlign: 'center',
        color: '#64748b',
        fontSize: '0.875rem'
      }}>
        <p>Built with React • Real-time Analytics • Event-Driven Architecture</p>
      </div>
    </div>
  );
}

export default App;
