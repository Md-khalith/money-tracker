import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { formatINR } from '../utils/currency';
import { formatDate } from '../utils/date';
import EmptyState from './EmptyState';

export default function TransactionTable({
  transactions = [],
  loading = false,
  isFiltered = false,
  onEditTransaction,
  onDeleteTransaction,
  onAddTransaction,
  onResetFilters
}) {
  if (loading) {
    return (
      <div className="py-8 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-lg w-full" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        isFiltered={isFiltered}
        onAddTransaction={onAddTransaction}
        onResetFilters={onResetFilters}
      />
    );
  }

  return (
    <div>
      {/* Desktop Table View (Hidden on mobile) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-50/50">
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Payment</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
            {transactions.map((t) => {
              const isReceived = t.type === 'RECEIVED';
              return (
                <tr
                  key={t.id}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  {/* Date */}
                  <td className="py-3.5 px-4 font-medium text-slate-600 whitespace-nowrap">
                    {formatDate(t.transactionDate)}
                  </td>

                  {/* Description */}
                  <td className="py-3.5 px-4 text-slate-800 font-medium max-w-[220px] truncate">
                    {t.description || <span className="text-slate-400 italic">No description</span>}
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 bg-slate-100/80 px-2 py-0.5 rounded text-xs font-normal">
                      <span>{t.categoryIcon || '🏷️'}</span>
                      <span>{t.categoryName}</span>
                    </span>
                  </td>

                  {/* Payment Method */}
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                    {t.paymentMethod}
                  </td>

                  {/* Type Badge */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                        isReceived
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                      }`}
                    >
                      {isReceived ? 'Received' : 'Spent'}
                    </span>
                  </td>

                  {/* Amount */}
                  <td
                    className={`py-3.5 px-4 text-right font-semibold whitespace-nowrap tracking-tight ${
                      isReceived ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {isReceived ? '+ ' : '- '}
                    {formatINR(t.amount)}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition">
                      <button
                        onClick={() => onEditTransaction(t)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition"
                        title="Edit transaction"
                        aria-label="Edit transaction"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteTransaction(t)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                        title="Delete transaction"
                        aria-label="Delete transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout (Visible on screens < md) */}
      <div className="block md:hidden divide-y divide-slate-100">
        {transactions.map((t) => {
          const isReceived = t.type === 'RECEIVED';
          return (
            <div key={t.id} className="py-3 px-1 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 font-medium text-slate-800 text-sm truncate">
                  {t.description || t.categoryName}
                </div>
                <div
                  className={`text-sm font-semibold whitespace-nowrap flex-shrink-0 tracking-tight ${
                    isReceived ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {isReceived ? '+ ' : '- '}
                  {formatINR(t.amount)}
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>{t.categoryIcon} {t.categoryName}</span>
                <span>·</span>
                <span>{t.paymentMethod}</span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  {formatDate(t.transactionDate)}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onEditTransaction(t)}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteTransaction(t)}
                    className="text-xs font-medium text-rose-600 hover:text-rose-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
