import React from 'react';
import { Inbox, SearchX, Plus } from 'lucide-react';

export default function EmptyState({ isFiltered = false, onAddTransaction, onResetFilters }) {
  if (isFiltered) {
    return (
      <div className="py-12 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <SearchX className="w-6 h-6" />
        </div>
        <h4 className="text-sm sm:text-base font-semibold text-slate-800">
          No transactions found
        </h4>
        <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto mt-1 mb-4">
          Try changing your search query, filter options, or selected date range.
        </p>
        {onResetFilters && (
          <button
            onClick={onResetFilters}
            className="text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-md transition"
          >
            Clear all filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="py-12 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
        <Inbox className="w-6 h-6" />
      </div>
      <h4 className="text-sm sm:text-base font-semibold text-slate-800">
        No transactions yet
      </h4>
      <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto mt-1 mb-4">
        Start tracking your money by recording your first income or expense.
      </p>
      {onAddTransaction && (
        <button
          onClick={onAddTransaction}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg transition shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Transaction</span>
        </button>
      )}
    </div>
  );
}
