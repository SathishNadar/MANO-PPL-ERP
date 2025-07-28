import express from 'express';
import cors from 'cors'
import ForgotPasswordAPI from './APIs/ForgotPasswordAPI.js'
import SignupRoutes from './APIs/VerifyEmailAPI.js';
import ProjectRoutes from './APIs/Projects.js';

const app = express();
const PORT = 5001;

app.use(cors())
app.use(express.json())
app.use('/api',ForgotPasswordAPI)
app.use('/api',SignupRoutes)
app.use('/project', ProjectRoutes)
app.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});

app.listen(PORT, () => {
  console.log(`Backend server listening on http://localhost:${PORT}`);
}); 