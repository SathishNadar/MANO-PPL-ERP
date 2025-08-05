import express from 'express';
import cors from 'cors'
import ForgotPasswordAPI from './AuthAPI/ForgotPasswordAPI.js'
import SignupRoutes from './AuthAPI/VerifyEmailAPI.js';
import LoginRoutes from './AuthAPI/LoginAPI.js'
import ProjectRoutes from './ProjectAPI/Projects.js';
import VendorRoutes from './VendorClientAPI/vendor.js'

const app = express();
const PORT = 5001;

const allowedOrigins = [
  'http://localhost:5173',
  'http://35.207.249.142:5173',
  // 'https://my-frontend-domain.com'
];

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
app.use('/api',ForgotPasswordAPI)
app.use('/api',SignupRoutes)
app.use('/auth',LoginRoutes)
app.use('/project', ProjectRoutes)
app.use("/vendor_api", VendorRoutes);

app.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server listening on http://0.0.0.0:${PORT}`);
}); 