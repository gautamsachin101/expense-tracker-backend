import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  Calendar, 
  Download, 
  DollarSign, 
  ArrowUpRight,
  FileSpreadsheet
} from 'lucide-react';

// Import Recharts components
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CATEGORIES = [
  'Housing', 'Food', 'Transportation', 'Utilities', 
  'Insurance', 'Health', 'Entertainment', 'Other'
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

// --- Helper Function for Colors ---
const getCategoryColor = (category) => {
  const colorMap = {
    'Food': 'bg-orange-100 text-orange-800',
    'Housing': 'bg-blue-100 text-blue-800',
    'Transportation': 'bg-yellow-100 text-yellow-800',
    'Utilities': 'bg-purple-100 text-purple-800',
    'Insurance': 'bg-green-100 text-green-800',
    'Health': 'bg-red-100 text-red-800',
    'Entertainment': 'bg-pink-100 text-pink-800',
  };
  return colorMap[category] || 'bg-slate-100 text-slate-800';
};

// --- Components ---
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}>
    {children}
  </div>
);

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

// --- API URL ---
const API_URL = 'https://expense-tracker-backend-7vov.onrender.com/expenses';

export default function App() {
  // State
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Food',
    description: '',
    amount: ''
  });

  // Fetch expenses
  const fetchExpenses = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setExpenses(data);
    } catch(err) { 
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchExpenses(); 
  }, []);

  // Handlers
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return;

    const newExpense = {
      date: formData.date,
      category: formData.category,
      description: formData.description,
      amount: parseFloat(formData.amount)
    };

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExpense)
      });
      const data = await res.json();
      setExpenses([data, ...expenses]);
      setFormData({ ...formData, description: '', amount: '' });
    } catch(err) { 
      console.error('Error adding expense:', err);
      alert('Failed to add expense. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      setExpenses(expenses.filter(e => e._id !== id));
    } catch(err) { 
      console.error('Error deleting expense:', err);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Category', 'Description', 'Amount'];
    const csvContent = [
      headers.join(','),
      ...expenses.map(e => `${e.date},${e.category},"${e.description}",${e.amount}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'expenses.csv';
    link.click();
  };

  // Calculations
  const stats = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    
    const byCategory = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});

    const chartData = Object.entries(byCategory)
      .map(([name, value]) => ({ name, value }));

    const byMonth = expenses.reduce((acc, e) => {
      const month = e.date.substring(0, 7); 
      acc[month] = (acc[month] || 0) + e.amount;
      return acc;
    }, {});

    let topCat = 'None';
    let topCatAmount = 0;
    Object.entries(byCategory).forEach(([cat, amount]) => {
      if (amount > topCatAmount) {
        topCatAmount = amount;
        topCat = cat;
      }
    });

    return { total, byCategory, chartData, byMonth, topCat, topCatAmount };
  }, [expenses]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading expenses...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
              Expense Tracker
            </h1>
            <p className="text-slate-500 mt-1">Manage your budget and export to Sheets anytime</p>
          </div>
          <button 
            onClick={handleExportCSV}
            disabled={expenses.length === 0}
            className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-4 py-2 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 border-l-4 border-l-emerald-500">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total Spent</p>
                <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(stats.total)}</h3>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-l-blue-500">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Top Category</p>
                <h3 className="text-2xl font-bold text-slate-900">{stats.topCat}</h3>
                <p className="text-xs text-slate-400">{formatCurrency(stats.topCatAmount)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-l-violet-500">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-violet-100 rounded-full text-violet-600">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">This Month</p>
                <h3 className="text-2xl font-bold text-slate-900">
                  {formatCurrency(stats.byMonth[new Date().toISOString().substring(0, 7)] || 0)}
                </h3>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Input Form & Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Add Expense Form */}
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                Add Expense
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Date</label>
                  <input 
                    type="date" 
                    required
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full rounded-lg border-slate-300 border p-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400">₹</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      required
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={e => setFormData({...formData, amount: e.target.value})}
                      className="w-full rounded-lg border-slate-300 border p-2.5 pl-7 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Category</label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full rounded-lg border-slate-300 border p-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Description</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Weekly Groceries"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full rounded-lg border-slate-300 border p-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Transaction
                </button>
              </form>
            </Card>

            {/* Pie Chart Section */}
            <Card className="p-6 h-[400px] flex flex-col">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-blue-600" />
                Breakdown
              </h2>
              <div className="flex-1 w-full min-h-0">
                {expenses.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <PieChartIcon className="w-12 h-12 mb-2 opacity-20" />
                    <p className="text-sm italic">Add expenses to see the chart</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column: Transaction List */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Monthly Stats */}
            <Card className="p-6">
               <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-violet-600" />
                Monthly History
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.entries(stats.byMonth)
                 .sort(([a], [b]) => b.localeCompare(a)) 
                 .slice(0, 4) 
                 .map(([month, total]) => (
                   <div key={month} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                     <div className="text-xs text-slate-500 uppercase font-semibold">{month}</div>
                     <div className="text-lg font-bold text-slate-800">{formatCurrency(total)}</div>
                   </div>
                 ))}
                 {expenses.length === 0 && (
                  <div className="col-span-full text-slate-400 text-sm text-center">Add expenses to see monthly stats</div>
                 )}
              </div>
            </Card>

            {/* Transactions Table */}
            <Card className="overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <ArrowUpRight className="w-5 h-5 text-slate-600" />
                  Recent Transactions
                </h2>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{expenses.length} entries</span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-xs">
                    <tr>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3">Description</th>
                      <th className="px-6 py-3 text-right">Amount</th>
                      <th className="px-6 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expenses.map((expense) => (
                      <tr key={expense._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{expense.date ? expense.date.substring(0,10) : ''}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(expense.category)}`}>
                            {expense.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate" title={expense.description}>{expense.description}</td>
                        <td className="px-6 py-4 text-right font-medium text-slate-900">{formatCurrency(expense.amount)}</td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => handleDelete(expense._id)}
                            className="text-slate-400 hover:text-red-600 transition-colors p-1"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {expenses.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                          <p>No transactions found.</p>
                          <p className="text-xs mt-1">Fill out the form to add your first expense.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
