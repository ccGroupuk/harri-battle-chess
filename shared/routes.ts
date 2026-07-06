import { z } from "zod";
import { insertGameSchema, games } from "./schema";

export const api = {
  games: {
    create: {
      method: "POST" as const,
      path: "/api/games",
      input: z.object({
        gameMode: z.enum(['local', 'ai_easy', 'ai_medium', 'ai_hard', 'harri_smash', 'custom']).optional().default('local'),
        board: z.array(z.array(z.object({ type: z.string(), color: z.enum(['w', 'b']) }).nullable())).optional(),
      }),
      responses: {
        201: z.custom<typeof games.$inferSelect>(),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/games/:id",
      responses: {
        200: z.custom<typeof games.$inferSelect>(),
        404: z.object({ message: z.string() }),
      },
    },
    update: {
      method: "PUT" as const,
      path: "/api/games/:id",
      input: z.object({
        board: z.array(z.array(z.object({ type: z.string(), color: z.enum(['w', 'b']) }).nullable())),
        turn: z.enum(['w', 'b']),
        isGameOver: z.boolean().optional(),
        winner: z.string().optional().nullable(),
      }),
      responses: {
        200: z.custom<typeof games.$inferSelect>(),
        404: z.object({ message: z.string() }),
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
