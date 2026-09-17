import React from 'react';
import { History, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { formatINR } from '../utils/currency';
import { formatFriendlyDate } from '../utils/date';

export default function RecentTransactions({ transactions = [], onSelectTransaction, loading = false }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-4 h-4 text-slate-500" />
        <h3 className="font-semibold text-slate-800 text-sm sm:text-base">
          Recent Activity
        </h3>
      </div>

      {loading ? (
        <div className="space-y-3 py-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between items-center py-2">
              <div className="space-y-1.5">
                <div className="h-4 w-28 bg-slate-100 animate-pulse rounded" />
                <div className="h-3 w-16 bg-slate-100 animate-pulse rounded" />
              </div>
              <div className="h-4 w-16 bg-slate-100 animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-2">
            <History className="w-5 h-5" />
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-600">No recent transactions</p>
          <p className="text-xs text-slate-400 mt-0.5">Transactions you add will appear here.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 flex-1">
          {transactions.map((t) => {
            const isReceived = t.type === 'RECEIVED';
            return (
              <div
                key={t.id}
                onClick={() => onSelectTransaction && onSelectTransaction(t)}
                className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between group hover:bg-slate-50/80 px-1.5 -mx-1.5 rounded-lg transition cursor-pointer"
                title="Click to edit or view"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm ${
                    isReceived ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {t.categoryIcon || (isReceived ? '↓' : '↑')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-slate-800 truncate">
                      {t.description || t.categoryName}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {t.categoryName} · {formatFriendlyDate(t.transactionDate)}
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 pl-2">
                  <p className={`text-xs sm:text-sm font-semibold tracking-tight ${
                    isReceived ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {isReceived ? '+ ' : '- '}
                    {formatINR(t.amount)}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {t.paymentMethod}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
