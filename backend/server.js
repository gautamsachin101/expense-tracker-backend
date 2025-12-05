const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

// --- ⚠️ PASTE YOUR CONNECTION STRING HERE ⚠️ ---
// Replace <db_password> with your actual password!
const MONGO_URI = "mongodb+srv://attrixrishi:123password@cluster0.uq9tcbc.mongodb.net/?appName=Cluster0";

// Middleware
app.use(cors());
app.use(express.json());

// --- DATABASE CONNECTION ---
// This connects your app to the cloud
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected!'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- DATA MODEL ---
// This defines what an expense looks like in the database
const expenseSchema = new mongoose.Schema({
  date: String,
  category: String,
  description: String,
  amount: Number
});

const Expense = mongoose.model('Expense', expenseSchema);

// --- ROUTES ---

// 1. GET all expenses
app.get('/expenses', async (req, res) => {
  try {
    const expenses = await Expense.find();
    // Transform _id to id for the frontend
    const formatted = expenses.map(e => ({
      id: e._id,
      date: e.date,
      category: e.category,
      description: e.description,
      amount: e.amount
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. ADD a new expense
app.post('/expenses', async (req, res) => {
  try {
    const newExpense = new Expense({
      date: req.body.date,
      category: req.body.category,
      description: req.body.description,
      amount: req.body.amount
    });
    const savedExpense = await newExpense.save();
    
    // Return the saved object
    res.json({
      id: savedExpense._id,
      date: savedExpense.date,
      category: savedExpense.category,
      description: savedExpense.description,
      amount: savedExpense.amount
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. DELETE an expense
app.delete('/expenses/:id', async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);

});
