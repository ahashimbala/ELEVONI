import { PRODUCT_UNITS } from "../../shared/categoryConstants.mjs";
import { normalizeLgaName, normalizeStateName } from "./nAtlasCustomerMatching.js";
import Product from "../models/Product.js";
import fishModel from "../models/fishModel.js";
import vendorProfileModel from "../models/vendorProfileModel.js";
import { matchProductsAcrossLanguages } from "./nAtlasCustomer.js";

const text = (value, max = 160) => typeof value === "string" ? value.trim().slice(0, max) : "";
const number = value => value === "" || value === null || value === undefined ? null : Number(value);
const normaliseUnit = value => {
  const raw=text(value,24).toLowerCase().trim();
  const aliases={kilogram:"kg",kilograms:"kg",kilo:"kg",kilos:"kg",grams:"gram",pieces:"piece",crates:"crate",tons:"ton",bags:"bag",cartons:"carton",litres:"litre",liters:"litre",hours:"hour"};
  return aliases[raw] || raw;
};
const normUnit = normaliseUnit;

export function prepareBuyerRequirement(body = {}, { userId = null, now = new Date() } = {}) {
  const buyerName = text(body.buyerName, 120), buyerContact = text(body.buyerContact, 120);
  const productName = text(body.productName, 160), state = text(body.state, 100);
  const quantity = number(body.quantity), unit = normaliseUnit(body.unit), lga = text(body.lga, 100);
  const maxUnitPrice = number(body.maxUnitPrice);
  const preferredLanguage = text(body.preferredLanguage, 10) || "en-NG";
  if (!buyerName || !buyerContact || !productName || !state) return { error: "Buyer name, contact, product and delivery state are required", status: 400 };
  if (quantity !== null && (!Number.isFinite(quantity) || quantity <= 0 || quantity > 1_000_000)) return { error: "Quantity must be a positive number", status: 400 };
  if (unit && !PRODUCT_UNITS.includes(unit)) return { error: "Choose a valid unit of measure", status: 400 };
  if (quantity !== null && !unit) return { error: "Choose a unit when you provide a quantity", status: 400 };
  if (maxUnitPrice !== null && (!Number.isFinite(maxUnitPrice) || maxUnitPrice < 0)) return { error: "Maximum unit price must be a valid non-negative amount", status: 400 };
  if (!["en-NG", "pcm-NG", "ha-NG", "ig-NG", "yo-NG"].includes(preferredLanguage)) return { error: "Choose one of the supported languages", status: 400 };
  let neededBy = null;
  if (body.neededBy) { neededBy = new Date(body.neededBy); if (Number.isNaN(neededBy.getTime()) || neededBy < new Date(now.getTime()-86400000)) return { error: "Required date must be valid and cannot be in the past", status: 400 }; }
  return { requirement: { buyerUserId:userId||null, buyerName, buyerContact, buyerBusinessName:text(body.buyerBusinessName,120), productName,
    category:"", subcategory:"", quantity, unit, state, lga, deliveryArea:text(body.deliveryArea,120), neededBy,
    maxUnitPrice:maxUnitPrice===null?null:maxUnitPrice, condition:text(body.condition,80), specifications:text(body.specifications,1000),
    preferredLanguage, sourceText:text(body.sourceText,1500), contactConsent:body.contactConsent===true, status:"open", matchCount:0 } };
}

export function scoreBuyerRequirement(requirement, product, vendor = {}) {
  const state = vendor.state || vendor.farmAddress?.state || product.originLocation?.state || "";
  const lga = vendor.lga || vendor.farmAddress?.lga || product.originLocation?.lga || "";
  const stateMatch = normalizeStateName(state) === normalizeStateName(requirement.state);
  const lgaMatch = Boolean(requirement.lga && normalizeLgaName(lga) === normalizeLgaName(requirement.lga));
  const stock = Number(product.stockQuantity), stockKnown = Number.isFinite(stock) && stock > 0;
  const sameUnit = Boolean(requirement.unit && normUnit(requirement.unit) === normUnit(product.unitOfMeasure || product.unit));
  const stockStatus = requirement.quantity === null || requirement.quantity === undefined ? (stockKnown?"recorded":"unknown") : !stockKnown?"unknown":!sameUnit?"unit_mismatch":stock>=requirement.quantity?"recorded_sufficient":"recorded_insufficient";
  const price = Number(product.price), withinBudget = requirement.maxUnitPrice === null || !Number.isFinite(price) || price <= requirement.maxUnitPrice;
  const reasons=[]; if(stateMatch) reasons.push("Seller is in the requested delivery state"); else reasons.push(`Seller location is ${state || "not recorded"}; delivery to ${requirement.state} needs confirmation`);
  if(lgaMatch) reasons.push("Seller is in the requested LGA");
  if(stockStatus==="recorded_sufficient") reasons.push("Recorded stock covers the requested quantity");
  else if(stockStatus==="recorded_insufficient") reasons.push(`Recorded stock is ${stock} ${product.unitOfMeasure || product.unit || "units"}, below the requested ${requirement.quantity} ${requirement.unit}`);
  else if(stockStatus==="unknown") reasons.push("Current stock quantity needs confirmation");
  if(stockStatus==="unit_mismatch") reasons.push("The listing unit differs from the requested unit");
  if(requirement.maxUnitPrice!==null && withinBudget) reasons.push("Listed price is within the stated unit budget");
  else if(requirement.maxUnitPrice!==null) reasons.push("Listed price is above the stated unit budget");
  const score=(stateMatch?15:0)+(lgaMatch?8:0)+(stockStatus==="recorded_sufficient"?10:0)+(withinBudget?5:0);
  return {score,reasons,stockStatus,stateMatch,lgaMatch,withinBudget};
}

