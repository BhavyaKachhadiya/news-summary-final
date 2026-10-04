import { z } from "zod";
import { PersonSchema } from "./technology-summary.schema";

export const FinancialDetailSchema = z.object({
  metric: z.string().default(""),
  value: z.string().default(""),
  context: z.string().default(""),
});

export const BusinessOrganizationSchema = z.object({
  name: z.string().default(""),
  type: z.string().default(""),
  role: z.string().default(""),
});

export const BusinessSummarySchema = z.object({
  headline: z.string().min(1, "Headline is required"),
  overview: z.string().min(1, "Overview is required"),
  background: z.string().default(""),
  what_happened: z.string().min(1, "What happened is required"),
  business_details: z.array(z.string()).default([]),
  financial_details: z.array(FinancialDetailSchema).default([]),
  regulatory_context: z.string().default(""),
  market_economic_context: z.string().default(""),
  companies_and_organizations: z.array(BusinessOrganizationSchema).default([]),
  people: z.array(PersonSchema).default([]),
  statements_and_claims: z.array(z.string()).default([]),
  impact: z.string().default(""),
  risks_and_uncertainties: z.array(z.string()).default([]),
  future_developments: z.array(z.string()).default([]),
  key_takeaways: z.array(z.string()).default([]),
  category: z
    .string()
    .transform((val) => "Business" as const),
});

export type BusinessSummaryOutput = z.infer<typeof BusinessSummarySchema>;
