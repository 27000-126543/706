/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import dashboardRoutes from './routes/dashboard.js'
import monitoringRoutes from './routes/monitoring.js'
import alertsRoutes from './routes/alerts.js'
import forecastRoutes from './routes/forecast.js'
import reportsRoutes from './routes/reports.js'
import adminRoutes from './routes/admin.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
void path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/monitoring', monitoringRoutes)
app.use('/api/alerts', alertsRoutes)
app.use('/api/forecast', forecastRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/admin', adminRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
