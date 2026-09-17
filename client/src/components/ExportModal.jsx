import React, { useState, useEffect } from 'react';
import { X, Download, FileSpreadsheet } from 'lucide-react';
import { toISODateString } from '../utils/date';

export default function ExportModal({
  isOpen,
  onClose,
  onExport,
  defaultStartDate = '',
  defaultEndDate = ''
}) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      setStartDate(defaultStartDate || toISODateString(firstDay));
      setEndDate(defaultEndDate || toISODateString(lastDay));
      setError('');
    }
  }, [isOpen, defaultStartDate, defaultEndDate]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (startDate && endDate && startDate > endDate) {
      setError('Start date cannot be after end date');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onExport({ startDate, endDate });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to export CSV');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-semibold text-slate-800">
              Export Transactions
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-500">
            Choose the date range of transactions you want to export as a CSV spreadsheet.
          </p>

          {error && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>{loading ? 'Exporting...' : 'Export CSV'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
