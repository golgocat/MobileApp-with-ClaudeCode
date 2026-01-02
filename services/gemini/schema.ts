import { z } from "zod";

export const DayRiskSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "EXTREME"]),
  expectedRainMmRange: z
    .object({ min: z.number(), max: z.number() })
    .nullable(),
  confidence: z.number().min(0).max(1),
  advice: z.string().min(1),
  rationale: z.string().min(1),
  flags: z.array(z.string()),
});

export const TravelRiskReportSchema = z.object({
  modelVersion: z.string(),
  timezone: z.string(),
  days: z.array(DayRiskSchema),
});

export type ParsedTravelRiskReport = z.infer<typeof TravelRiskReportSchema>;
