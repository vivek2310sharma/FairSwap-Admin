import {beforeEach,describe,expect,it,vi} from "vitest";
vi.mock("server-only",()=>({}));
const config=vi.hoisted(()=>({value:"test" as "test"|"production"}));
vi.mock("@/lib/auth/runtime-config",()=>({readAuthConfig:()=>({environment:config.value})}));
import {isFamilyReviewEnabled,loadStaffFamilyReviewPacket} from "@/lib/listings/family-review-server";
import type {AdminClient} from "@/lib/supabase/client";

const listingId="22222222-2222-4222-8222-222222222222";
const packet={
 identity:{id:listingId,revision:8,status:"pending_review"},
 family:"property",title:"Synthetic rental property",description:"Synthetic test only",
 category_id:"33333333-3333-4333-8333-333333333333",city_id:"44444444-4444-4444-8444-444444444444",
 locality_id:null,condition:null,price_type:null,price_paise:null,attributes:{bhk:2},
 details:{financial:{basis:"dwelling",rent:{state:"known",amount_paise:1234000}}},
 media:[{id:"55555555-5555-4555-8555-555555555555",status:"ready",display_order:0}],
 cover_photo_id:null,fingerprint:"a".repeat(64),
};
beforeEach(()=>{vi.unstubAllEnvs();config.value="test";});
describe("staff review release environment and strict packet boundary",()=>{
  it("keeps Test and Production approval routing disabled by default",()=>{
    expect(isFamilyReviewEnabled()).toBe(false);
    config.value="production";expect(isFamilyReviewEnabled()).toBe(false);
  });
  it("keeps Test and Production attestations separate",()=>{
    vi.stubEnv("VERCEL_ENV","preview");
    vi.stubEnv("FAIRSWAP_TEST_FAMILY_REVIEW_VERIFIED","wpppxlnbzqynvhpeuavd");
    expect(isFamilyReviewEnabled()).toBe(true);
    config.value="production";expect(isFamilyReviewEnabled()).toBe(false);
    vi.stubEnv("VERCEL_ENV","production");
    vi.stubEnv("FAIRSWAP_PRODUCTION_FAMILY_REVIEW_VERIFIED","kriuhwppxgxsyyrbjsau");
    expect(isFamilyReviewEnabled()).toBe(true);
    config.value="test";expect(isFamilyReviewEnabled()).toBe(false);
  });
  it("rejects an unsupported or mismatched staff packet",async()=>{
    vi.stubEnv("VERCEL_ENV","preview");
    vi.stubEnv("FAIRSWAP_TEST_FAMILY_REVIEW_VERIFIED","wpppxlnbzqynvhpeuavd");
    const rpc=vi.fn().mockResolvedValueOnce({data:packet,error:null})
      .mockResolvedValueOnce({data:{...packet,fingerprint:"bad"},error:null})
      .mockResolvedValueOnce({data:{...packet,identity:{...packet.identity,id:"66666666-6666-4666-8666-666666666666"}},error:null});
    const client={rpc} as unknown as AdminClient;
    expect((await loadStaffFamilyReviewPacket(client,listingId))?.fingerprint).toBe(packet.fingerprint);
    expect(await loadStaffFamilyReviewPacket(client,listingId)).toBeNull();
    expect(await loadStaffFamilyReviewPacket(client,listingId)).toBeNull();
    expect(rpc).toHaveBeenCalledWith("get_staff_family_review",{listing_id:listingId});
  });
});
