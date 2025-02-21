import express from "express";

const router = express.Router();

// Route to handle login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user_data = await DB.fetchUserByName(username)

  if (!user_data) {
    return res.status(404).json({ message: "Username not found" });
  }
  
  const isMatch = await bcrypt.compare(password, user_data.user_password)

  bcrypt.compare(password, user_data.user_password, (err, isMatch) => {
    if (err) {
      console.error("Error comparing passwords:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    res.status(200).json({ message: "Login successful", user: user_data });
  });
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

export default router;
