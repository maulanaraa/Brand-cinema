import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';

// Glob patterns must use forward slashes — path.join backslashes break on Windows
const routesGlob = path
  .join(__dirname, '../routes/*.{ts,js}')
  .replace(/\\/g, '/');

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cinema Booking API',
      version: '1.0.0',
      description: 'Production-ready Cinema Booking System Backend API',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: 'Development server',
      },
      {
        url: 'https://api.brand-cinemas.online',
        description: 'Production server',
      },
    ],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Movies', description: 'Movie management' },
      { name: 'Showtimes', description: 'Showtime management' },
      { name: 'Bookings', description: 'Booking & payment' },
      { name: 'Payments', description: 'Payment methods & Midtrans webhooks' },
      { name: 'Halls', description: 'Cinema hall / studio management' },
      { name: 'Cities', description: 'City master data' },
      { name: 'Cinemas', description: 'Cinema location management' },
      { name: 'Concessions', description: 'Food & beverage concessions' },
      { name: 'Carousel', description: 'Homepage carousel banners' },
      { name: 'Users', description: 'User management (Admin)' },
      { name: 'Media', description: 'Image proxy utilities' },
      { name: 'Chat', description: 'Cinema chatbot (Gemini RAG)' },
      { name: 'Admin', description: 'Admin-only endpoints' },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
        },
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
      },
    },
  },
  apis: [routesGlob, path.resolve(process.cwd(), 'src/routes/*.{ts,js}').replace(/\\/g, '/')],
};

export const swaggerSpec = swaggerJsdoc(options);
