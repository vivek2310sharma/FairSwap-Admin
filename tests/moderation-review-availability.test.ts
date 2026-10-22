import {describe,expect,it} from "vitest";
import {moderationReviewAvailability} from "@/lib/listings/moderation-review-availability";

describe("review availability for stored category metadata",()=>{
  it.each(["goods",null] as const)("retains Goods/legacy review for %s",family=>{
    expect(moderationReviewAvailability({macro_category:family})).toEqual({status:"supported",family});
  });
  it.each(["vehicles","property"] as const)("denies unreleased %s review",family=>{
    expect(moderationReviewAvailability({macro_category:family})).toEqual({status:"not_released",family});
    expect(moderationReviewAvailability([{macro_category:family}])).toEqual({status:"not_released",family});
  });
  it.each([
    null,undefined,[],[{},{}],
    {macro_category:"unsupported"},{macro_category:"Goods"},
    [{macro_category:"goods"},{macro_category:"property"}]
  ])("does not infer Goods from invalid relation %j",value=>{
    expect(moderationReviewAvailability(value)).toEqual({status:"unverified"});
  });
});
