import { useState } from "react";
import { Link } from "react-router-dom";
import { PRODUCT_UNITS } from "../../../../shared/categoryConstants.mjs";
import { formatNaira, marketplaceEnquiryUrl } from "../../utils/marketplace";
import { ELEVONI_SMOKED_CATFISH_WHATSAPP_PHONE } from "../../config/contact.js";
import { resolveApiBaseUrl } from "../../utils/apiBase";
import "./BuyerRequirementForm.css";

const API = resolveApiBaseUrl();
const LANGUAGES = [
  { value: "en-NG", label: "English" }, { value: "pcm-NG", label: "Nigerian Pidgin" },
  { value: "ha-NG", label: "Hausa" }, { value: "ig-NG", label: "Igbo" }, { value: "yo-NG", label: "Yoruba" },
];
const WORDS = {
  "en-NG": { title: "Tell us what you need", subtitle: "Can't find the product you need?", description: "Submit a buying requirement. Elevoni will look for suitable approved suppliers. This is not an order or confirmed match.", language: "Language", name: "Your name", contact: "Phone or WhatsApp number", product: "Product you need", quantity: "Quantity (optional)", unit: "Unit (optional)", state: "Delivery state", lga: "LGA / town (optional)", consent: "I agree that Elevoni may share my contact details with a suitable supplier for this request.", submit: "Find matching products", submitting: "Searching…", success: "Your requirement has been submitted. Review the listings that may fit your request.", error: "We could not submit your request. Please check the details and try again." },
  "pcm-NG": { title: "Tell us wetin you need", subtitle: "You no see the product wey you need?", description: "Send wetin you dey find. Elevoni go look for suitable approved suppliers. This no be order or confirmed match.", language: "Language", name: "Your name", contact: "Phone or WhatsApp number", product: "Product wey you need", quantity: "Quantity (optional)", unit: "Unit (optional)", state: "Delivery state", lga: "LGA / town (optional)", consent: "I agree make Elevoni share my contact with suitable supplier for this request.", submit: "Find matching products", submitting: "E dey search…", success: "We don receive your request. Check the listings wey fit your request.", error: "We no fit submit your request. Check the details try again." },
  "ha-NG": { title: "Faɗa mana abin da kake buƙata", subtitle: "Ba ka sami kayan da kake nema ba?", description: "Aika buƙatarka. Elevoni za ta nemo masu sayarwa da aka amince da su. Wannan ba oda ba ce ko tabbacin samun kaya.", language: "Harshe", name: "Sunanka", contact: "Lambar waya ko WhatsApp", product: "Kayan da kake buƙata", quantity: "Adadi (zaɓi ne)", unit: "Ma'auni (zaɓi ne)", state: "Jihar isarwa", lga: "Karamar hukuma / gari (zaɓi ne)", consent: "Na yarda Elevoni ta raba bayanan tuntubata da mai kaya da ya dace.", submit: "Nemo kayan da suka dace", submitting: "Ana nema…", success: "An karɓi buƙatarka. Duba kayayyakin da suka dace.", error: "Ba a iya aika buƙatarka ba. Duba bayanan ka sake gwadawa." },
  "ig-NG": { title: "Gwa anyị ihe ị chọrọ", subtitle: "Ị hụghị ngwaahịa ị na-achọ?", description: "Zipu ihe ị chọrọ. Elevoni ga-achọ ndị na-ebubata ngwaahịa ndị a kwadoro. Nke a abụghị iwu ịzụta ma ọ bụ nkwenye na ngwaahịa dị.", language: "Asụsụ", name: "Aha gị", contact: "Nọmba ekwentị ma ọ bụ WhatsApp", product: "Ngwaahịa ị chọrọ", quantity: "Ọnụọgụ (nhọrọ)", unit: "Nha (nhọrọ)", state: "Steeti nnyefe", lga: "LGA / obodo (nhọrọ)", consent: "Ekwenyere m ka Elevoni kesaa kọntaktị m na onye na-ebubata ngwaahịa kwesịrị ekwesị.", submit: "Chọta ngwaahịa dabara", submitting: "A na-achọ…", success: "Anyị anatala arịrịọ gị. Lelee ngwaahịa ndị dabara.", error: "Anyị enweghị ike izipu arịrịọ gị. Lelee ozi gị ma nwaa ọzọ." },
  "yo-NG": { title: "Sọ ohun tí o nílò fún wa", subtitle: "Ṣé o kò rí ọjà tí o ń wá?", description: "Fi ohun tí o nílò ránṣẹ́. Elevoni yóò wá àwọn olùpèsè tí a fọwọ́ sí. Ìbéèrè yìí kì í ṣe àṣẹ rírà tàbí ìjẹ́rìí pé ọjà wà.", language: "Èdè", name: "Orúkọ rẹ", contact: "Nọ́mbà fóònù tàbí WhatsApp", product: "Ọjà tí o nílò", quantity: "Iye (àṣàyàn)", unit: "Ẹ̀yà ìwọ̀n (àṣàyàn)", state: "Ìpínlẹ̀ ìfijiṣẹ́", lga: "LGA / ìlú (àṣàyàn)", consent: "Mo gbà kí Elevoni pín àlàyé ìbánisọ̀rọ̀ mi pẹ̀lú olùpèsè tó yẹ.", submit: "Wá àwọn ọjà tó bá mu", submitting: "Ó ń wá…", success: "A ti gba ìbéèrè rẹ. Wo àwọn ọjà tó lè bá a mu.", error: "A kò lè fi ìbéèrè rẹ ránṣẹ́. Ṣàyẹ̀wò àlàyé rẹ kí o sì tún gbìyànjú." },
};
const emptyForm = () => ({ buyerName: "", buyerContact: "", productName: "", quantity: "", unit: "", state: "", lga: "", specifications: "", contactConsent: false });

