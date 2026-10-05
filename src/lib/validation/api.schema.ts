import { z } from "zod";

export const NewsCategorySchema = z.enum(["technology", "business"]);
export type NewsCategoryType = z.infer<typeof NewsCategorySchema>;

export const SummaryStatusSchema = z.enum(["pending", "processing", "completed", "failed"]);
export type SummaryStatusType = z.infer<typeof SummaryStatusSchema>;

export const PaginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return 1;
      const parsed = parseInt(val, 10);
      return isNaN(parsed) || parsed < 1 ? 1 : parsed;
    }),
  limit: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return 12;
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed < 1) return 12;
      return Math.min(parsed, 100); // maxLimit = 100
    }),
  category: z
    .string()
    .optional()
    .transform((val) => {
      if (val === "technology" || val === "business") return val;
      return "all" as const;
    }),
  source: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val.trim().toLowerCase() === "all") return undefined;
      return val.trim().slice(0, 100);
    }),
  search: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return "";
      return val.trim().slice(0, 150); // limit search length
    }),
  status: z
    .string()
    .optional()
    .transform((val) => {
      if (val === "pending" || val === "processing" || val === "completed" || val === "failed") {
        return val;
      }
      return undefined;
    }),
});

export const SummarizeBodySchema = z.object({
  forceRetry: z.boolean().optional().default(false),
});

export const MongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");
