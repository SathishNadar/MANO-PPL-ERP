import express from 'express';
import cors from 'cors'
import LoginRoutes from './AuthAPI/LoginAPI.js'
import SignupRoutes from './AuthAPI/VerifyEmailAPI.js';
import ForgotPasswordRoutes from './AuthAPI/ForgotPasswordAPI.js'

import ProjectRoutes from './ProjectAPI/Projects.js';
import ReportRoutes from './ProjectAPI/Reports.js'
import VendorRoutes from './VendorClientAPI/vendor.js'
import TaskRoutes from './Tasks/task.js'
import './config.js';
import cookieParser from 'cookie-parser';

const app = express();
const PORT = 5001;
const public_ip = process.env.URI;

const allowedOrigins = [
  `http://localhost:5173`,
  `http://127.0.0.1:5173`,
  `http://${public_ip}:5173`,
  // 'https://my-frontend-domain.com'
];

app.use(cookieParser());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(express.json())
app.use('/auth',LoginRoutes)
app.use('/api',SignupRoutes)
app.use('/api',ForgotPasswordRoutes)

app.use('/project', ProjectRoutes);
app.use("/report", ReportRoutes); 
app.use("/vendor_api", VendorRoutes);
app.use("/tasks", TaskRoutes);
app.use("/tasks", TaskRoutes);

app.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server listening on http://0.0.0.0:${PORT}`);
}); 

