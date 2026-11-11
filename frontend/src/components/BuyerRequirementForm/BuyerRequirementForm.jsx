import { useState } from "react";
import { PRODUCT_UNITS } from "../../../../shared/categoryConstants.mjs";
import "./BuyerRequirementForm.css";

const LANGUAGES = [
  { value: "en-NG", label: "English" }, { value: "pcm-NG", label: "Nigerian Pidgin" },
  { value: "ha-NG", label: "Hausa" }, { value: "ig-NG", label: "Igbo" }, { value: "yo-NG", label: "Yoruba" },
];
const WORDS = {
  "en-NG": { title: "Tell us what you need", subtitle: "What product are you looking for?", description: "Enter the product name. You can add quantity and delivery location, but you don't need to choose a category or product type. Elevoni will search its approved catalogue and rank relevant listings.", name: "Your name", contact: "Phone or WhatsApp number", product: "Product name", quantity: "Quantity (optional)", unit: "Unit (optional)", state: "Delivery state (optional)", lga: "LGA / town (optional)", extra: "Additional details (optional)", consent: "I agree that Elevoni may share my contact details with a suitable supplier for this request.", submit: "Find matching products", submitting: "Searching the catalogue…", success: "Your request has been saved.", error: "We could not submit your request. Please check the details and try again.", language: "Language", matches: "Products that may match your request", noMatches: "No relevant approved listings were found in the catalogue right now. Your request has been saved, but this is not a confirmed supply offer.", warning: "Your request was saved, but matching could not complete just now. Please try again shortly.", score: "Match", stock: "Recorded stock", unknown: "Not recorded", direct: "Elevoni Farms", vendor: "Marketplace supplier", differences: "What to check", matched: "Why it matches", price: "Listed price" },
  "pcm-NG": { title: "Tell us wetin you need", subtitle: "Which product you dey find?", description: "Enter the product name. You fit add quantity and delivery location, but you no need choose category or product type. Elevoni go search approved listings.", name: "Your name", contact: "Phone or WhatsApp number", product: "Product name", quantity: "Quantity (optional)", unit: "Unit (optional)", state: "Delivery state (optional)", lga: "LGA / town (optional)", extra: "Extra details (optional)", consent: "I agree make Elevoni share my contact with suitable supplier for this request.", submit: "Find matching products", submitting: "We dey search catalogue…", success: "We don save your request.", error: "We no fit submit your request. Check the details try again.", language: "Language", matches: "Products wey fit match your request", noMatches: "We no find relevant approved listing for catalogue now. We don save your request, but supply never confirm.", warning: "We don save your request, but matching no complete now. Try again shortly.", score: "Match", stock: "Recorded stock", unknown: "No record", direct: "Elevoni Farms", vendor: "Marketplace supplier", differences: "Wetin to confirm", matched: "Why e match", price: "Listed price" },
  "ha-NG": { title: "Faɗa mana abin da kake buƙata", subtitle: "Wane kaya kake nema?", description: "Shigar da sunan kayan. Za ka iya ƙara adadi da wurin isarwa, amma ba sai ka zaɓi rukuni ko nau'in kaya ba.", name: "Sunanka", contact: "Lambar waya ko WhatsApp", product: "Sunan kaya", quantity: "Adadi (na zaɓi)", unit: "Ma'auni (na zaɓi)", state: "Jihar isarwa (na zaɓi)", lga: "LGA / gari (na zaɓi)", extra: "Ƙarin bayani (na zaɓi)", consent: "Na yarda Elevoni ta raba bayanan tuntubata da mai kaya da ya dace.", submit: "Nemo kaya masu dacewa", submitting: "Ana binciken kaya…", success: "An adana buƙatarka.", error: "Ba a iya aika buƙatarka ba. Duba bayananka.", language: "Harshe", matches: "Kayan da za su iya dacewa da buƙatarka", noMatches: "Ba a sami kaya da suka dace a yanzu ba. An adana buƙatarka amma ba a tabbatar da kaya ba.", warning: "An adana buƙatarka amma binciken bai kammala ba. Sake gwadawa.", score: "Dacewa", stock: "Adadin da aka rubuta", unknown: "Ba a rubuta ba", direct: "Elevoni Farms", vendor: "Mai kaya a kasuwa", differences: "Abin dubawa", matched: "Dalilin dacewa", price: "Farashin da aka rubuta" },
  "ig-NG": { title: "Gwa anyị ihe ị chọrọ", subtitle: "Kedu ngwaahịa ị na-achọ?", description: "Tinye aha ngwaahịa ahụ. Ị nwere ike itinye ọnụọgụ na ebe nnyefe, mana ị gaghị ahọrọ ngalaba ma ọ bụ ụdị ngwaahịa.", name: "Aha gị", contact: "Nọmba ekwentị ma ọ bụ WhatsApp", product: "Aha ngwaahịa", quantity: "Ọnụọgụ (nhọrọ)", unit: "Nha (nhọrọ)", state: "Steeti nnyefe (nhọrọ)", lga: "LGA / obodo (nhọrọ)", extra: "Nkọwa ọzọ (nhọrọ)", consent: "Ekwenyere m ka Elevoni kesaa kọntaktị m na onye na-ebubata ngwaahịa kwesịrị ekwesị.", submit: "Chọta ngwaahịa dabara", submitting: "A na-enyocha ngwaahịa…", success: "Echekwara arịrịọ gị.", error: "Anyị enweghị ike izipu arịrịọ gị. Lelee nkọwa gị.", language: "Asụsụ", matches: "Ngwaahịa nwere ike dabara na arịrịọ gị", noMatches: "Ahụghị ngwaahịa akwadoro dabara ugbu a. Echekwara arịrịọ gị mana ekwenyeghị na ngwaahịa dị.", warning: "Echekwara arịrịọ gị mana nyocha akwụsịghị. Nwaa ọzọ.", score: "Dabara", stock: "Ngwaahịa e dekọrọ", unknown: "Edeghị ya", direct: "Elevoni Farms", vendor: "Onye na-ere ahịa", differences: "Ihe a ga-enyocha", matched: "Ihe kpatara o ji daba", price: "Ọnụahịa e depụtara" },
  "yo-NG": { title: "Sọ ohun tí o nílò fún wa", subtitle: "Ọjà wo lo ń wá?", description: "Tẹ orúkọ ọjà náà. O lè fi iye àti ibi ìfijiṣẹ́ kún un, ṣùgbọ́n o kò nílò láti yan ẹ̀ka ọjà tàbí irú ọjà.", name: "Orúkọ rẹ", contact: "Nọ́mbà fóònù tàbí WhatsApp", product: "Orúkọ ọjà", quantity: "Iye (àṣàyàn)", unit: "Ẹ̀yà ìwọ̀n (àṣàyàn)", state: "Ìpínlẹ̀ ìfijiṣẹ́ (àṣàyàn)", lga: "LGA / ìlú (àṣàyàn)", extra: "Àlàyé míì (àṣàyàn)", consent: "Mo gbà kí Elevoni pín àlàyé ìbánisọ̀rọ̀ mi pẹ̀lú olùpèsè tó yẹ.", submit: "Wá àwọn ọjà tó bá mu", submitting: "A ń wá ọjà…", success: "A ti fi ìbéèrè rẹ pamọ́.", error: "A kò lè fi ìbéèrè rẹ ránṣẹ́. Ṣàyẹ̀wò àlàyé rẹ.", language: "Èdè", matches: "Àwọn ọjà tó lè bá ìbéèrè rẹ mu", noMatches: "A kò rí ọjà tí a fọwọ́ sí tó bá mu báyìí. A ti fi ìbéèrè rẹ pamọ́, ṣùgbọ́n a kò tíì fìdí ọjà múlẹ̀.", warning: "A ti fi ìbéèrè rẹ pamọ́ ṣùgbọ́n ìwá kiri kò parí. Gbìyànjú lẹ́ẹ̀kan sí i.", score: "Bá mu", stock: "Iye tí a kọ sílẹ̀", unknown: "A kò kọ ọ sílẹ̀", direct: "Elevoni Farms", vendor: "Olùpèsè ọjà", differences: "Ohun láti ṣàyẹ̀wò", matched: "Ìdí tí ó fi bá mu", price: "Iye owó tí a kọ sílẹ̀" },
};
const initialForm = { buyerName: "", buyerContact: "", productName: "", quantity: "", unit: "", state: "", lga: "", specifications: "", contactConsent: false };
const money = value => Number.isFinite(Number(value)) ? `₦${Number(value).toLocaleString("en-NG")}` : "Price not recorded";

