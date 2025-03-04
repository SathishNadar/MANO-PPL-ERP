import express from "express";
import cors from "cors";
import loginRoutes from "./routes/back.js"; // Handles authentication
// import reportRoutes from "./routes/report.js"; 
import vendorRoutes from "./routes/vendor.js"; 

const app = express();
const port = 3000;

app.use(cors()); 
app.use(express.json()); 

// Routes
app.use("/auth", loginRoutes); 
// app.use("/report", reportRoutes); 
app.use("/vendor", vendorRoutes); 

app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on http://localhost:${port}`);
});
