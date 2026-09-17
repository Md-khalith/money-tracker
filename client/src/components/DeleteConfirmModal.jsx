import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { formatINR } from '../utils/currency';

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  transaction = null,
  loading = false
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-150 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-base font-semibold text-slate-800">
          Delete Transaction?
        </h3>

        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 mb-2">
          Are you sure you want to delete this transaction? This action cannot be undone.
        </p>

        {transaction && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 my-3 text-xs text-slate-600 text-left">
            <div className="flex justify-between font-medium">
              <span>{transaction.description || transaction.categoryName}</span>
              <span className={transaction.type === 'RECEIVED' ? 'text-emerald-600' : 'text-rose-600'}>
                {formatINR(transaction.amount, { showSign: true, type: transaction.type })}
              </span>
            </div>
            <div className="text-slate-400 mt-0.5 text-[11px]">
              {transaction.categoryName} · {transaction.transactionDate}
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-1/2 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="w-1/2 py-2 text-xs sm:text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg transition shadow-xs"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
