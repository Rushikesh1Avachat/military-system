import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initializeDatabase } from './db.js';
import { authenticate } from './middleware/rbac.js';
import { apiRouter } from './routes/index.js';
import { authRouter } from './routes/auth.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.send('Military Asset Management System API is live');
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Military Asset Management System API is running.' });
});

app.use('/api/auth', authRouter);
app.use('/api', authenticate, apiRouter);

initializeDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Backend started on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });
