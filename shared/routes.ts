import { z } from 'zod';
import { insertSitResultSchema, insertAssessmentSchema, sitResults, assessments } from './schema';

// Shared error schemas
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
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  sit: {
    submit: {
      method: 'POST' as const,
      path: '/api/sit/submit',
      input: z.object({
        answers: z.record(z.string()), // Question ID -> Answer Value
        calculatedType: z.string(), // 클라이언트에서 계산된 SIT 유형
        scores: z.object({
          IE: z.number(),
          WC: z.number(),
          SN: z.number(),
          MB: z.number(),
        }),
      }),
      responses: {
        201: z.custom<typeof sitResults.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    latest: {
      method: 'GET' as const,
      path: '/api/sit/latest',
      responses: {
        200: z.custom<typeof sitResults.$inferSelect | null>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  assessments: {
    create: {
      method: 'POST' as const,
      path: '/api/assessments',
      input: z.object({
        image: z.string(), // Base64 data
        persona: z.enum(['sujin', 'minsu', 'jihyun']),
      }),
      responses: {
        201: z.custom<typeof assessments.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/assessments',
      responses: {
        200: z.array(z.custom<typeof assessments.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/assessments/:id',
      responses: {
        200: z.custom<typeof assessments.$inferSelect>(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    createBatch: {
      method: 'POST' as const,
      path: '/api/assessments/batch',
      input: z.object({
        images: z.array(z.string()).min(1).max(10),
        persona: z.enum(['sujin', 'minsu', 'jihyun']),
      }),
      responses: {
        201: z.object({
          individual: z.array(z.custom<typeof assessments.$inferSelect>()),
          summary: z.object({
            overallScores: z.object({
              harmony: z.number(),
              trend: z.number(),
              body: z.number(),
            }),
            overallFeedback: z.string(),
          }),
        }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    toggleFavorite: {
      method: 'PATCH' as const,
      path: '/api/assessments/:id/favorite',
      responses: {
        200: z.custom<typeof assessments.$inferSelect>(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    getByMonth: {
      method: 'GET' as const,
      path: '/api/assessments/month/:year/:month',
      responses: {
        200: z.array(z.custom<typeof assessments.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    stats: {
      method: 'GET' as const,
      path: '/api/assessments/stats',
      responses: {
        200: z.object({
          totalCount: z.number(),
          averageScores: z.object({
            harmony: z.number(),
            trend: z.number(),
            body: z.number(),
          }),
          favoriteCount: z.number(),
          monthlyCount: z.number(),
        }),
        401: errorSchemas.unauthorized,
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
