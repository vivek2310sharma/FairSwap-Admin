import { readListingPhoto } from "@/lib/listings/photo";

export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ listingId: string; mediaId: string }> }) {
  return readListingPhoto(await params);
}
