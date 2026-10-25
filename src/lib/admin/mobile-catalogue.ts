import { z } from "zod";
export const phoneEntrySchema=z.object({id:z.string().uuid().optional(),name:z.string().trim().min(1).max(100),aliases:z.array(z.string().trim().min(1).max(100)).max(20),enabled:z.boolean(),sort_order:z.number().int().min(0).max(100000),brand_id:z.string().uuid().optional(),older_group:z.boolean().optional(),other:z.boolean().optional()}).strict();
