const express = require("express");
const cors = require("cors");
const fs = require("fs");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json()); // For parsing application/json

// Data file path
const dataFilePath = "data.json";

// Read data from JSON file
const readData = () => {
  try {
    const data = fs.readFileSync(dataFilePath);
    console.log(JSON.parse(data));
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading data file:", err);
    return [];
  }
};

// Save data to JSON file
const saveData = (data) => {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error saving data to file:", err);
  }
};

// Route to handle login
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const users = readData();
  const user = users.find(
    (user) => user.username === username && user.password === password
  );

  if (user) {
    res.status(200).json({ message: "Login successful", user });
  } else {
    res.status(401).json({ message: "not valid" });
  }
});

// Route to handle signup
app.post("/signup", (req, res) => {
  const { username, password, email, phno, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  const users = readData();
  const existingUser = users.find((user) => user.username === username);

  if (existingUser) {
    return res.status(400).json({ message: "Username already exists" });
  }

  const newUser = { username, password, email, phno };
  users.push(newUser);

  saveData(users);

  res.status(201).json({ message: "Signup successful", user: newUser });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
