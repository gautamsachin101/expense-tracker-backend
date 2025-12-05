const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Initialize App
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};
connectDB();

// --- SCHEMA FIX ---
// Updated to match what the Frontend sends (description, category, date)
const expenseSchema = new mongoose.Schema({
  description: String,  
  category: String,
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
    const expenses = await Expense.find().sort({ date: -1 }); // Sort by newest first
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/expenses', async (req, res) => {
  try {
    // Extract the correct fields from Frontend
    const { description, category, amount, date } = req.body;
    
    const newExpense = new Expense({ 
      description, 
      category, 
      amount, 
      date 
    });
    
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
