import React, { useState, useEffect } from "react";

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  // Fetch expenses from backend
  const fetchExpenses = async () => {
    try {
      const response = await fetch("http://localhost:5000/expenses");
      if (!response.ok) throw new Error("Failed to fetch expenses");
      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Add new expense
  const addExpense = async (e) => {
    e.preventDefault();
    const newExpense = { name, amount: parseFloat(amount) };

    try {
      const response = await fetch("http://localhost:5000/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newExpense),
      });

      if (!response.ok) throw new Error("Failed to add expense");

      const data = await response.json();
      setExpenses([...expenses, data]); // update local state
      setName("");
      setAmount("");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "auto" }}>
      <h2>Expenses</h2>

      <form onSubmit={addExpense} style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Expense name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ marginRight: "10px" }}
        />
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          style={{ marginRight: "10px" }}
        />
        <button type="submit">Add Expense</button>
      </form>

      <ul>
        {expenses.map((exp, index) => (
          <li key={index}>
            {exp.name}: ${exp.amount}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Expenses;
