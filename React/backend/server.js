import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';

import express from 'express';
import cors from 'cors';
import LoginRoutes from './AuthAPI/LoginAPI.js';
import SignupRoutes, { handleVerifySignup } from './AuthAPI/VerifyEmailAPI.js';
import ForgotPasswordRoutes from './AuthAPI/ForgotPasswordAPI.js';

import AppError from './utils/AppError.js';
import errorHandler from './middleware/errorHandler.js';
import ProjectRoutes from './ProjectAPI/Projects.js';
// import ProjectContactsRoutes from './ProjectAPI/ProjectContacts.js';
import ProjectDirectoryRoutes from './ProjectAPI/ProjectDirectory.js';
import ProjectVendorsRoutes from './ProjectAPI/ProjectVendors.js';
import ProjectRolesandResponsibilitiesRoutes from './ProjectAPI/ProjectRolesandResponsibilities.js';
import ReportRoutes from './ProjectAPI/Reports.js';
import BudgetRoutes from './ProjectAPI/Budget.js';
import HindranceRoutes from './ProjectAPI/Hindrance.js';
import VendorRoutes from './VendorClientAPI/vendor.js';
import TaskRoutes from './Tasks/task.js';
import AttendanceRoutes from './Attendance/Attendance.js';
import Admin from './Admin/Admin.js';
import WorkLocationRoutes from './Admin/WorkLocations.js';
import S3Routes from './s3/s3Routes.js';
import ProjectSummaryRoutes from './ProjectAPI/ProjectSummary.js';


import './config.js';
import cookieParser from 'cookie-parser';

const app = express();
const PORT = process.env.PORT;
const public_ip = process.env.URI || '127.0.0.1';

const allowedOrigins = [
  `http://localhost:5173`,
  `http://127.0.0.1:5173`,
  `http://${public_ip}:5173`,
  'https://erp.mano.co.in',
  'https://mano.co.in',
  'https://www.mano.co.in'
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

app.use(express.json());
app.use('/auth', LoginRoutes);
app.use('/api', SignupRoutes);
app.get('/verify-signup', handleVerifySignup);
app.post('/verify-signup', handleVerifySignup);
app.use('/api', ForgotPasswordRoutes);

app.use('/s3', S3Routes);

app.use('/project', ProjectRoutes);
app.use("/projectContacts", ProjectDirectoryRoutes);
app.use("/projectVendors", ProjectVendorsRoutes);
app.use("/projectStaffRoles", ProjectRolesandResponsibilitiesRoutes);
app.use("/projectSummary", ProjectSummaryRoutes);
app.use("/report", ReportRoutes);
app.use("/budget", BudgetRoutes);
app.use("/vendor_api", VendorRoutes);
app.use("/tasks", TaskRoutes);
app.use("/attendance", AttendanceRoutes);
app.use("/admin", Admin);
app.use("/admin/locations", WorkLocationRoutes);
app.use("/hindrance", HindranceRoutes);

app.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});

const HTTP_PORT = Number(process.env.PORT) || 5001;
// create http server wrapping express app
const server = createServer(app);

// create socket.io instance attached to that server
const io = new SocketIO(server, {
  path: '/socket.io/',                // must match nginx proxy location
  cors: {
    origin: [
      'https://erp.mano.co.in',
      'https://mano.co.in',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ],
    credentials: true
  },
  // you can tune pingInterval/pingTimeout if needed
});

// basic connection handler
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id, 'from', socket.handshake.address);

  // example: server -> client
  socket.emit('welcome', { msg: 'welcome to socket server' });

  // example: receive client message
  socket.on('client-msg', (payload) => {
    console.log('client-msg', payload);
    // broadcast to others if required:
    socket.broadcast.emit('msg-broadcast', payload);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected', socket.id, reason);
  });
});


server.listen(HTTP_PORT, '127.0.0.1', () => {
  console.log(`Backend server listening at http://127.0.0.1:${HTTP_PORT}`);
});

// Handle 404 for undefined routes
app.all(/(.*)/, (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(errorHandler);
