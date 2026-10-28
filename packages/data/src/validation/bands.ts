import { z } from "zod";
import { uuidSchema } from "./shared";

export const updateBandTierSchema = z.object({
  bandId: uuidSchema,
  tier: z.enum(["free_unverified", "free_verified", "pro", "max"]),
});
export type UpdateBandTierInput = z.infer<typeof updateBandTierSchema>;

export const bandVerificationDecisionSchema = z.object({
  bandId: uuidSchema,
  requestId: uuidSchema.nullish(),
  action: z.enum(["approve", "reject"]),
  notes: z.string().max(2000).optional(),
});
export type BandVerificationDecisionInput = z.infer<typeof bandVerificationDecisionSchema>;
