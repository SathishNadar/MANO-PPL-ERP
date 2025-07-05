import express from 'express';
import cors from 'cors'
import emailAPI from './EmailAPI.js'

const app = express();
const PORT = 5000;

app.use(cors())
app.use(express.json())
app.use('/api',emailAPI)

app.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});

app.listen(PORT, () => {
  console.log(`Backend server listening on http://localhost:${PORT}`);
});