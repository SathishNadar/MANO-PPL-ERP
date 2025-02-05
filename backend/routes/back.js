import express from "express";
import fs from "fs";

const router = express.Router();
const dataFilePath = "./backend/data/data.json"; 
function readUserData() {
  try {
    if (!fs.existsSync(dataFilePath)) {
      fs.writeFileSync(dataFilePath, JSON.stringify([], null, 2));
    }
    const data = fs.readFileSync(dataFilePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading user data:", err);
    return [];
  }
}

function writeUserData(users) {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error("Error writing user data:", err);
  }
}

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  const users = readUserData();
  const user = users.find((user) => user.username === username && user.password === password);

  if (user) {
    res.status(200).json({ message: "Login successful", user });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
});

router.post("/signup", (req, res) => {
  const { username, password, confirmPassword, email, phno } = req.body;

  if (!username || !password || !confirmPassword || !email || !phno) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match." });
  }

  const users = readUserData();
  const existingUser = users.find((user) => user.username === username);

  if (existingUser) {
    return res.status(400).json({ message: "Username already exists." });
  }

  const newUser = { username, password, email, phno };
  users.push(newUser);

  writeUserData(users);

  res.status(201).json({ message: "Signup successful. Login to continue." });
});

// Export the router for use in server.js
export default router;
