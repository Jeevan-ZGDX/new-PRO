// Health check script for cron jobs / keep-alive
// Run with: npm run cron:health
// Schedule via Render Cron Job, GitHub Actions, or crontab

const HEALTH_URL = process.env.HEALTH_URL || 'https://your-app-name.onrender.com/api/health'

async function ping() {
  const start = Date.now()
  const res = await fetch(HEALTH_URL)
  const ms = Date.now() - start

  if (!res.ok) {
    console.error(`[${new Date().toISOString()}] FAIL health check: HTTP ${res.status} (${ms}ms)`)
    process.exit(1)
  }

  console.log(`[${new Date().toISOString()}] OK health check: HTTP ${res.status} (${ms}ms)`)
}

ping().catch((err) => {
  console.error(`[${new Date().toISOString()}] ERROR health check:`, err.message)
  process.exit(1)
})