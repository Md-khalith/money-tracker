import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Scale } from 'lucide-react';
import { formatINR } from '../utils/currency';

export default function SummaryCards({ totalReceived = 0, totalSpent = 0, balance = 0, loading = false }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Total Received Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-xs transition hover:border-slate-300">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs sm:text-sm font-medium">Total Received</span>
          <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-600">
          {loading ? (
            <div className="h-7 w-28 bg-slate-100 animate-pulse rounded"></div>
          ) : (
            formatINR(totalReceived)
          )}
        </div>
        <p className="text-[11px] sm:text-xs text-slate-400 mt-1 font-normal">
          Income during period
        </p>
      </div>

      {/* Total Spent Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-xs transition hover:border-slate-300">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs sm:text-sm font-medium">Total Spent</span>
          <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold tracking-tight text-rose-600">
          {loading ? (
            <div className="h-7 w-28 bg-slate-100 animate-pulse rounded"></div>
          ) : (
            formatINR(totalSpent)
          )}
        </div>
        <p className="text-[11px] sm:text-xs text-slate-400 mt-1 font-normal">
          Expenses during period
        </p>
      </div>

      {/* Balance Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-xs transition hover:border-slate-300">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs sm:text-sm font-medium">Balance</span>
          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
            <Scale className="w-4 h-4" />
          </div>
        </div>
        <div className={`text-xl sm:text-2xl font-bold tracking-tight ${
          balance < 0 ? 'text-rose-600' : 'text-slate-900'
        }`}>
          {loading ? (
            <div className="h-7 w-28 bg-slate-100 animate-pulse rounded"></div>
          ) : (
            formatINR(balance)
          )}
        </div>
        <p className="text-[11px] sm:text-xs text-slate-400 mt-1 font-normal">
          {balance < 0 ? 'Deficit for period' : 'Net remaining for period'}
        </p>
      </div>
    </div>
  );
}
