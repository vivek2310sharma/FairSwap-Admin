import { CasePage } from "@/components/ratings/case-page";
export const dynamic = "force-dynamic";
export const metadata = { title: "Ratings case — FairSwap Admin" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <CasePage id={(await params).id} target="case" />;
}
