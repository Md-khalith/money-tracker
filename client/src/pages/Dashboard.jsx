import React, { useState, useEffect, useCallback } from 'react';
import { Download, Plus } from 'lucide-react';
import { api } from '../services/api';
import { getDateRangePreset } from '../utils/date';
import { useToast } from '../components/Toast';

import Header from '../components/Header';
import SummaryCards from '../components/SummaryCards';
import SpendingOverview from '../components/SpendingOverview';
import RecentTransactions from '../components/RecentTransactions';
import Filters from '../components/Filters';
import TransactionTable from '../components/TransactionTable';
import TransactionModal from '../components/TransactionModal';
import CategoryModal from '../components/CategoryModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import ExportModal from '../components/ExportModal';

export default function Dashboard() {
  const { addToast } = useToast();

  // Date Range State (default to This Month)
  const [activeRange, setActiveRange] = useState(() => getDateRangePreset('this_month'));

  // Dashboard Aggregates
  const [dashboardData, setDashboardData] = useState({
    totalReceived: 0,
    totalSpent: 0,
    balance: 0,
    spendingByCategory: [],
    recentTransactions: []
  });
  const [dashboardLoading, setDashboardLoading] = useState(true);

  // Transactions State
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);

  // Categories State
  const [categories, setCategories] = useState([]);

  // Filters State
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');

  // Modal States
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [exportModalOpen, setExportModalOpen] = useState(false);

  // 1. Load Categories
  const loadCategories = useCallback(async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }, []);

  // 2. Load Dashboard Aggregate Data
  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true);
    try {
      const data = await api.getDashboard({
        startDate: activeRange.startDate,
        endDate: activeRange.endDate
      });
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      addToast('Failed to load dashboard data', 'error');
    } finally {
      setDashboardLoading(false);
    }
  }, [activeRange.startDate, activeRange.endDate, addToast]);

  // 3. Load Transactions List with Filters
  const loadTransactions = useCallback(async () => {
    setTransactionsLoading(true);
    try {
      const data = await api.getTransactions({
        startDate: activeRange.startDate,
        endDate: activeRange.endDate,
        type: typeFilter !== 'All' ? typeFilter : undefined,
        categoryId: categoryFilter !== 'All' ? categoryFilter : undefined,
        paymentMethod: paymentFilter !== 'All' ? paymentFilter : undefined,
        search: search.trim() || undefined
      });
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error('Failed to load transactions:', err);
      addToast('Failed to load transactions', 'error');
    } finally {
      setTransactionsLoading(false);
    }
  }, [
    activeRange.startDate,
    activeRange.endDate,
    typeFilter,
    categoryFilter,
    paymentFilter,
    search,
    addToast
  ]);

  // Initial Load
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Reload data when active date range changes
  useEffect(() => {
    loadDashboard();
    loadTransactions();
  }, [loadDashboard, loadTransactions]);

  // Handlers for Transaction CRUD
  const handleOpenAddTransaction = () => {
    setEditingTransaction(null);
    setTransactionModalOpen(true);
  };

  const handleOpenEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setTransactionModalOpen(true);
  };

  const handleSaveTransaction = async (formData) => {
    if (editingTransaction) {
      await api.updateTransaction(editingTransaction.id, formData);
      addToast('Transaction updated');
    } else {
      await api.createTransaction(formData);
      addToast('Transaction added');
    }
    // Refresh both dashboard summary and transaction list
    loadDashboard();
    loadTransactions();
    loadCategories();
  };

  const handleOpenDelete = (transaction) => {
    setTransactionToDelete(transaction);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return;
    setDeleteLoading(true);
    try {
      await api.deleteTransaction(transactionToDelete.id);
      addToast('Transaction deleted');
      setDeleteModalOpen(false);
      setTransactionToDelete(null);
      loadDashboard();
      loadTransactions();
      loadCategories();
    } catch (err) {
      addToast(err.message || 'Failed to delete transaction', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handlers for Categories
  const handleCreateCategory = async (catData) => {
    await api.createCategory(catData);
    addToast('Category created');
    loadCategories();
  };

  const handleUpdateCategory = async (id, catData) => {
    await api.updateCategory(id, catData);
    addToast('Category updated');
    loadCategories();
    loadDashboard();
    loadTransactions();
  };

  const handleDeleteCategory = async (id) => {
    await api.deleteCategory(id);
    addToast('Category deleted');
    loadCategories();
  };

  // Handlers for Export
  const handleExportCSV = async (range) => {
    const filename = await api.downloadCSV({
      startDate: range.startDate,
      endDate: range.endDate,
      type: typeFilter !== 'All' ? typeFilter : undefined,
      categoryId: categoryFilter !== 'All' ? categoryFilter : undefined,
      paymentMethod: paymentFilter !== 'All' ? paymentFilter : undefined,
      search: search.trim() || undefined
    });
    addToast(`Exported ${filename}`);
  };

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('All');
    setCategoryFilter('All');
    setPaymentFilter('All');
  };

  const isFiltered = Boolean(search || typeFilter !== 'All' || categoryFilter !== 'All' || paymentFilter !== 'All');

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      {/* Header with quick actions & date range */}
      <Header
        activeRange={activeRange}
        onSelectRange={setActiveRange}
        onOpenCategories={() => setCategoryModalOpen(true)}
        onOpenAddTransaction={handleOpenAddTransaction}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Section 1: Summary Cards */}
        <section aria-label="Financial Summary">
          <SummaryCards
            totalReceived={dashboardData.totalReceived}
            totalSpent={dashboardData.totalSpent}
            balance={dashboardData.balance}
            loading={dashboardLoading}
          />
        </section>

        {/* Section 2: Spending by Category & Recent Activity */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6" aria-label="Overview and Activity">
          <SpendingOverview
            spendingByCategory={dashboardData.spendingByCategory}
            totalSpent={dashboardData.totalSpent}
            loading={dashboardLoading}
          />

          <RecentTransactions
            transactions={dashboardData.recentTransactions}
            onSelectTransaction={handleOpenEditTransaction}
            loading={dashboardLoading}
          />
        </section>

        {/* Section 3: All Transactions Section */}
        <section className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5" aria-label="Transactions History">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                Transactions
              </h2>
              <p className="text-xs text-slate-400">
                Detailed transaction records for {activeRange.label}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setExportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition shadow-2xs"
                title="Export transactions as CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={handleOpenAddTransaction}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-xs sm:hidden"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <Filters
            search={search}
            onSearchChange={setSearch}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            paymentFilter={paymentFilter}
            onPaymentFilterChange={setPaymentFilter}
            categories={categories}
            onResetFilters={handleResetFilters}
            totalResults={transactions.length}
          />

          {/* Transactions Table & Mobile Cards */}
          <TransactionTable
            transactions={transactions}
            loading={transactionsLoading}
            isFiltered={isFiltered}
            onEditTransaction={handleOpenEditTransaction}
            onDeleteTransaction={handleOpenDelete}
            onAddTransaction={handleOpenAddTransaction}
            onResetFilters={handleResetFilters}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div>
            Money Tracker — Self-hosted personal finance dashboard
          </div>
          <div>
            Data stored locally in SQLite
          </div>
        </div>
      </footer>

      {/* Modals */}
      <TransactionModal
        isOpen={transactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
        onSubmit={handleSaveTransaction}
        transaction={editingTransaction}
        categories={categories}
      />

      <CategoryModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        categories={categories}
        onCreateCategory={handleCreateCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setTransactionToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        transaction={transactionToDelete}
        loading={deleteLoading}
      />

      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onExport={handleExportCSV}
        defaultStartDate={activeRange.startDate}
        defaultEndDate={activeRange.endDate}
      />
    </div>
  );
}
