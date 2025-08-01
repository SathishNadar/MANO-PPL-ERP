import express from 'express';
import cors from 'cors'
import ForgotPasswordAPI from './AuthAPI/ForgotPasswordAPI.js'
import SignupRoutes from './AuthAPI/VerifyEmailAPI.js';
import LoginRoutes from './AuthAPI/LoginAPI.js'
import ProjectRoutes from './ProjectAPI/Projects.js';

const app = express();
const PORT = 5001;

app.use(cors())
app.use(express.json())
app.use('/api',ForgotPasswordAPI)
app.use('/api',SignupRoutes)
app.use('/auth',LoginRoutes)
app.use('/project', ProjectRoutes)
app.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});

app.listen(PORT, () => {
  console.log(`Backend server listening on http://localhost:${PORT}`);
}); 