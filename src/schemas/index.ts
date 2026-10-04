import { NewsCategory } from "@/config/feeds";
import { TechnologySummarySchema, type TechnologySummaryOutput } from "./technology-summary.schema";
import { BusinessSummarySchema, type BusinessSummaryOutput } from "./business-summary.schema";
import { ArticleSummary } from "@/types/news";

export { TechnologySummarySchema, BusinessSummarySchema };
export type { TechnologySummaryOutput, BusinessSummaryOutput };

export function getSummarySchema(category: NewsCategory) {
  switch (category) {
    case "technology":
      return TechnologySummarySchema;
    case "business":
      return BusinessSummarySchema;
    default: {
      const _exhaustiveCheck: never = category;
      throw new Error(`Unsupported category: ${_exhaustiveCheck}`);
    }
  }
}

export function validateSummary(
  category: NewsCategory,
  data: unknown
): { success: true; data: ArticleSummary } | { success: false; error: string } {
  try {
    const schema = getSummarySchema(category);
    const parsed = schema.parse(data);
    return { success: true, data: parsed as unknown as ArticleSummary };
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Validation failed with unknown error" };
  }
}
