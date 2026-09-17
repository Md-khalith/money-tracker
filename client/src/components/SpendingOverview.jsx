import React from 'react';
import { PieChart } from 'lucide-react';
import { formatINR } from '../utils/currency';

export default function SpendingOverview({ spendingByCategory = [], totalSpent = 0, loading = false }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PieChart className="w-4 h-4 text-slate-500" />
          <h3 className="font-semibold text-slate-800 text-sm sm:text-base">
            Spending by Category
          </h3>
        </div>
        {totalSpent > 0 && (
          <span className="text-xs text-slate-500 font-medium">
            Total: {formatINR(totalSpent)}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-4 py-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between">
                <div className="h-4 w-24 bg-slate-100 animate-pulse rounded" />
                <div className="h-4 w-16 bg-slate-100 animate-pulse rounded" />
              </div>
              <div className="h-2 w-full bg-slate-100 animate-pulse rounded-full" />
            </div>
          ))}
        </div>
      ) : spendingByCategory.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-2">
            <PieChart className="w-5 h-5" />
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-600">No expenses in this period</p>
          <p className="text-xs text-slate-400 mt-0.5">Add spent transactions to see your breakdown.</p>
        </div>
      ) : (
        <div className="space-y-3.5 flex-1">
          {spendingByCategory.map((cat) => {
            return (
              <div key={cat.categoryId} className="group">
                <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
                  <div className="flex items-center gap-2 font-medium text-slate-700 truncate">
                    <span className="text-base flex-shrink-0">{cat.icon || '🏷️'}</span>
                    <span className="truncate">{cat.categoryName}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-slate-400 text-xs">{cat.percentage}%</span>
                    <span className="font-semibold text-slate-800">{formatINR(cat.total)}</span>
                  </div>
                </div>

                {/* Horizontal Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.max(cat.percentage, 2)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
