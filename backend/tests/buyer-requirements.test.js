import test from "node:test";
import assert from "node:assert/strict";
import { prepareBuyerRequirement, scoreBuyerRequirement, rankRequirementsForVendor } from "../services/buyerRequirements.js";

const base=(overrides={})=>({buyerName:"Ada Buyer",buyerContact:"+2348000000000",productName:"Maize",state:"FCT",preferredLanguage:"en-NG",...overrides});

test("reduced buyer form requires product and delivery state but not category, type, quantity or unit",()=>{
 const result=prepareBuyerRequirement(base()); assert.equal(result.error,undefined); assert.equal(result.requirement.category,""); assert.equal(result.requirement.quantity,null); assert.equal(result.requirement.unit,"");
});
test("delivery state is mandatory",()=>{assert.match(prepareBuyerRequirement(base({state:""})).error,/delivery state|required/i)});
test("quantity is optional but requires a unit when supplied",()=>{
 assert.equal(prepareBuyerRequirement(base({quantity:25})).error,/unit/i);
 const valid=prepareBuyerRequirement(base({quantity:25,unit:"kg"})); assert.equal(valid.error,undefined); assert.equal(valid.requirement.quantity,25);
});
test("invalid quantities and units are rejected",()=>{
 assert.match(prepareBuyerRequirement(base({quantity:0,unit:"kg"})).error,/Quantity/);
 assert.match(prepareBuyerRequirement(base({unit:"basket"})).error,/unit/i);
});
test("location and stock are ranking signals, not product identity gates",()=>{
 const req={productName:"Maize",state:"FCT",lga:"AMAC",quantity:100,unit:"kg",maxUnitPrice:null};
 const product={name:"Maize",unitOfMeasure:"kg",stockQuantity:35,price:400};
 const scored=scoreBuyerRequirement(req,product,{state:"Kaduna",lga:"Zaria"});
 assert.equal(scored.stockStatus,"recorded_insufficient"); assert.equal(scored.stateMatch,false); assert.ok(scored.reasons.some(x=>x.includes("below the requested")));
});
test("vendor dashboard matching still returns exact-name buyer demand when stock is sufficient",()=>{
 const req={_id:"r1",productName:"Maize",state:"FCT",quantity:10,unit:"kg",createdAt:new Date()};
 const product={_id:"p1",name:"Maize",unitOfMeasure:"kg",stockQuantity:20,price:300};
 assert.equal(rankRequirementsForVendor([req],[product],{state:"FCT"}).length,1);
});
