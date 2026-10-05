import { z } from "zod";

export const PersonSchema = z.object({
  name: z.string().default(""),
  role: z.string().default(""),
  involvement: z.string().default(""),
});

export const TechnologyOrganizationSchema = z.object({
  name: z.string().default(""),
  involvement: z.string().default(""),
  type: z.string().optional().default(""),
});

export const TechnologySummarySchema = z.object({
  headline: z.string().min(1, "Headline is required"),
  overview: z.string().min(1, "Overview is required"),
  background: z.string().default(""),
  what_happened: z.string().min(1, "What happened is required"),
  key_details: z.array(z.string()).default([]),
  technology_explained: z.string().default(""),
  people: z.array(PersonSchema).default([]),
  companies_and_organizations: z.array(TechnologyOrganizationSchema).default([]),
  statements_and_claims: z.array(z.string()).default([]),
  impact: z.string().default(""),
  future_developments: z.array(z.string()).default([]),
  key_takeaways: z.array(z.string()).default([]),
  category: z.literal("Technology"),
});

export type TechnologySummaryOutput = z.infer<typeof TechnologySummarySchema>;
