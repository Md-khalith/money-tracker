import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, 
  ChevronDown, 
  Plus, 
  Tag, 
  Check, 
  WalletCards 
} from 'lucide-react';
import { getDateRangePreset } from '../utils/date';

const PRESET_OPTIONS = [
  { key: 'this_week', label: 'This Week' },
  { key: 'this_month', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'this_year', label: 'This Year' },
  { key: 'all_time', label: 'All Time' },
  { key: 'custom', label: 'Custom Range' }
];

export default function Header({
  activeRange,
  onSelectRange,
  onOpenCategories,
  onOpenAddTransaction
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(activeRange.key === 'custom');
  const [customStart, setCustomStart] = useState(activeRange.startDate || '');
  const [customEnd, setCustomEnd] = useState(activeRange.endDate || '');

  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPreset = (key) => {
    if (key === 'custom') {
      setIsCustomMode(true);
    } else {
      setIsCustomMode(false);
      const preset = getDateRangePreset(key);
      onSelectRange(preset);
      setDropdownOpen(false);
    }
  };

  const handleApplyCustom = (e) => {
    e.preventDefault();
    const preset = getDateRangePreset('custom', {
      startDate: customStart,
      endDate: customEnd
    });
    onSelectRange(preset);
    setDropdownOpen(false);
  };

  return (
    <header className="border-b border-slate-200/80 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo / App Name */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
            <WalletCards className="w-4 h-4" />
          </div>
          <span className="font-semibold text-lg sm:text-xl text-slate-800 tracking-tight">
            Money Tracker
          </span>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Date Range Selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
              title="Select period"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span className="truncate max-w-[120px] sm:max-w-[160px]">
                {activeRange.label}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2.5 py-1">
                  Select Period
                </div>

                <div className="space-y-0.5 mt-1">
                  {PRESET_OPTIONS.map((opt) => {
                    const isSelected = activeRange.key === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => handleSelectPreset(opt.key)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs sm:text-sm rounded-md transition text-left ${
                          isSelected
                            ? 'bg-slate-100 text-slate-900 font-medium'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Range Inputs */}
                {isCustomMode && (
                  <form onSubmit={handleApplyCustom} className="mt-3 pt-3 border-t border-slate-100 px-1 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Start Date</label>
                        <input
                          type="date"
                          value={customStart}
                          onChange={(e) => setCustomStart(e.target.value)}
                          className="w-full text-xs px-2 py-1 border border-slate-200 rounded focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-0.5">End Date</label>
                        <input
                          type="date"
                          value={customEnd}
                          onChange={(e) => setCustomEnd(e.target.value)}
                          className="w-full text-xs px-2 py-1 border border-slate-200 rounded focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded transition shadow-xs"
                    >
                      Apply Range
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Categories Button */}
          <button
            onClick={onOpenCategories}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors"
          >
            <Tag className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Categories</span>
          </button>

          {/* Add Transaction Button */}
          <button
            onClick={onOpenAddTransaction}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>
    </header>
  );
}