function AssistantStyleListingCard({ listing }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageSrc = !listing.image ? "" : /^https?:\/\//i.test(listing.image)
    ? listing.image
    : listing.image.startsWith("/") ? `${API}${listing.image}` : `${API}/images/${listing.image}`;
  const isDirect = listing.source === "direct";
  const enquiryUrl = isDirect
    ? `https://wa.me/${ELEVONI_SMOKED_CATFISH_WHATSAPP_PHONE}?text=${encodeURIComponent(`Hello Elevoni Farms, I would like to enquire about ${listing.name}. Please confirm current availability and delivery arrangements.`)}`
    : marketplaceEnquiryUrl({ name: listing.name, vendorId: { businessName: listing.vendorName } });
  return (
    <article className="elevoni-assistant-listing">
      {imageSrc && !imageFailed ? <img src={imageSrc} alt={listing.name} loading="lazy" onError={() => setImageFailed(true)} /> : <div className="elevoni-assistant-listing-placeholder" aria-hidden="true">E</div>}
      <div className="elevoni-assistant-listing-content">
        <strong>{listing.name}</strong>
        <span className={`elevoni-assistant-source ${isDirect ? "direct" : "marketplace"}`}>{isDirect ? "Elevoni Direct" : "Marketplace listing"}</span>
        <span className="elevoni-assistant-listing-price">{listing.price > 0 ? formatNaira(listing.price) : "Price needs confirmation"} / {listing.unit || "unit"}</span>
        <span className="elevoni-assistant-listing-vendor">{listing.vendorName || "Approved Elevoni vendor"}</span>
        <span className="elevoni-assistant-listing-location">{[listing.lga, listing.state].filter(Boolean).join(", ") || "Location not provided"}</span>
        {listing.availability && <span className="elevoni-assistant-listing-location">{listing.availability}</span>}
        {listing.matchReasons?.length > 0 && <small className="elevoni-assistant-stock-note">Matched on: {listing.matchReasons.join(", ")}</small>}
        {listing.stockMatch === "sufficient" && <small className="elevoni-assistant-stock-note">Recorded stock meets the requested quantity</small>}
        {listing.stockMatch === "partial" && <small className="elevoni-assistant-stock-note">Recorded stock is below the requested quantity</small>}
        {listing.stockMatch === "not_confirmed" && <small className="elevoni-assistant-stock-note">Confirm current stock with the seller</small>}
        <div className="elevoni-assistant-listing-actions">
          <Link to={`/product/${listing.id}`}>{isDirect ? "View product" : "View listing"} <span aria-hidden="true">→</span></Link>
          <a href={enquiryUrl} target="_blank" rel="noreferrer">{isDirect ? "Enquire with Elevoni" : "Enquire with seller"}</a>
        </div>
      </div>
    </article>
  );
}

