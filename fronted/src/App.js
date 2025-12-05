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

// --- API URL (Centralized to avoid mistakes) ---
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

  // Fetch expenses from backend
  const fetchExpenses = async () => {
    try {
      // FIX 1: Use the full API URL including '/expenses'
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
      // FIX 2: Replaced localhost with API_URL
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
      // FIX 2: Replaced localhost with API_URL
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      // FIX 3: Use _id instead of id for filtering
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
                    className="w-full rounded-lg border-slate-300 border p-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border
