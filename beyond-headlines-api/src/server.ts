import app from './app';
import { config } from './config';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 Beyond Headlines API is running on http://localhost:${PORT}`);
  console.log(`📚 Documentation is available at http://localhost:${PORT}/docs`);
});