export default function BuyerRequirementForm({ url }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem("elevoni-assistant-customer-language") || localStorage.getItem("elevoni-language");
    return LANGUAGES.some(item => item.value === saved) ? saved : "en-NG";
  });
  const t = WORDS[language] || WORDS["en-NG"];
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [matches, setMatches] = useState([]);
  const update = (key, value) => setForm(old => ({ ...old, [key]: value }));
  const submit = async event => {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setFeedback(""); setMatches([]);
    try {
      const response = await fetch(`${url}/api/buyer-requirements`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(localStorage.getItem("token") ? { token: localStorage.getItem("token") } : {}) },
        body: JSON.stringify({ ...form, quantity: form.quantity === "" ? null : Number(form.quantity), preferredLanguage: language })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || t.error);
      setMatches(result.data?.matches || []);
      setFeedback(result.data?.matchingWarning || (result.data?.matches?.length ? t.success : t.noMatches));
      setForm(initialForm);
    } catch (error) { setFeedback(error.message || t.error); }
    finally { setSaving(false); }
  };
  return (
    <section id="buyer-demand" className="buyer-demand">
      <div className="buyer-demand-heading">
        <div><p className="marketplace-eyebrow">{t.title}</p><h2>{t.subtitle}</h2><p>{t.description}</p></div>
        <label className="buyer-demand-language"><span>{t.language}</span><select value={language} onChange={event => { setLanguage(event.target.value); localStorage.setItem("elevoni-language", event.target.value); localStorage.setItem("elevoni-assistant-customer-language", event.target.value); }}>{LANGUAGES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      </div>
      <form className="buyer-demand-form" onSubmit={submit}>
        <label className="buyer-demand-field"><span>{t.name}</span><input value={form.buyerName} onChange={event => update("buyerName", event.target.value)} required /></label>
        <label className="buyer-demand-field"><span>{t.contact}</span><input type="tel" value={form.buyerContact} onChange={event => update("buyerContact", event.target.value)} required /></label>
        <label className="buyer-demand-field"><span>{t.product}</span><input value={form.productName} onChange={event => update("productName", event.target.value)} placeholder="e.g. maize, broiler chickens, smoked catfish" required maxLength={160} /></label>
        <label className="buyer-demand-field"><span>{t.quantity}</span><input type="number" min="0.001" step="any" value={form.quantity} onChange={event => update("quantity", event.target.value)} /></label>
        <label className="buyer-demand-field"><span>{t.unit}</span><select value={form.unit} onChange={event => update("unit", event.target.value)}><option value="">—</option>{PRODUCT_UNITS.map(item => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="buyer-demand-field"><span>{t.state}</span><input value={form.state} onChange={event => update("state", event.target.value)} placeholder="e.g. FCT Abuja" /></label>
        <label className="buyer-demand-field"><span>{t.lga}</span><input value={form.lga} onChange={event => update("lga", event.target.value)} /></label>
        <label className="buyer-demand-field buyer-demand-wide"><span>{t.extra}</span><textarea rows={2} value={form.specifications} onChange={event => update("specifications", event.target.value)} /></label>
        <label className="buyer-demand-consent buyer-demand-wide"><input type="checkbox" checked={form.contactConsent} onChange={event => update("contactConsent", event.target.checked)} /><span>{t.consent}</span></label>
        {feedback && <p className="buyer-demand-feedback buyer-demand-wide" role="status">{feedback}</p>}
        <button className="buyer-demand-submit" disabled={saving}>{saving ? t.submitting : t.submit}</button>
      </form>
      {matches.length > 0 && <div className="buyer-demand-results">
        <h3>{t.matches}</h3>
        <div className="buyer-demand-results-grid">{matches.map(item => <article className="buyer-demand-result" key={item.productId}>
          {item.images?.[0] && <img src={item.images[0]} alt={item.name} loading="lazy" />}
          <div className="buyer-demand-result-body">
            <div className="buyer-demand-result-top"><strong>{item.name}</strong><span>{item.matchScore}% {t.score}</span></div>
            <p className="buyer-demand-seller">{item.sellerType === "elevoni_direct" ? t.direct : item.sellerName || t.vendor}</p>
            <p>{item.matchExplanation}</p>
            <p><strong>{t.price}:</strong> {money(item.price)} / {item.unit || "unit not specified"}</p>
            <p><strong>{t.stock}:</strong> {item.stockQuantity == null ? t.unknown : `${item.stockQuantity} ${item.unit}` } · {item.availability}</p>
            {(item.matchedFactors?.length > 0) && <div><strong>{t.matched}:</strong><ul>{item.matchedFactors.map((reason, index) => <li key={index}>{reason}</li>)}</ul></div>}
            {(item.differences?.length > 0) && <div><strong>{t.differences}:</strong><ul>{item.differences.map((reason, index) => <li key={index}>{reason}</li>)}</ul></div>}
            <p className="buyer-demand-result-location">{[item.lga, item.state].filter(Boolean).join(", ") || "Supplier location not recorded"}</p>
          </div>
        </article>)}</div>
      </div>}
    </section>
  );
}
