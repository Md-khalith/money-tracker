import React, { useState, useEffect } from 'react';
import { X, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { ALLOWED_PAYMENT_METHODS } from '../constants';
import { toISODateString } from '../utils/date';

export default function TransactionModal({
  isOpen,
  onClose,
  onSubmit,
  transaction = null,
  categories = []
}) {
  const isEditing = Boolean(transaction);

  const [type, setType] = useState('SPENT');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [transactionDate, setTransactionDate] = useState(toISODateString(new Date()));
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(String(transaction.amount));
      setCategoryId(String(transaction.categoryId));
      setPaymentMethod(transaction.paymentMethod);
      setTransactionDate(transaction.transactionDate);
      setDescription(transaction.description || '');
    } else {
      setType('SPENT');
      setAmount('');
      setCategoryId(categories.length > 0 ? String(categories[0].id) : '');
      setPaymentMethod('UPI');
      setTransactionDate(toISODateString(new Date()));
      setDescription('');
    }
    setErrors({});
  }, [transaction, isOpen, categories]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      errs.amount = 'Please enter a valid positive amount';
    }
    if (!categoryId) {
      errs.categoryId = 'Please select a category';
    }
    if (!paymentMethod) {
      errs.paymentMethod = 'Please select a payment method';
    }
    if (!transactionDate) {
      errs.transactionDate = 'Please select a date';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        amount: parseFloat(amount),
        type,
        categoryId: parseInt(categoryId, 10),
        paymentMethod,
        transactionDate,
        description: description.trim()
      });
      onClose();
    } catch (err) {
      setErrors({ form: err.message || 'Failed to save transaction' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base sm:text-lg font-semibold text-slate-800">
            {isEditing ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.form && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {errors.form}
            </div>
          )}

          {/* Type Toggle */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Type
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setType('SPENT')}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                  type === 'SPENT'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-rose-600" />
                <span>Spent</span>
              </button>
              <button
                type="button"
                onClick={() => setType('RECEIVED')}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                  type === 'RECEIVED'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                <span>Received</span>
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-semibold text-slate-400">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                className={`w-full text-base sm:text-lg font-semibold pl-8 pr-4 py-2 bg-white border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition ${
                  errors.amount ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                }`}
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-rose-600 mt-1">{errors.amount}</p>
            )}
          </div>

          {/* Category & Payment Method Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Category Select */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={`w-full text-xs sm:text-sm px-3 py-2 bg-white border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                  errors.categoryId ? 'border-rose-300' : 'border-slate-200'
                }`}
              >
                <option value="" disabled>Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="text-xs text-rose-600 mt-1">{errors.categoryId}</p>
              )}
            </div>

            {/* Payment Method Select */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className={`w-full text-xs sm:text-sm px-3 py-2 bg-white border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                  errors.paymentMethod ? 'border-rose-300' : 'border-slate-200'
                }`}
              >
                {ALLOWED_PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className={`w-full text-xs sm:text-sm px-3 py-2 bg-white border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                errors.transactionDate ? 'border-rose-300' : 'border-slate-200'
              }`}
            />
            {errors.transactionDate && (
              <p className="text-xs text-rose-600 mt-1">{errors.transactionDate}</p>
            )}
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Description <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Grocery store, Grocery items, Freelance project"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs sm:text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition shadow-xs"
            >
              {submitting ? 'Saving...' : isEditing ? 'Update Transaction' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
