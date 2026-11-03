import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./NAtlas.css";

const LANGUAGES = [
  { code: "en-NG", label: "English", greeting: "Hello. What are you working on today?", placeholder: "Ask N-ATLAS anything about your farm or marketplace…" },
  { code: "pcm-NG", label: "Nigerian Pidgin", greeting: "How far! Wetin you wan do today?", placeholder: "Talk to N-ATLAS about your farm or market…" },
  { code: "ha-NG", label: "Hausa", greeting: "Sannu. Me kake son yi a yau?", placeholder: "Yi magana da N-ATLAS game da gonarka…" },
  { code: "ig-NG", label: "Igbo", greeting: "Ndewo. Kedu ihe ị chọrọ ime taa?", placeholder: "Gwa N-ATLAS gbasara ugbo gị…" },
  { code: "yo-NG", label: "Yorùbá", greeting: "Ẹ káàbọ̀. Kí ni o fẹ́ ṣe lónìí?", placeholder: "Bá N-ATLAS sọ̀rọ̀ nípa oko rẹ…" },
];
const suggestions = [
  { icon: "＋", title: "Prepare a product listing", detail: "Turn your product details into a draft" },
  { icon: "⌕", title: "Find products on Elevoni", detail: "Explore what buyers can discover" },
  { icon: "▤", title: "Understand my sales records", detail: "Learn from sales you have recorded" },
];
const SpeechRecognition = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

