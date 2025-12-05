const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Initialize App
const app = express();

// --- CRITICAL FIX START ---
// 1. Use the port Render gives us (process.env.PORT)
// 2. If no port is given (localhost), use 5000
const PORT = process.env.PORT || 5000;
// --- CRITICAL FIX END ---

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const connectDB = async () => {
  try {
    // Connect using the MONGO_URI from Render Environment Variables
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Connect to Database
connectDB();

// Schema & Model
const expenseSchema = new mongoose.Schema({
  title: String,
  amount: Number,
  date: { type: Date, default: Date.now }
});

const Expense = mongoose.model('Expense', expenseSchema);

// Routes
app.get('/', (req, res) => {
    res.send('API is running!');
});

app.get('/expenses', async (req, res) => {
  try {
    const expenses = await Expense.find();
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/expenses', async (req, res) => {
  try {
    const { title, amount } = req.body;
    const newExpense = new Expense({ title, amount });
    await newExpense.save();
    res.status(201).json(newExpense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/expenses/:id', async (req, res) => {
    try {
        await Expense.findByIdAndDelete(req.params.id);
        res.json({ message: 'Expense deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- CRITICAL FIX START ---
// Bind to 0.0.0.0 to ensure Render can detect the open port
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
// --- CRITICAL FIX END ---
