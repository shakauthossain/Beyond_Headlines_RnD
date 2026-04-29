import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import routes from './routes';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';
import { authenticate } from './middleware/auth';
import { ok } from './utils/response';

const app = express();

// Middlewares
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "'unsafe-inline'", "https://cdn.redoc.ly"],
        "connect-src": ["'self'", "https://cdn.redoc.ly"],
        "img-src": ["'self'", "data:", "https://cdn.redoc.ly"],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "font-src": ["'self'", "https://fonts.gstatic.com"],
        "worker-src": ["'self'", "blob:"],
      },
    },
  })
);
app.use(cors());
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});

app.use('/api/', limiter);

// Swagger Setup
const options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Beyond Headlines API',
      version: '1.0.0',
      description: `
        # Beyond Headlines Editorial Engine
        
        This is the definitive API for the Beyond Headlines editorial platform. It powers a 7-step AI-assisted news lifecycle.
        
        ## 🔐 Authentication (The Identity Handshake)
        Every request must carry two credentials:
        1. **X-API-Token** (Header): \`beyond-headlines-secret-token-2024\`
        2. **email** (Payload/Query): Current Laravel User's Email
        
        ## 🔄 The 7-Step Editorial Lifecycle
        1. **Discovery**: Intelligence scans and news clustering (\`/intelligence/scan\`, \`/clusters\`)
        2. **Research**: AI-generated topic briefs (\`/research/topic-brief\`)
        3. **Deep Dive**: Full Perplexity research sessions (\`/research/generate\`)
        4. **Drafting**: Article creation and AI-assisted outlining (\`/articles\`, \`/ai/outline\`)
        5. **Sub-editing**: AI-powered editorial audits and scoring (\`/ai/sub-edit\`, \`/ai/score-headlines\`)
        6. **Packaging**: Social media and image concept generation (\`/ai/packaging\`)
        7. **Publishing**: Multi-stage review and approval workflow (\`/publish\`)
      `,
      contact: {
        name: 'Beyond Headlines Engineering',
      },
    },
    servers: [
      {
        url: 'http://localhost:8000/api/v1',
        description: 'Local Development',
      },
    ],
    security: [
      {
        apiToken: [],
      },
    ],
    tags: [
      { name: 'Step 01 - Discovery', description: 'Intelligence scans and trending clusters' },
      { name: 'Step 02 & 03 - Research', description: 'AI Briefs and deep research sessions' },
      { name: 'Articles', description: 'Core drafting and versioning' },
      { name: 'Step 04, 05 & 06 - AI Helpers', description: 'Outlining, sub-editing, and packaging assistants' },
      { name: 'Step 07 - Publishing', description: 'Review queue and approval workflows' },
      { name: 'Analytics', description: 'Platform and content performance data' },
      { name: 'Admin', description: 'System-wide configurations and mappings' },
    ],
    components: {
      securitySchemes: {
        apiToken: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Token',
          description: 'Hardcoded secret shared with Laravel Editor Panel',
        },
      },
      parameters: {
        emailParam: {
          in: 'query',
          name: 'email',
          required: true,
          schema: { type: 'string', format: 'email' },
          description: 'Laravel user email identifier',
        },
        apiTokenParam: {
          in: 'header',
          name: 'X-API-Token',
          required: true,
          schema: { type: 'string' },
          description: 'Hardcoded secret service token',
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication is required or the token is invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        ForbiddenError: {
          description: 'The authenticated user does not have permission to access the resource',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        BadRequestError: {
          description: 'The request payload is invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        NotFoundError: {
          description: 'The requested resource was not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          additionalProperties: false,
          properties: {
            error: { type: 'string', example: 'Article not found' },
          },
          required: ['error'],
        },
        ValidationErrorResponse: {
          type: 'object',
          additionalProperties: false,
          properties: {
            error: { type: 'string', example: 'Validation failed' },
            details: { type: 'object' },
          },
          required: ['error', 'details'],
        },
        HealthResponse: {
          type: 'object',
          additionalProperties: false,
          properties: {
            status: { type: 'string', example: 'OK' },
            timestamp: { type: 'string', format: 'date-time' },
          },
          required: ['status', 'timestamp'],
        },
        PaginationMeta: {
          type: 'object',
          additionalProperties: false,
          properties: {
            total: { type: 'integer', minimum: 0 },
            page: { type: 'integer', minimum: 1 },
            limit: { type: 'integer', minimum: 1 },
          },
          required: ['total', 'page', 'limit'],
        },
        Category: {
          type: 'object',
          additionalProperties: false,
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            slug: { type: 'string' },
            parentId: { type: 'string', nullable: true },
          },
          required: ['id', 'name', 'slug'],
        },
        Tag: {
          type: 'object',
          additionalProperties: false,
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            slug: { type: 'string' },
          },
          required: ['id', 'name', 'slug'],
        },
        ArticleStatus: {
          type: 'string',
          enum: ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED'],
        },
        Tone: {
          type: 'string',
          enum: ['ANALYTICAL', 'CRITICAL', 'EXPLANATORY'],
        },
        ArticleCreateRequest: {
          type: 'object',
          additionalProperties: false,
          properties: {
            email: { type: 'string', format: 'email', description: 'Laravel user email identifier' },
            title: { type: 'string' },
            body: { type: ['object', 'array', 'string'], description: 'TipTap or rich article body payload' },
            excerpt: { type: 'string' },
            categoryId: { type: 'string' },
            tagIds: { type: 'array', items: { type: 'string' } },
            bannerImage: { type: 'string', format: 'uri' },
            angle: { type: 'string' },
            tone: { $ref: '#/components/schemas/Tone' },
          },
          required: ['email', 'title', 'body'],
        },
        ArticleUpdateRequest: {
          allOf: [
            { $ref: '#/components/schemas/ArticleCreateRequest' },
            {
              type: 'object',
              properties: {
                status: { $ref: '#/components/schemas/ArticleStatus' },
                metaTitle: { type: 'string' },
                metaDescription: { type: 'string' },
              },
            },
          ],
        },
        ArticleResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            slug: { type: 'string' },
            body: { type: 'object' },
            status: { $ref: '#/components/schemas/ArticleStatus' },
            authorEmail: { type: 'string' },
            brief: { type: 'object', description: 'Cached AI topic brief' },
            subEditReport: { type: 'object', description: 'Cached AI sub-editing audit' },
            headlineScores: { type: 'object', description: 'Cached AI headline evaluations' },
            packaging: { type: 'object', description: 'Cached AI packaging concepts' },
          }
        },
        RevisionRequest: {
          type: 'object',
          additionalProperties: false,
          properties: {
            email: { type: 'string', format: 'email' },
            body: { type: ['object', 'array', 'string'] },
            title: { type: 'string' },
          },
          required: ['email', 'body', 'title'],
        },
        ResearchGenerateRequest: {
          type: 'object',
          additionalProperties: false,
          properties: {
            email: { type: 'string', format: 'email' },
            articleId: { type: 'string', format: 'uuid' },
            angle: { type: 'string' },
          },
          required: ['email', 'articleId'],
        },
        SearchIntentRequest: {
          type: 'object',
          additionalProperties: false,
          properties: {
            email: { type: 'string', format: 'email' },
            query: { type: 'string' },
            category: { type: 'string' },
            region: { type: 'string' },
            timeframe: { type: 'string' },
          },
          required: ['email', 'query'],
        },
        SearchIntentResponse: {
          type: 'object',
          additionalProperties: true,
        },
        ScrapeJobResponse: {
          type: 'object',
          additionalProperties: true,
        },
        ScrapeConfig: {
          type: 'object',
          additionalProperties: true,
        },
        ScrapedHeadline: {
          type: 'object',
          additionalProperties: true,
        },
        Cluster: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            topic: { type: 'string' },
            summary: { type: 'string' },
            category: { type: 'string' },
            region: { type: 'string' },
            brief: { type: 'object', description: 'Cached AI research brief' },
            headlines: { type: 'array', items: { $ref: '#/components/schemas/ScrapedHeadline' } },
          }
        },
        ResearchSession: {
          type: 'object',
          additionalProperties: true,
        },
        PackagingResponse: {
          type: 'object',
          additionalProperties: true,
        },
      }
    },
  },
  apis: ['./src/routes/*.ts'],
};
const specs = swaggerJsdoc(options);

// API Documentation Routes
app.get('/api-docs.json', (req, res) => res.json(specs));

// Professional Redoc UI
app.get('/api-docs', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Beyond Headlines API Documentation</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
        <style>body { margin: 0; padding: 0; }</style>
      </head>
      <body>
        <redoc spec-url='/api-docs.json' theme='{ "colors": { "primary": { "main": "#53347e" } } }'></redoc>
        <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
      </body>
    </html>
  `);
});

// Legacy Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customSiteTitle: 'Beyond Headlines API Docs',
}));

// Routes
app.use('/api/v1', authenticate, routes);

// Health Check
app.get('/health', (req, res) => {
  return ok(res, { status: 'OK', timestamp: new Date().toISOString() });
});

// Root Redirect to Docs
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// Error Handling
app.use(errorHandler);

export default app;
