import app from './app';
import { config } from './config';
import { scheduleScrapeJob } from './workers/queue';

const PORT = config.port;

app.listen(PORT, async () => {
  console.log(`🚀 Beyond Headlines API is running on http://localhost:${PORT}`);
  console.log(`📚 Documentation is available at http://localhost:${PORT}/docs`);

  // Start scraper scheduler
  try {
    await scheduleScrapeJob();
  } catch (error) {
    console.error('[BullMQ] Failed to schedule scrape job:', error);
  }
});