export default function BuyerRequirementForm({ url }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem("elevoni-assistant-customer-language") || localStorage.getItem("elevoni-language");
    return LANGUAGES.some((item) => item.value === saved) ? saved : "en-NG";
  });
  const t = WORDS[language] || WORDS["en-NG"];
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [matches, setMatches] = useState([]);
  const update = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  const field = (key, label, type = "text") => (
    <label className="buyer-demand-field" key={key}>
      <span>{label}</span>
      <input type={type} value={form[key]} onChange={(event) => update(key, event.target.value)} required={["buyerName", "buyerContact", "productName", "state"].includes(key)} min={type === "number" ? "0.001" : undefined} step={type === "number" ? "any" : undefined} />
    </label>
  );
  const submit = async (event) => {
    event.preventDefault(); if (saving) return;
    setSaving(true); setFeedback(""); setMatches([]);
    try {
      const response = await fetch(`${url}/api/buyer-requirements`, { method: "POST", headers: { "Content-Type": "application/json", ...(localStorage.getItem("token") ? { token: localStorage.getItem("token") } : {}) }, body: JSON.stringify({ ...form, quantity: form.quantity === "" ? null : Number(form.quantity), unit: form.unit || "", preferredLanguage: language, sourceText: form.specifications || "" }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || t.error);
      const rows = Array.isArray(result.data?.matches) ? result.data.matches : [];
      setMatches(rows.map((item) => ({
        ...item,
        source: item.source === "direct" || item.sellerType === "elevoni_direct" ? "direct" : "marketplace",
        vendorName: item.sellerName || item.vendorName || "Approved Elevoni vendor",
        matchReasons: item.matchReasons || item.reasons || [],
        stockMatch: item.stockMatch || (item.stockStatus === "recorded_sufficient" ? "sufficient" : item.stockStatus === "recorded_insufficient" ? "partial" : "not_confirmed"),
        availability: item.availability || "Listed as available",
      })));
      setFeedback(rows.length ? "Here are the listings that may fit your request." : "Your request was submitted, but no suitable listings were found. You can try a different product name or contact Elevoni.");
      setForm(emptyForm());
    } catch (error) { setFeedback(error.message || t.error); }
    finally { setSaving(false); }
  };
  return (
    <section id="buyer-demand" className="buyer-demand">
      <div className="buyer-demand-heading">
        <div><p className="marketplace-eyebrow">{t.title}</p><h2>{t.subtitle}</h2><p>{t.description}</p></div>
        <label className="buyer-demand-language"><span>{t.language}</span><select value={language} onChange={(event) => { setLanguage(event.target.value); localStorage.setItem("elevoni-language", event.target.value); localStorage.setItem("elevoni-assistant-customer-language", event.target.value); }}>{LANGUAGES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      </div>
      <form className="buyer-demand-form" onSubmit={submit}>
        {field("buyerName", t.name)}
        {field("buyerContact", t.contact, "tel")}
        {field("productName", t.product)}
        {field("state", t.state)}
        <div className="buyer-demand-optional buyer-demand-wide"><p>Optional details</p><div className="buyer-demand-optional-grid">
          {field("quantity", t.quantity, "number")}
          <label className="buyer-demand-field"><span>{t.unit}</span><select value={form.unit} onChange={(event) => update("unit", event.target.value)}><option value="">Select a unit</option>{PRODUCT_UNITS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          {field("lga", t.lga)}
          <label className="buyer-demand-field buyer-demand-extra"><span>Additional details (optional)</span><textarea rows={3} value={form.specifications} onChange={(event) => update("specifications", event.target.value)} placeholder="e.g. preferred size, variety, quality or delivery timing" /></label>
        </div></div>
        <label className="buyer-demand-consent buyer-demand-wide"><input type="checkbox" checked={form.contactConsent} onChange={(event) => update("contactConsent", event.target.checked)} /><span>{t.consent}</span></label>
        {feedback && <p className="buyer-demand-feedback buyer-demand-wide" role="status">{feedback}</p>}
        {matches.length > 0 && <div className="buyer-demand-results buyer-demand-wide"><h3>Listings found</h3>{matches.map((item) => <AssistantStyleListingCard key={`${item.source}-${item.id}`} listing={item} />)}</div>}
        <button className="buyer-demand-submit" disabled={saving}>{saving ? t.submitting : t.submit}</button>
      </form>
    </section>
  );
}
