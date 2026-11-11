import { useState } from "react";
import "./BuyerRequirementForm.css";

const LANGUAGES = [
  { value: "en-NG", label: "English" }, { value: "pcm-NG", label: "Nigerian Pidgin" },
  { value: "ha-NG", label: "Hausa" }, { value: "ig-NG", label: "Igbo" }, { value: "yo-NG", label: "Yoruba" },
];
const WORDS = {
  "en-NG": { title: "Tell us what you need", subtitle: "Can't find the product you need?", description: "Submit a buying requirement. Elevoni will look for suitable approved suppliers. This is not an order or confirmed match.", language: "Language", name: "Your name", contact: "Phone or WhatsApp number", product: "Product you need", category: "Category", type: "Product type", quantity: "Quantity (optional)", unit: "Unit (optional)", state: "Delivery state (required)", lga: "LGA / town (optional)", consent: "I agree that Elevoni may share my contact details with a suitable supplier for this request.", submit: "Submit buying requirement", submitting: "Submitting…", success: "Your requirement has been submitted. Elevoni will use it to identify suitable approved suppliers.", error: "We could not submit your request. Please check the details and try again.", freeText: "Describe what you need in your language", extract: "Extract details", extracting: "Extracting…" },
  "pcm-NG": { title: "Tell us wetin you need", subtitle: "You no see the product wey you need?", description: "Send wetin you dey find. Elevoni go look for suitable approved suppliers. This no be order or confirmed match.", language: "Language", name: "Your name", contact: "Phone or WhatsApp number", product: "Product wey you need", category: "Category", type: "Product type", quantity: "Quantity (optional)", unit: "Unit (optional)", state: "Delivery state (required)", lga: "LGA / town (optional)", consent: "I agree make Elevoni share my contact with suitable supplier for this request.", submit: "Submit wetin I dey find", submitting: "E dey submit…", success: "We don receive your request. We go use am find suitable approved suppliers.", error: "We no fit submit your request. Check the details try again.", freeText: "Describe wetin you need for your language", extract: "Extract details", extracting: "E dey extract…" },
  "ha-NG": { title: "Faɗa mana abin da kake buƙata", subtitle: "Ba ka sami kayan da kake nema ba?", description: "Aika buƙatarka. Elevoni za ta nemo masu sayarwa da aka amince da su. Wannan ba oda ba ce ko tabbacin samun kaya.", language: "Harshe", name: "Sunanka", contact: "Lambar waya ko WhatsApp", product: "Kayan da kake buƙata", category: "Rukuni", type: "Nau'in kaya", quantity: "Adadi", unit: "Ma'auni", state: "Jihar isarwa", lga: "Karamar hukuma / gari", consent: "Na yarda Elevoni ta raba bayanan tuntubata da mai kaya da ya dace.", submit: "Aika buƙatar saye", submitting: "Ana aikawa…", success: "An karɓi buƙatarka. Za mu nemo masu kaya da suka dace.", error: "Ba a iya aika buƙatarka ba. Duba bayanan ka sake gwadawa.", freeText: "Bayyana abin da kake buƙata da harshenka", extract: "Ciro bayanai", extracting: "Ana cirewa…" },
  "ig-NG": { title: "Gwa anyị ihe ị chọrọ", subtitle: "Ị hụghị ngwaahịa ị na-achọ?", description: "Zipu ihe ị chọrọ. Elevoni ga-achọ ndị na-ebubata ngwaahịa ndị a kwadoro. Nke a abụghị iwu ịzụta ma ọ bụ nkwenye na ngwaahịa dị.", language: "Asụsụ", name: "Aha gị", contact: "Nọmba ekwentị ma ọ bụ WhatsApp", product: "Ngwaahịa ị chọrọ", category: "Ụdị ngwaahịa", type: "Ụdị kpọmkwem", quantity: "Ọnụọgụ", unit: "Nha", state: "Steeti nnyefe", lga: "LGA / obodo", consent: "Ekwenyere m ka Elevoni kesaa kọntaktị m na onye na-ebubata ngwaahịa kwesịrị ekwesị.", submit: "Zipu arịrịọ ịzụ ahịa", submitting: "A na-eziga…", success: "Anyị anatala arịrịọ gị. Anyị ga-achọ ndị na-ebubata ngwaahịa kwesịrị ekwesị.", error: "Anyị enweghị ike izipu arịrịọ gị. Lelee ozi gị ma nwaa ọzọ.", freeText: "Kọwaa ihe ị chọrọ n'asụsụ gị", extract: "Wepụta nkọwa", extracting: "A na-ewepụta…" },
  "yo-NG": { title: "Sọ ohun tí o nílò fún wa", subtitle: "Ṣé o kò rí ọjà tí o ń wá?", description: "Fi ohun tí o nílò ránṣẹ́. Elevoni yóò wá àwọn olùpèsè tí a fọwọ́ sí. Ìbéèrè yìí kì í ṣe àṣẹ rírà tàbí ìjẹ́rìí pé ọjà wà.", language: "Èdè", name: "Orúkọ rẹ", contact: "Nọ́mbà fóònù tàbí WhatsApp", product: "Ọjà tí o nílò", category: "Ẹ̀ka ọjà", type: "Irú ọjà", quantity: "Iye", unit: "Ẹ̀yà ìwọ̀n", state: "Ìpínlẹ̀ ìfijiṣẹ́", lga: "LGA / ìlú", consent: "Mo gbà kí Elevoni pín àlàyé ìbánisọ̀rọ̀ mi pẹ̀lú olùpèsè tó yẹ.", submit: "Fi ìbéèrè rírà ránṣẹ́", submitting: "Ó ń fi ránṣẹ́…", success: "A ti gba ìbéèrè rẹ. A ó wá àwọn olùpèsè tó yẹ.", error: "A kò lè fi ìbéèrè rẹ ránṣẹ́. Ṣàyẹ̀wò àlàyé rẹ kí o sì tún gbìyànjú.", freeText: "Ṣàlàyé ohun tí o nílò ní èdè rẹ", extract: "Yọ àwọn àlàyé jáde", extracting: "A ń yọ àwọn àlàyé jáde…" },
};
const emptyForm = () => ({ buyerName: "", buyerContact: "", productName: "", quantity: "", unit: "", state: "", lga: "", deliveryArea: "", neededBy: "", maxUnitPrice: "", condition: "", specifications: "", sourceText: "", contactConsent: false });

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
      const response = await fetch(`${url}/api/buyer-requirements`, { method: "POST", headers: { "Content-Type": "application/json", ...(localStorage.getItem("token") ? { token: localStorage.getItem("token") } : {}) }, body: JSON.stringify({ ...form, quantity: form.quantity === "" ? null : Number(form.quantity), maxUnitPrice: form.maxUnitPrice === "" ? null : Number(form.maxUnitPrice), preferredLanguage: language, sourceText: form.specifications || "" }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || t.error);
      setFeedback(t.success); setMatches(result.data?.matches || []); setForm(emptyForm());
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
        {field("buyerName", t.name)} {field("buyerContact", t.contact, "tel")} {field("productName", t.product)}
        {field("quantity", t.quantity, "number")}
        <label className="buyer-demand-field"><span>{t.unit}</span><input value={form.unit} onChange={(event) => update("unit", event.target.value)} placeholder="e.g. kg, bags, crates" /></label>
        {field("state", t.state)} {field("lga", t.lga)}
        <label className="buyer-demand-field buyer-demand-wide"><span>Additional details (optional)</span><textarea rows={3} value={form.specifications} onChange={(event) => update("specifications", event.target.value)} placeholder="e.g. preferred size, variety, quality or delivery timing" /></label>
        <label className="buyer-demand-consent buyer-demand-wide"><input type="checkbox" checked={form.contactConsent} onChange={(event) => update("contactConsent", event.target.checked)} /><span>{t.consent}</span></label>
        {feedback && <p className="buyer-demand-feedback buyer-demand-wide" role="status">{feedback}</p>}
        {matches.length > 0 && <div className="buyer-demand-results buyer-demand-wide"><h3>Products that may fit your request</h3>{matches.map((item) => <article className="buyer-demand-result" key={`${item.source}-${item.id}`}><strong>{item.name}</strong><p>{item.sellerName} · {item.state || "Location not recorded"}{item.lga ? `, ${item.lga}` : ""}</p><p>{item.price ? `₦${item.price.toLocaleString()} / ${item.unit || "unit"}` : "Price needs confirmation"} · {item.stockStatus.replaceAll("_", " ")}</p><p>{item.reasons.join(" · ")}</p></article>)}</div>}
        <button className="buyer-demand-submit" disabled={saving}>{saving ? t.submitting : t.submit}</button>
      </form>
    </section>
  );
}
