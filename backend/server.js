import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
// import loginRoutes from "./routes/back.js"; // Handles authentication
// import reportRoutes from "./routes/report.js"; 
import vendorRoutes from "./routes/vendor.js"; 

const app = express();
const port = 3000;

app.use(cors()); 
app.use(bodyParser.json()); 

// Routes
// app.use("/auth", loginRoutes); 
// app.use("/report", reportRoutes); 
app.use("/vendor", vendorRoutes); 

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
