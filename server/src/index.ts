import express from 'express';
import cors from 'cors';
import healthRouter from './routes/health.routes';
import ranchesRouter from './routes/ranches.routes';
import scoutingRouter from './routes/scouting.routes';
import waterRouter from './routes/water.routes';
import pestRouter from './routes/pest.routes';
import nutrientsRouter from './routes/nutrients.routes';
import planningRouter from './routes/planning.routes';
import { notFoundHandler, errorHandler } from './middleware/error.middleware';

const app = express();
const port = process.env.PORT || 3000;

// CORS setup with customizable options / allowlist
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(',')
  : ['http://localhost:4200', 'http://localhost:3000', 'http://127.0.0.1:4200'];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or local testing)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Simulated network latency middleware (800ms delay by default, customizable)
app.use((req, res, next) => {
  const latencyQuery = req.query.no_delay === 'true' ? 0 : 800;
  const latency = process.env.LATENCY_MS ? parseInt(process.env.LATENCY_MS, 10) : latencyQuery;
  
  if (latency > 0) {
    setTimeout(next, latency);
  } else {
    next();
  }
});

// --- API ROUTES ---
app.use('/api', healthRouter);
app.use('/api', ranchesRouter);
app.use('/api', scoutingRouter);
app.use('/api', waterRouter);
app.use('/api', pestRouter);
app.use('/api', nutrientsRouter);
app.use('/api', planningRouter);

// --- ERROR HANDLING MIDDLEWARE ---
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Express API server running at http://localhost:${port}`);
});
