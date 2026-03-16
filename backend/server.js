const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: "OK" });
});

// Example user insert route
app.post('/users', (req, res) => {
  const { name, email } = req.body;
  // Here you would insert into PostgreSQL
  res.json({ message: "User created successfully" });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});