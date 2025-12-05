import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Calendar, Download, FileSpreadsheet, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CATEGORIES = ['Housing', 'Food', 'Transportation', 'Utilities', 'Insurance', 'Health', 'Entertainment', 'Other'];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

const getCategoryColor = (category) => {
  const map = {
    'Food': 'bg-orange-100 text-orange-800',
    'Housing': 'bg-blue-100 text-blue-800',
    'Transportation': 'bg-yellow-100 text-yellow-800',
    'Utilities': 'bg-purple-100 text-purple-800',
    'Insurance': 'bg-green-100 text-green-800',
    'Health': 'bg-red-100 text-red-800',
    'Entertainment': 'bg-pink-100 text-pink-800',
  };
  return map[category] || 'bg-slate-100 text-slate-800';
};

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}>{children}</div>
);

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

const API_URL = 'https://expense-tracker-backend-7vov.onrender.com/expenses';

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Food',
    description: '',
    amount: ''
  });

  const fetchExpenses = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setExpenses(data);
    } catch(err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchExpenses(); }, []);

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
    } catch(err) { alert('Failed to add expense'); }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      setExpenses(expenses.filter(e => e._id !== id));
    } catch(err) { console.error(err); }
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Category', 'Description', 'Amount'];
    const csvContent = [headers.join(','), ...expenses.map(e => `${e.date},${e.category},"${e.description}",${e.amount}`)].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'expenses.csv';
    link.click();
  };

  const stats = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const byCategory = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});
    const chartData = Object.entries(byCategory).map(([name, value]) => ({ name, value }));
    const byMonth = expenses.reduce((acc, e) => {
      const month = e.date ? e.date.substring(0, 7) : 'Unknown';
      acc[month] = (acc[month] || 0) + e.amount;
      return acc;
    }, {});
    let topCat = 'None';
    let topCatAmount = 0;
    Object.entries(byCategory).forEach(([cat, amount]) => {
      if (amount > topCatAmount) { topCatAmount = amount; topCat = cat; }
    });
    return { total, byCategory, chartData, byMonth, topCat, topCatAmount };
  }, [expenses]);

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-8 h-8 text-emerald-600" /> Expense Tracker
          </h1>
          <button onClick={handleExportCSV} disabled={expenses.length === 0} className="flex items-center gap-2 bg-white border px-4 py-2 rounded-lg text-sm">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 border-l-4 border-l-emerald-500">
            <div className="text-sm text-slate-500">Total Spent</div>
            <div className="text-2xl font-bold">{formatCurrency(stats.total)}</div>
          </Card>
          <Card className="p-6 border-l-4 border-l-blue-500">
            <div className="text-sm text-slate-500">Top Category</div>
            <div className="text-2xl font-bold">{stats.topCat}</div>
          </Card>
          <Card className="p-6 border-l-4 border-l-violet-500">
            <div className="text-sm text-slate-500">This Month</div>
            <div className="text-2xl font-bold">{formatCurrency(stats.byMonth[new Date().toISOString().substring(0, 7)] || 0)}</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus className="w-5 h-5" /> Add Expense</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full border p-2 rounded" />
                <input type="number" step="0.01" required placeholder="Amount" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full border p-2 rounded" />
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border p-2 rounded bg-white">
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <input type="text" required placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border p-2 rounded" />
                <button type="submit" className="w-full bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700">Add Transaction</button>
              </form>
            </Card>
            <Card className="p-6 h-[400px]">
              <h2 className="text-lg font-bold mb-4">Breakdown</h2>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {stats.chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <div className="p-6 border-b"><h2 className="text-lg font-bold">Recent Transactions</h2></div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-3">Date</th><th className="px-6 py-3">Category</th><th className="px-6 py-3">Description</th><th className="px-6 py-3 text-right">Amount</th><th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expenses.map((expense) => (
                      <tr key={expense._id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">{expense.date ? expense.date.substring(0,10) : ''}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(expense.category)}`}>{expense.category}</span>
                        </td>
                        <td className="px-6 py-4">{expense.description}</td>
                        <td className="px-6 py-4 text-right font-medium">{formatCurrency(expense.amount)}</td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => handleDelete(expense._id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
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
