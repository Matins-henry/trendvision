'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentStaff, authenticatedFetch } from '@hotel/auth';
import { Navigation } from '@/components/Navigation';

interface Expense {
  id: string;
  description: string;
  category: string;
  amount: string;
  date: string;
  notes: string | null;
  createdAt: string;
  loggedBy: {
    id: string;
    name: string;
  };
}

interface CategorySummary {
  category: string;
  total: number;
  percentage: number;
}

const CATEGORIES = ['Utilities', 'Supplies', 'Maintenance', 'Payroll', 'Marketing', 'Insurance', 'Other'];

// Expense Form Modal Component
function ExpenseFormModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Utilities');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validateAmount = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) return false;
    const decimals = value.split('.')[1];
    if (decimals && decimals.length > 2) return false;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateAmount(amount)) {
      setError('Amount must be positive with max 2 decimal places');
      return;
    }

    setSubmitting(true);
    try {
      const response = await authenticatedFetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          category,
          amount: parseFloat(amount),
          date,
          notes: notes || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create expense');
      }

      onSuccess();
      onClose();
      // Reset form
      setDescription('');
      setCategory('Utilities');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Log Expense</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-700"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
            <input
              type="number"
              required
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onBlur={(e) => {
                if (!validateAmount(e.target.value) && e.target.value) {
                  setError('Amount must be positive with max 2 decimal places');
                } else {
                  setError('');
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
          </div>
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-teal-700 text-white rounded-md hover:bg-teal-800 transition-colors disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Log Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Manager Expenses View Component
function ManagerExpensesView() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const categoryParam = selectedCategory !== 'All' ? `?category=${selectedCategory}` : '';
      const response = await authenticatedFetch(`/api/expenses${categoryParam}`);
      const data = await response.json();
      setExpenses(data.expenses);
      setTotal(parseFloat(data.total));
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [selectedCategory]);

  const handleSuccess = () => {
    loadExpenses();
  };

  return (
    <>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600 mt-1">Track and manage hotel expenses</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-teal-700 text-white rounded-md hover:bg-teal-800 transition-colors flex items-center gap-2"
        >
          <span>+</span>
          Log Expense
        </button>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-700"
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <div className="text-lg font-semibold text-gray-900">
          Total: ${total.toFixed(2)}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-600">Loading expenses...</div>
      ) : expenses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses logged</h3>
          <p className="text-gray-600">Start tracking expenses by logging your first entry</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logged By</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(expense.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>{expense.description}</div>
                    {expense.notes && (
                      <div className="text-xs text-gray-500 mt-1">{expense.notes}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-teal-100 text-teal-800">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${parseFloat(expense.amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {expense.loggedBy.name}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ExpenseFormModal isOpen={showModal} onClose={() => setShowModal(false)} onSuccess={handleSuccess} />
    </>
  );
}

// Owner Expense Summary View Component
function OwnerExpenseSummaryView() {
  const [overallTotal, setOverallTotal] = useState(0);
  const [categorySummaries, setCategorySummaries] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSummary() {
      setLoading(true);
      try {
        const response = await authenticatedFetch('/api/expenses');
        
        if (!response.ok) {
          throw new Error('Failed to fetch expenses');
        }
        
        const data = await response.json();
        
        // Validate data structure
        if (!data.expenses || !Array.isArray(data.expenses)) {
          throw new Error('Invalid response format');
        }
        
        const totalAmount = parseFloat(data.total);
        setOverallTotal(totalAmount);

        // Calculate category summaries
        const categoryTotals: { [key: string]: number } = {};
        data.expenses.forEach((expense: Expense) => {
          categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + parseFloat(expense.amount);
        });

        const summaries: CategorySummary[] = Object.entries(categoryTotals)
          .map(([category, total]) => ({
            category,
            total,
            percentage: totalAmount > 0 ? (total / totalAmount) * 100 : 0,
          }))
          .sort((a, b) => b.total - a.total);

        setCategorySummaries(summaries);
      } catch (err) {
        console.error('Failed to load expense summary:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSummary();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Loading expense summary...</div>;
  }

  if (overallTotal === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <div className="text-4xl mb-4">💰</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses logged yet</h3>
        <p className="text-gray-600">Expense data will appear here once your team starts logging expenses</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Expense Summary</h1>
        <p className="text-gray-600 mt-1">Overview of hotel expenses</p>
      </div>

      <div className="mb-6 bg-gradient-to-br from-teal-700 to-teal-800 rounded-lg shadow-lg p-6 text-white">
        <div className="text-sm font-medium opacity-90 mb-1">Total Expenses</div>
        <div className="text-4xl font-bold">${overallTotal.toFixed(2)}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categorySummaries.map((summary) => (
          <div key={summary.category} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-gray-900">{summary.category}</h3>
              <span className="text-xs text-gray-500">{summary.percentage.toFixed(1)}%</span>
            </div>
            <div className="text-2xl font-bold text-teal-700">${summary.total.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </>
  );
}

// Main Expenses Page Component
export default function ExpensesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<any>(null);

  useEffect(() => {
    async function checkAccess() {
      try {
        const currentStaff = await getCurrentStaff();
        
        if (!currentStaff) {
          router.push('/login');
          return;
        }

        if (currentStaff.role !== 'MANAGER' && currentStaff.role !== 'OWNER') {
          router.push('/access-denied');
          return;
        }

        setStaff(currentStaff);
      } catch (err) {
        console.error('Access check error:', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }

    checkAccess();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {staff?.role === 'MANAGER' ? (
          <ManagerExpensesView />
        ) : (
          <OwnerExpenseSummaryView />
        )}
      </div>
    </div>
  );
}
