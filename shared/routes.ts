import { z } from 'zod';
import { insertLocationSchema, insertForecastSchema, insertObservationSchema, locations, forecasts, observations } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  locations: {
    list: {
      method: 'GET' as const,
      path: '/api/locations',
      responses: {
        200: z.array(z.custom<typeof locations.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/locations',
      input: insertLocationSchema,
      responses: {
        201: z.custom<typeof locations.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/locations/:id',
      responses: {
        200: z.custom<typeof locations.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/locations/:id',
      input: insertLocationSchema.partial(),
      responses: {
        200: z.custom<typeof locations.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
  },
  forecasts: {
    list: {
      method: 'GET' as const,
      path: '/api/forecasts',
      input: z.object({
        locationId: z.coerce.number().optional(),
        source: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof forecasts.$inferSelect>()),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/forecasts/:id',
      input: insertForecastSchema.partial(),
      responses: {
        200: z.custom<typeof forecasts.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/forecasts',
      input: insertForecastSchema,
      responses: {
        201: z.custom<typeof forecasts.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  observations: {
    list: {
      method: 'GET' as const,
      path: '/api/observations',
      input: z.object({
        locationId: z.coerce.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof observations.$inferSelect>()),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/observations/:id',
      input: insertObservationSchema.partial(),
      responses: {
        200: z.custom<typeof observations.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/observations',
      input: insertObservationSchema,
      responses: {
        201: z.custom<typeof observations.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  stats: {
    accuracy: {
      method: 'GET' as const,
      path: '/api/stats/accuracy',
      input: z.object({
        locationId: z.coerce.number().optional(),
      }).optional(),
      responses: {
        200: z.object({
          metrics: z.array(z.object({
            source: z.string(),
            period: z.enum(['2d', '3d', '7d', '31d']),
            mae: z.number(),
          })),
          summary: z.object({
            bestSource: z.string(),
            bestSourceMae: z.number(),
          }),
        }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
