import express from "express";
import cors from "cors";
import cookieParser from 'cookie-parser';
import loginRoutes from "./routes/auth.js";
import webRoutes from "./routes/web.js"; 
import vendorRoutes from "./routes/vendor.js"; 
import reportRoutes from "./routes/report.js"; 
import projectRoutes from "./routes/project.js"; 

const app = express();
const port = 3000;

app.use(cors()); 
app.use(cookieParser());
app.use(express.json()); 

// Routes
app.use("/auth", loginRoutes); 
app.use("/vendor_api", vendorRoutes); 
app.use("/", webRoutes); 
app.use("/report", reportRoutes); 
app.use("/project", projectRoutes); 

app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on http://localhost:${port}`);
});
