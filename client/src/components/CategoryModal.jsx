import React, { useState } from 'react';
import { X, Plus, Pencil, Trash2, Check } from 'lucide-react';
import { COMMON_CATEGORY_ICONS } from '../constants';

export default function CategoryModal({
  isOpen,
  onClose,
  categories = [],
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('🏷️');

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleStartEdit = (cat) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditIcon(cat.icon || '🏷️');
    setIsCreating(false);
    setErrorMessage('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditIcon('');
    setErrorMessage('');
  };

  const handleSaveEdit = async (id) => {
    if (!editName.trim()) {
      setErrorMessage('Category name cannot be empty');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      await onUpdateCategory(id, {
        name: editName.trim(),
        icon: editIcon || null
      });
      setEditingId(null);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update category');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      setErrorMessage('Category name cannot be empty');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      await onCreateCategory({
        name: newCategoryName.trim(),
        icon: newCategoryIcon || null
      });
      setNewCategoryName('');
      setNewCategoryIcon('🏷️');
      setIsCreating(false);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cat) => {
    setErrorMessage('');
    setLoading(true);
    try {
      await onDeleteCategory(cat.id);
    } catch (err) {
      setErrorMessage(err.message || 'Cannot delete category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base sm:text-lg font-semibold text-slate-800">
            Categories
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
            {errorMessage}
          </div>
        )}

        {/* Category List */}
        <div className="p-6 overflow-y-auto flex-1 divide-y divide-slate-100">
          {categories.map((cat) => {
            const isEditing = editingId === cat.id;

            if (isEditing) {
              return (
                <div key={cat.id} className="py-2.5 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editIcon}
                      onChange={(e) => setEditIcon(e.target.value)}
                      placeholder="Icon"
                      className="w-12 text-center text-sm py-1.5 border border-slate-200 rounded-lg"
                    />
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 text-sm px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      onClick={() => handleSaveEdit(cat.id)}
                      disabled={loading}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md"
                      title="Save"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-md"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Quick Icon Selector */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {COMMON_CATEGORY_ICONS.slice(0, 10).map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setEditIcon(emoji)}
                        className="text-xs p-1 hover:bg-slate-100 rounded"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={cat.id}
                className="py-2.5 flex items-center justify-between group hover:bg-slate-50/50 px-2 -mx-2 rounded-lg transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg w-7 text-center">{cat.icon || '🏷️'}</span>
                  <div>
                    <span className="text-sm font-medium text-slate-800">{cat.name}</span>
                    {cat.transactionCount > 0 && (
                      <span className="ml-2 text-[11px] text-slate-400">
                        ({cat.transactionCount})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                  <button
                    onClick={() => handleStartEdit(cat)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition"
                    title="Rename / change icon"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                    title="Delete category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer / Create Category Form */}
        <div className="border-t border-slate-100 p-4 bg-slate-50/50">
          {isCreating ? (
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Icon"
                  value={newCategoryIcon}
                  onChange={(e) => setNewCategoryIcon(e.target.value)}
                  className="w-12 text-center text-sm py-1.5 bg-white border border-slate-200 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Category Name (e.g. Groceries)"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  autoFocus
                  className="flex-1 text-sm px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Quick Emojis */}
              <div className="flex flex-wrap gap-1">
                {COMMON_CATEGORY_ICONS.slice(0, 10).map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewCategoryIcon(emoji)}
                    className="text-xs p-1 hover:bg-slate-200 rounded"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setErrorMessage('');
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-md shadow-xs"
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => {
                setIsCreating(true);
                setEditingId(null);
                setErrorMessage('');
              }}
              className="w-full py-2 flex items-center justify-center gap-2 text-xs sm:text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Category</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