export default function NAtlas() {
  const [language, setLanguage] = useState(() => localStorage.getItem("natlas-language") || "en-NG");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState(null);
  const [notice, setNotice] = useState("");
  const recognitionRef = useRef(null);
  const bottomRef = useRef(null);
  const activeLanguage = useMemo(() => LANGUAGES.find((item) => item.code === language) || LANGUAGES[0], [language]);

  useEffect(() => { localStorage.setItem("natlas-language", language); }, [language]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, busy, draft]);

  const speak = (text) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    setNotice("");
    if (!SpeechRecognition) {
      setNotice("Voice input is not available in this browser. You can still type your request.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onstart = () => setListening(true);
    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) transcript += event.results[i][0].transcript;
      setInput(transcript);
    };
    recognition.onerror = (event) => setNotice(event.error === "not-allowed" ? "Microphone permission was denied. Allow microphone access in your browser settings." : `Voice input stopped (${event.error}). You can type instead.`);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => { recognitionRef.current?.stop(); setListening(false); };

  const makeDraft = (text) => {
    const quantityMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(bags?|kg|kilograms?|crates?|tons?|pieces?)/i);
    const priceMatch = text.match(/(?:₦|naira|at)\s?([\d,]+)(?:\s?(?:per|\/)\s?(kg|bag|crate|ton))?/i);
    const known = [
      ["maize", "Grains & Cereals", "Food Crops"], ["rice", "Grains & Cereals", "Food Crops"], ["beans", "Grains & Cereals", "Food Crops"],
      ["yam", "Tubers & Starch", "Food Crops"], ["cassava", "Tubers & Starch", "Food Crops"], ["tomato", "Vegetables & Fruits", "Food Crops"],
      ["pepper", "Vegetables & Fruits", "Food Crops"], ["cattle", "Cattle", "Livestock & Meat"], ["goat", "Goats", "Livestock & Meat"],
      ["sheep", "Sheep", "Livestock & Meat"], ["poultry", "Poultry", "Poultry & Eggs"], ["chicken", "Poultry", "Poultry & Eggs"],
      ["catfish", "Catfish", "Catfish & Aquaculture"], ["tilapia", "Tilapia", "Catfish & Aquaculture"],
    ];
    const match = known.find(([word]) => text.toLowerCase().includes(word));
    const unit = quantityMatch?.[2]?.toLowerCase().startsWith("bag") ? "bag" : quantityMatch?.[2]?.toLowerCase().startsWith("crate") ? "crate" : quantityMatch?.[2]?.toLowerCase().startsWith("ton") ? "ton" : quantityMatch?.[2]?.toLowerCase().startsWith("piece") ? "piece" : "kg";
    return {
      name: match ? match[0][0].toUpperCase() + match[0].slice(1) : "",
      category: match?.[2] || "",
      subcategory: match?.[1] || "",
      quantity: quantityMatch ? quantityMatch[1].replace(",", ".") : "",
      unit,
      price: priceMatch ? priceMatch[1].replace(/,/g, "") : "",
      sourceText: text,
    };
  };

  const respond = (text) => {
    const lower = text.toLowerCase();
    if (/(list|sell|available|have|stock|bags?|kg|maize|rice|beans|yam|cassava|tomato|pepper|goat|cattle|sheep|chicken|poultry|catfish|tilapia)/i.test(lower)) {
      const nextDraft = makeDraft(text);
      setDraft(nextDraft);
      const missing = [];
      if (!nextDraft.name) missing.push("the product name");
      if (!nextDraft.quantity) missing.push("the quantity and unit");
      if (!nextDraft.price) missing.push("your asking price");
      const answer = missing.length
        ? `I can help prepare that listing. I have started a draft${nextDraft.name ? ` for ${nextDraft.name}` : ""}. I still need ${missing.join(", ")}. You can complete the details in the draft panel.`
        : `I've prepared a draft for ${nextDraft.quantity} ${nextDraft.unit} of ${nextDraft.name} at ₦${Number(nextDraft.price).toLocaleString("en-NG")}. Please review every detail before submitting it through your vendor workspace.`;
      return answer;
    }
    if (/(find|search|marketplace|buyer|product)/i.test(lower)) return "I can help you think through product discovery. Open the Elevoni marketplace to browse currently approved listings. I won't invent availability or prices.";
    if (/(sales|record|insight|reorder)/i.test(lower)) return "Your Vendor Sales Log is the place to review sales you have recorded. Remember that farmer-entered records are self-reported unless independently verified.";
    return "I can help you prepare a product listing, understand your recorded sales, or navigate product discovery. Tell me what you want to do, and include the product, quantity, unit and asking price when preparing a listing.";
  };

  const send = async (value = input) => {
    const text = value.trim();
    if (!text || busy) return;
    setMessages((current) => [...current, { role: "user", text }]);
    setInput("");
    setBusy(true);
    await new Promise((resolve) => setTimeout(resolve, 350));
    const answer = respond(text);
    setMessages((current) => [...current, { role: "assistant", text: answer }]);
    setBusy(false);
  };

  const updateDraft = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const draftReady = draft && draft.name.trim() && draft.category && draft.quantity && Number(draft.quantity) > 0 && draft.price && Number(draft.price) >= 0;

  return (
    <section className="natlas-shell">
      <aside className="natlas-rail">
        <div className="natlas-rail-brand"><span className="natlas-mark">N</span><span>N-ATLAS</span></div>
        <button className="natlas-new-chat" onClick={() => { setMessages([]); setDraft(null); setNotice(""); }}>＋ <span>New conversation</span></button>
        <div className="natlas-rail-label">YOUR WORKSPACE</div>
        <Link to="/" className="natlas-rail-link">⌂ <span>Vendor dashboard</span></Link>
        <Link to="/sales" className="natlas-rail-link">▤ <span>Sales records</span></Link>
        <div className="natlas-rail-bottom"><span className="natlas-status-dot" /> Designed for farmers<br /><small>Powered by Elevoni</small></div>
      </aside>

      <div className="natlas-main">
        <header className="natlas-topbar">
          <div><span className="natlas-top-kicker">ELEVONI INTELLIGENCE</span><h1>N-ATLAS <span>Preview</span></h1></div>
          <label className="natlas-language"> <span>Language</span><select value={language} onChange={(event) => { setLanguage(event.target.value); setNotice("Language preference saved. Speech recognition quality depends on browser and device support."); }} aria-label="Choose assistant language">{LANGUAGES.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select></label>
        </header>

        <div className="natlas-conversation">
          {messages.length === 0 ? (
            <div className="natlas-welcome">
              <div className="natlas-orb"><span>N</span><i /><b /></div>
              <p className="natlas-welcome-eyebrow">YOUR AGRICULTURAL COMPANION</p>
              <h2>{activeLanguage.greeting}</h2>
              <p className="natlas-welcome-copy">A simpler way to work with Elevoni. Ask a question, prepare a listing, or explore your recorded activity.</p>
              <div className="natlas-suggestions">{suggestions.map((item) => <button key={item.title} onClick={() => send(item.title)}><span>{item.icon}</span><strong>{item.title}</strong><small>{item.detail}</small><b>↗</b></button>)}</div>
            </div>
          ) : (
            <div className="natlas-thread">
              {messages.map((message, index) => <article className={`natlas-message ${message.role}`} key={`${index}-${message.role}`}><div className="natlas-avatar">{message.role === "assistant" ? "N" : "Y"}</div><div className="natlas-message-body"><span className="natlas-message-name">{message.role === "assistant" ? "N-ATLAS" : "You"}</span><p>{message.text}</p>{message.role === "assistant" && <button className="natlas-speak" onClick={() => speak(message.text)} aria-label="Read response aloud">◖)) <span>Listen</span></button>}</div></article>)}
              {busy && <div className="natlas-thinking"><span /><span /><span /> <small>N-ATLAS is thinking</small></div>}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {draft && <section className="natlas-draft">
          <div className="natlas-draft-head"><div><span className="natlas-draft-label">ASSISTED LISTING</span><h3>Review your product draft</h3></div><button onClick={() => setDraft(null)} aria-label="Close draft">×</button></div>
          <p className="natlas-draft-note">This is a draft only. Nothing has been published or saved. Complete and review the details in your vendor workspace before submitting.</p>
          <div className="natlas-draft-grid">
            <label>Product name<input value={draft.name} onChange={(e) => updateDraft("name", e.target.value)} placeholder="e.g. Maize" /></label>
            <label>Category<select value={draft.category} onChange={(e) => updateDraft("category", e.target.value)}><option value="">Choose category</option>{["Food Crops","Livestock & Meat","Poultry & Eggs","Catfish & Aquaculture","Fishery Products & Equipment"].map((v) => <option key={v}>{v}</option>)}</select></label>
            <label>Subcategory<input value={draft.subcategory} onChange={(e) => updateDraft("subcategory", e.target.value)} placeholder="Subcategory" /></label>
            <label>Quantity<input type="number" min="0" step="any" value={draft.quantity} onChange={(e) => updateDraft("quantity", e.target.value)} placeholder="e.g. 50" /></label>
            <label>Unit<select value={draft.unit} onChange={(e) => updateDraft("unit", e.target.value)}>{["kg","bag","crate","ton","piece","carton"].map((v) => <option key={v}>{v}</option>)}</select></label>
            <label>Asking price (₦)<input type="number" min="0" value={draft.price} onChange={(e) => updateDraft("price", e.target.value)} placeholder="Your price" /></label>
          </div>
          <div className="natlas-draft-actions"><span>{draftReady ? "Details look complete — continue in your dashboard to add description and media." : "Complete the required fields to prepare this draft."}</span><Link to="/" onClick={() => { if (draftReady) localStorage.setItem("natlas-product-draft", JSON.stringify({ name: draft.name, category: draft.category, subcategory: draft.subcategory, stockQuantity: draft.quantity, unitOfMeasure: draft.unit, price: draft.price, description: "" })); }} className={draftReady ? "ready" : ""}>Continue to listing form ↗</Link></div>
        </section>}

        <div className="natlas-composer-wrap">
          {notice && <p className="natlas-notice" role="status">{notice}</p>}
          <form className="natlas-composer" onSubmit={(event) => { event.preventDefault(); send(); }}>
            <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} placeholder={activeLanguage.placeholder} rows={1} aria-label="Message N-ATLAS" />
            <div className="natlas-composer-tools"><span className="natlas-input-hint">N-ATLAS can make mistakes. Verify important details.</span><div><button type="button" className={`natlas-mic ${listening ? "recording" : ""}`} onClick={listening ? stopListening : startListening} aria-label={listening ? "Stop recording" : "Start voice input"}>{listening ? "■" : "♩"}</button><button type="submit" className="natlas-send" disabled={!input.trim() || busy} aria-label="Send message">↑</button></div></div>
          </form>
          <p className="natlas-disclaimer">Voice features depend on your browser and device. Language support is being validated with real farmer speech.</p>
        </div>
      </div>
    </section>
  );
}
