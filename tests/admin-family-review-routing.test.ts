import {beforeEach,expect,it,vi} from "vitest";
vi.mock("server-only",()=>({}));
const shared=vi.hoisted(()=>({allowed:true,packet:null as unknown,approved:true}));
vi.mock("@/lib/auth/guard",()=>({staffAccess:async()=>({allowed:shared.allowed,userId:"11111111-1111-4111-8111-111111111111",role:"moderator",aal:"aal2"})}));
vi.mock("@/lib/auth/inputs",()=>({sameOriginMutation:()=>true}));
vi.mock("@/lib/admin/release-policy",()=>({releaseAllows:()=>true}));
vi.mock("@/lib/listings/family-review-server",()=>({
 isFamilyReviewEnabled:()=>shared.approved,
 loadStaffFamilyReviewPacket:async()=>shared.packet,
}));
import {adminMutation} from "@/lib/admin/mutations";
import type {AdminClient} from "@/lib/supabase/client";

const seller="22222222-2222-4222-8222-222222222222";
const listing="33333333-3333-4333-8333-333333333333";
const fingerprint="a".repeat(64);
const base={operation:"moderate",listingId:listing,action:"approve",revision:3,status:"pending_review",reviewFingerprint:fingerprint};
const packet={identity:{id:listing,revision:3,status:"pending_review"},fingerprint};
function fixture(){
 let reads=0;
 const rpc=vi.fn(async (name:string)=>({
    data:name==="moderate_family_reviewed"?{success:true,status:"active"}:null,error:null,
 }));
 const from=vi.fn(()=>({
   select:()=>({eq:()=>({maybeSingle:async()=>{
     reads++;
     return {data:reads===1?
       {id:listing,seller_id:seller,status:"pending_review",revision:3,categories:{macro_category:"property"}}:
       {id:listing,status:"active"},error:null};
   }})})
 }));
 const client={rpc,from} as unknown as AdminClient;
 return {rpc,from,client,factory:async()=>client};
}
beforeEach(()=>{vi.clearAllMocks();shared.allowed=true;shared.approved=true;shared.packet={...packet};});
it("only sends approved family fingerprint to the dedicated backend moderation RPC",async()=>{
 const f=fixture();
 expect(await adminMutation(base,"https://test.fairswap.in","test.fairswap.in",f.factory)).toMatchObject({success:true});
 expect(f.rpc).toHaveBeenCalledWith("moderate_family_reviewed",{
   listing_id:listing,action:"approve",reason:null,expected_revision:3,expected_fingerprint:fingerprint,
 });
 expect(f.rpc).not.toHaveBeenCalledWith("moderate_listing_reviewed",expect.anything());
});
it("refuses stale or unapproved review evidence before mutation",async()=>{
 for(const state of [{approved:false,packet},{approved:true,packet:{...packet,fingerprint:"b".repeat(64)}},{approved:true,packet:null}]){
   shared.approved=state.approved;shared.packet=state.packet;
   const f=fixture();const r=await adminMutation(base,"https://test.fairswap.in","test.fairswap.in",f.factory);
   expect(r.success).not.toBe(true);
   expect(f.rpc).not.toHaveBeenCalledWith("moderate_family_reviewed",expect.anything());
 }
});
it("rejects unauthorized reviewer and invalid fingerprint prior to any mutations",async()=>{
 const f=fixture();shared.allowed=false;
 expect((await adminMutation(base,"https://test.fairswap.in","test.fairswap.in",f.factory)).error).toBeDefined();
 expect(f.rpc).not.toHaveBeenCalled();
 const f2=fixture();
 expect((await adminMutation({...base,reviewFingerprint:"short"},"https://test.fairswap.in","test.fairswap.in",f2.factory)).error).toBeDefined();
 expect(f2.from).not.toHaveBeenCalled();
});
