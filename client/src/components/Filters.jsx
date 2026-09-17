import React from 'react';
import { Search, X, Filter } from 'lucide-react';
import { ALLOWED_PAYMENT_METHODS } from '../constants';

export default function Filters({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  paymentFilter,
  onPaymentFilterChange,
  categories = [],
  onResetFilters,
  totalResults = 0
}) {
  const hasActiveFilters = search || typeFilter !== 'All' || categoryFilter !== 'All' || paymentFilter !== 'All';

  return (
    <div className="space-y-3">
      {/* Top Bar: Search Input and Type Toggle */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by description or category..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full text-xs sm:text-sm pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition shadow-2xs"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Type Toggle Pills */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200/80 self-start sm:self-auto">
          {['All', 'SPENT', 'RECEIVED'].map((type) => {
            const isSelected = typeFilter === type;
            const label = type === 'SPENT' ? 'Spent' : type === 'RECEIVED' ? 'Received' : 'All';
            return (
              <button
                key={type}
                onClick={() => onTypeFilterChange(type)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Second Row: Dropdowns & Reset */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600">
        <div className="flex items-center gap-1.5 text-slate-400 mr-1">
          <Filter className="w-3.5 h-3.5" />
          <span className="font-medium text-[11px] uppercase tracking-wider">Filters:</span>
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-1.5">
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-700 shadow-2xs"
          >
            <option value="All">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon ? `${cat.icon} ` : ''}{cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Method Dropdown */}
        <div className="flex items-center gap-1.5">
          <select
            value={paymentFilter}
            onChange={(e) => onPaymentFilterChange(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-700 shadow-2xs"
          >
            <option value="All">All Payment Methods</option>
            {ALLOWED_PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1 rounded hover:bg-rose-50 transition"
          >
            <X className="w-3 h-3" />
            <span>Reset filters</span>
          </button>
        )}

        <div className="ml-auto text-slate-400 text-xs font-normal">
          {totalResults} {totalResults === 1 ? 'transaction' : 'transactions'}
        </div>
      </div>
    </div>
  );
}
