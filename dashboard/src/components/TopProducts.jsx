import React from 'react';
import { Package, TrendingUp } from 'lucide-react';

export default function TopProducts({ products }) {
  if (!products || products.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Top Products</h3>
        <div className="text-slate-400 text-center py-8">No products data</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Top Products</h3>
        <Package className="w-5 h-5 text-slate-400" />
      </div>
      <div className="space-y-4">
        {products.map((product, index) => (
          <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-slate-900/30 hover:bg-slate-900/50 transition-colors">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <span className="text-blue-400 font-bold">#{index + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{product.product_name}</p>
              <p className="text-slate-400 text-sm">
                {product.total_quantity} sold • {product.order_count} orders
              </p>
            </div>
            <div className="text-right">
              <p className="text-white font-semibold">${product.total_revenue.toFixed(2)}</p>
              <p className="text-green-400 text-sm flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Revenue
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
