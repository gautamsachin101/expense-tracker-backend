// backend/index.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;
const DATA_FILE = path.join(__dirname, 'expenses.json');
const BUDGET_FILE = path.join(__dirname, 'budgets.json');

// Middleware
app.use(cors());
app.use(express.json());

// Initialize files if they don't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}
if (!fs.existsSync(BUDGET_FILE)) {
  fs.writeFileSync(BUDGET_FILE, JSON.stringify({}));
}

// Helper function to read expenses
const readExpenses = () => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading expenses:', error);
    return [];
  }
};

// Helper function to write expenses
const writeExpenses = (expenses) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(expenses, null, 2));
  } catch (error) {
    console.error('Error writing expenses:', error);
  }
};

// Helper function to read budgets
const readBudgets = () => {
  try {
    const data = fs.readFileSync(BUDGET_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading budgets:', error);
    return {};
  }
};

// Helper function to write budgets
const writeBudgets = (budgets) => {
  try {
    fs.writeFileSync(BUDGET_FILE, JSON.stringify(budgets, null, 2));
  } catch (error) {
    console.error('Error writing budgets:', error);
  }
};

// GET all expenses
app.get('/expenses', (req, res) => {
  const expenses = readExpenses();
  res.json(expenses);
});

// POST new expense
app.post('/expenses', (req, res) => {
  const expenses = readExpenses();
  const newExpense = {
    id: Date.now().toString(),
    ...req.body,
    amount: parseFloat(req.body.amount)
  };
  expenses.unshift(newExpense);
  writeExpenses(expenses);
  res.status(201).json(newExpense);
});

// PUT update expense
app.put('/expenses/:id', (req, res) => {
  const expenses = readExpenses();
  const index = expenses.findIndex(e => e.id === req.params.id);
  
  if (index !== -1) {
    expenses[index] = {
      ...expenses[index],
      ...req.body,
      amount: parseFloat(req.body.amount)
    };
    writeExpenses(expenses);
    res.json(expenses[index]);
  } else {
    res.status(404).json({ error: 'Expense not found' });
  }
});

// DELETE expense
app.delete('/expenses/:id', (req, res) => {
  const expenses = readExpenses();
  const filteredExpenses = expenses.filter(e => e.id !== req.params.id);
  writeExpenses(filteredExpenses);
  res.status(204).send();
});

// GET all budgets
app.get('/budgets', (req, res) => {
  const budgets = readBudgets();
  res.json(budgets);
});

// POST/PUT budget for a category
app.post('/budgets', (req, res) => {
  const budgets = readBudgets();
  const { category, amount } = req.body;
  budgets[category] = parseFloat(amount);
  writeBudgets(budgets);
  res.json(budgets);
});

// DELETE budget for a category
app.delete('/budgets/:category', (req, res) => {
  const budgets = readBudgets();
  delete budgets[req.params.category];
  writeBudgets(budgets);
  res.status(204).send();
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});