import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import routes from './routes';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';
import { ok } from './utils/response';

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});

app.use('/api/', limiter);

// Swagger Setup
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Beyond Headlines Mock API',
      version: '1.0.0',
      description: 'API documentation for Beyond Headlines — an AI-assisted news platform',
    },
    servers: [
      {
        url: 'http://localhost:8000/api/v1',
        description: 'V1 API Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ArticleCreate: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            categoryId: { type: 'string' },
            tagIds: { type: 'array', items: { type: 'string' } },
            bannerImage: { type: 'string' }
          },
          required: ['title', 'content', 'categoryId']
        }
      }
    },
  },
  apis: ['./src/routes/*.ts'],
};

const specs = swaggerJsdoc(options);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.use('/api/v1', routes);

// Health Check
app.get('/health', (req, res) => {
  return ok(res, { status: 'OK', timestamp: new Date().toISOString() });
});

// Root Redirect to Docs
app.get('/', (req, res) => {
  res.redirect('/docs');
});

// Error Handling
app.use(errorHandler);

export default app;
