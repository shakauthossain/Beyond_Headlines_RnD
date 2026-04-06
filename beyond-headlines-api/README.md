# Beyond Headlines API

Complete mock REST API for Beyond Headlines — an AI-assisted news platform.

## Tech Stack
- Express.js with TypeScript
- Zod for validation
- JWT Auth
- Swagger UI Documentation
- In-memory mock data

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Setup environment:
   ```bash
   cp .env.example .env
   ```

3. Run in development:
   ```bash
   npm run dev
   ```

4. View API Documentation:
   Visit `http://localhost:8000/docs` in your browser.

## Project Structure
- `src/app.ts`: Express application setup
- `src/server.ts`: Server entry point
- `src/routes/`: API endpoint definitions (mounts under `/api/v1`)
- `src/data/mockData.ts`: In-memory data store
- `src/types/`: Zod schemas and TypeScript types
- `src/utils/`: Shared helper functions (delay, response, jwt)
- `src/middleware/`: Auth, Validation, and Error handling
