import { z } from "zod";
const message = z.object({ id: z.string().uuid(), sender_name: z.string().max(300).nullable().optional(), content: z.string().max(10000), created_at: z.string().datetime({ offset: true }) });
const envelope = z.object({ report_id: z.string().uuid(), reported_message: message, preceding_context: z.array(message).max(3) });
/** The live RPC returns an envelope, not the array assumed by the source UI. */
export function parseReportEvidence(value: unknown, reportId: string, messageId: string) {
  const parsed = envelope.safeParse(value);
  if (!parsed.success || parsed.data.report_id !== reportId || parsed.data.reported_message.id !== messageId) return null;
  return [...parsed.data.preceding_context].reverse().concat(parsed.data.reported_message);
}