export function rankRequirementsForVendor(requirements, products, vendor = {}) {
  const matches=[];
  for(const requirement of requirements){
    const productMatches=products.map(product=>({product,...scoreBuyerRequirement(requirement,product,vendor)}))
      .filter(item=>String(item.product.name||"").toLowerCase().includes(String(requirement.productName||"").toLowerCase()) || String(item.product.description||"").toLowerCase().includes(String(requirement.productName||"").toLowerCase()))
      .filter(item=>item.stockStatus!=="recorded_insufficient")
      .sort((a,b)=>b.score-a.score);
    if(productMatches.length) matches.push({requirement,bestProduct:productMatches[0].product,score:productMatches[0].score,reasons:productMatches[0].reasons,stockStatus:productMatches[0].stockStatus});
  }
  return matches.sort((a,b)=>b.score-a.score||new Date(b.requirement.createdAt)-new Date(a.requirement.createdAt));
}

const locationOf = (p) => ({ state:p.vendorId?.state||p.vendorId?.farmAddress?.state||p.originLocation?.state||"", lga:p.vendorId?.lga||p.vendorId?.farmAddress?.lga||p.originLocation?.lga||"" });
const serialize = (p, source, requirement) => {
  const vendor=p.vendorId && typeof p.vendorId==="object"?p.vendorId:{};
  const location=source==="direct"?{state:p.originLocation?.state||"",lga:p.originLocation?.lga||""}:locationOf(p);
  const vendorName=source==="direct"||!p.vendorId?"Elevoni Farms":vendor.businessName||"Approved Marketplace supplier";
  const score=scoreBuyerRequirement(requirement,{...p,unitOfMeasure:p.unitOfMeasure||p.unit,price:p.price},source==="direct"?{}:vendor);
  return { id:String(p._id), name:p.name, description:p.description||"", category:p.category||"", subcategory:p.subcategory||"", price:Number(p.price)||0,
    unit:p.unitOfMeasure||p.unit||"", stockQuantity:p.stockQuantity===null||p.stockQuantity===undefined?null:Number(p.stockQuantity), state:location.state,lga:location.lga,
    sellerName:vendorName,sellerType:source==="direct"||!p.vendorId?"elevoni_direct":"marketplace_vendor", source,
    image:Array.isArray(p.images)?p.images[0]||"":p.image||"", matchScore:score.score, stockStatus:score.stockStatus,
    reasons:score.reasons, availability:p.availability||"Listed as available" };
};

/** Uses the same AI cross-language identity matcher as Elevoni Assistant. Candidate retrieval is broad; location and stock are ranked after identity matching. */
export async function retrieveBuyerRequirementMatches(requirement,{language=requirement.preferredLanguage||"en-NG",timer,abortSignal}={}) {
  const profiles=await vendorProfileModel.find({status:"approved"}).select("_id").lean();
  const approvedIds=profiles.map(p=>p._id);
  const baseMarketplaceFilter={status:"approved",isAvailable:true,availability:{$ne:"Out of stock"},vendorId:{$in:approvedIds}};
  const query=[requirement.productName,requirement.specifications,requirement.condition].filter(Boolean).join(" ");
  const terms=[...new Set(text(requirement.productName,160).toLowerCase().split(/[^a-z0-9]+/).filter(w=>w.length>2))].slice(0,6);
  const lexicalFilter=terms.length?{$or:terms.flatMap(term=>{const rx=new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"i");return [{name:rx},{description:rx},{species:rx},{subcategory:rx}]})}:null;
  const [marketplace,lexicalMarketplace,direct]=await Promise.all([
    approvedIds.length?Product.find(baseMarketplaceFilter)
      .select("name description category subcategory species condition price unitOfMeasure images vendorId originLocation stockQuantity availability isAvailable updatedAt")
      .populate("vendorId","businessName state lga farmAddress status").sort({updatedAt:-1}).limit(250).lean():[],
    approvedIds.length&&lexicalFilter?Product.find({...baseMarketplaceFilter,...lexicalFilter})
      .select("name description category subcategory species condition price unitOfMeasure images vendorId originLocation stockQuantity availability isAvailable updatedAt")
      .populate("vendorId","businessName state lga farmAddress status").sort({updatedAt:-1}).limit(100).lean():[],
    fishModel.find({visible:{$ne:false},vendorId:null}).select("name description price image category pricingMode pricingTiers").limit(100).lean()
  ]);
  const [marketMatches,directMatches]=await Promise.all([
    matchProductsAcrossLanguages({query,candidates:marketplace,language,abortSignal,timer,purpose:"buyer requirement matching against approved Marketplace listings"}),
    matchProductsAcrossLanguages({query,candidates:direct,language,abortSignal,timer,purpose:"buyer requirement matching against Elevoni Direct catalogue"})
  ]);
  const mergeById=(items)=>[...new Map(items.filter(Boolean).map(item=>[String(item._id),item])).values()];
  const marketplaceResults=mergeById([...lexicalMarketplace,...marketMatches]);
  const directLexical=direct.filter(item=>terms.some(term=>`${item.name||""} ${item.description||""} ${item.category||""}`.toLowerCase().includes(term)));
  const directResults=mergeById([...directLexical,...directMatches]);
  const rows=[...marketplaceResults.map(p=>serialize(p,"marketplace",requirement)),...directResults.map(p=>serialize({...p,unitOfMeasure:"kg",stockQuantity:null,originLocation:{state:"",lga:""}},"direct",requirement))];
  return rows.sort((a,b)=>b.matchScore-a.matchScore).slice(0,12);
}
