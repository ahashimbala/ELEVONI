import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import "./NAtlas.css";

const LANGUAGES = [
  { code: "en-NG", label: "English", greeting: "Hello. What are you working on today?", placeholder: "Ask N-ATLAS anything about your farm or marketplace…" },
  { code: "pcm-NG", label: "Nigerian Pidgin", greeting: "How far! Wetin you wan do today?", placeholder: "Talk to N-ATLAS about your farm or market…" },
  { code: "ha-NG", label: "Hausa", greeting: "Sannu. Me kake son yi a yau?", placeholder: "Yi magana da N-ATLAS game da gonarka…" },
  { code: "ig-NG", label: "Igbo", greeting: "Ndewo. Kedu ihe ị chọrọ ime taa?", placeholder: "Gwa N-ATLAS gbasara ugbo gị…" },
  { code: "yo-NG", label: "Yorùbá", greeting: "Ẹ káàbọ̀. Kí ni o fẹ́ ṣe lónìí?", placeholder: "Bá N-ATLAS sọ̀rọ̀ nípa oko rẹ…" },
];
const PRODUCT_CATEGORIES = ["Catfish & Aquaculture", "Fishery Products & Equipment", "Poultry & Eggs", "Livestock & Meat", "Food Crops"];
const SUBCATEGORIES_BY_CATEGORY = {
  "Catfish & Aquaculture": ["Catfish", "Tilapia", "Other Fish", "Other Aquaculture", "Fingerlings", "Juveniles", "Broodstock", "Fish Feed", "Pond & Tank Equipment", "Pumps & Aeration", "Water Testing", "Filtration", "Hatchery Services", "Aquaculture Consulting"],
  "Fishery Products & Equipment": ["Fresh Fish", "Smoked Fish", "Dried Fish", "Frozen Fish", "Fishing Nets", "Fishing Equipment", "Fish Processing", "Packaging & Storage", "Cold-chain Services"],
  "Poultry & Eggs": ["Poultry"],
  "Livestock & Meat": ["Cattle", "Sheep", "Goats"],
  "Food Crops": ["Grains & Cereals", "Vegetables & Fruits", "Tubers & Starch"],
};
const LANGUAGE_TTS_CODES = { "en-NG": "en", "pcm-NG": "pcm", "ha-NG": "ha", "ig-NG": "ig", "yo-NG": "yo" };
const suggestions = [
  { icon: "＋", title: "Prepare a product listing", detail: "Turn your product details into a draft" },
  { icon: "⌕", title: "Find products on Elevoni", detail: "Explore what buyers can discover" },
  { icon: "▤", title: "Understand my sales records", detail: "Learn from sales you have recorded" },
];

export default function NAtlas() {
  const [language, setLanguage] = useState(() => { const saved = localStorage.getItem("natlas-language"); return LANGUAGES.some((item) => item.code === saved) ? saved : "en-NG"; });
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState(null);
  const [notice, setNotice] = useState("");
  const [speakingMessage, setSpeakingMessage] = useState(null);
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const bottomRef = useRef(null);
  const activeLanguage = useMemo(() => LANGUAGES.find((item) => item.code === language) || LANGUAGES[0], [language]);

  useEffect(() => { localStorage.setItem("natlas-language", language); }, [language]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, busy, draft]);
  useEffect(() => () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") { recorderRef.current.onstop = null; recorderRef.current.stop(); }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
  }, []);

  const speakWithDevice = async (text, messageIndex) => {
    if (!("speechSynthesis" in window) || typeof window.SpeechSynthesisUtterance === "undefined") {
      setNotice("Spoken playback is not supported in this browser. You can still read the response.");
      setSpeakingMessage(null);
      return;
    }
    window.speechSynthesis.cancel();
    let voices = window.speechSynthesis.getVoices();
    if (!voices.length) {
      voices = await new Promise((resolve) => {
        const timeout = window.setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1200);
        if (typeof window.speechSynthesis.addEventListener === "function") {
          window.speechSynthesis.addEventListener("voiceschanged", () => {
            window.clearTimeout(timeout);
            resolve(window.speechSynthesis.getVoices());
          }, { once: true });
        }
      });
    }
    const requestedCode = LANGUAGE_TTS_CODES[language] || "en";
    const matchingVoice = voices.find((voice) => voice.lang?.toLowerCase().startsWith(requestedCode));
    const defaultVoice = voices.find((voice) => voice.default) || voices[0];
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = language === "pcm-NG" ? "en-NG" : language;
    utterance.voice = matchingVoice || defaultVoice || null;
    utterance.onend = () => setSpeakingMessage(null);
    utterance.onerror = () => { setSpeakingMessage(null); setNotice("Your device could not play this response. Try another browser voice or read the text response."); };
    setSpeakingMessage(messageIndex);
    if (!matchingVoice && defaultVoice) {
      setNotice(`Your device has no dedicated ${activeLanguage.label} voice. Playing with its default voice; pronunciation may be inaccurate.`);
    } else {
      setNotice(matchingVoice ? `Playing with your device's ${activeLanguage.label} voice.` : "No speech voice is installed on this device.");
    }
    window.speechSynthesis.speak(utterance);
  };

  const speak = async (text, messageIndex) => {
    if (speakingMessage === messageIndex) {
      if (audioRef.current) audioRef.current.pause();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      setSpeakingMessage(null);
      return;
    }
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
    if (audioUrlRef.current) { URL.revokeObjectURL(audioUrlRef.current); audioUrlRef.current = null; }
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeakingMessage(messageIndex);
    setNotice("Preparing spoken response…");
    try {
      const response = await api.post("/api/n-atlas/speech", { text, language }, { responseType: "blob", timeout: 100000 });
      const blob = response.data;
      if (!(blob instanceof Blob) || !blob.size || !String(response.headers?.["content-type"] || blob.type).toLowerCase().includes("audio/")) {
        throw new Error("The speech service returned an invalid audio response.");
      }
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setSpeakingMessage(null); URL.revokeObjectURL(url); audioUrlRef.current = null; audioRef.current = null; };
      audio.onerror = () => {
        setSpeakingMessage(null);
        URL.revokeObjectURL(url);
        audioUrlRef.current = null;
        audioRef.current = null;
        setNotice("The generated audio could not be played. Trying your device voice instead.");
        speakWithDevice(text, messageIndex);
      };
      await audio.play();
      const voiceNote = response.headers?.["x-natlas-voice-note"];
      setNotice(voiceNote || "Playing the N-ATLaS generated voice.");
    } catch (error) {
      const status = error.response?.status;
      if (status && status !== 501 && status !== 503) {
        setNotice(error.response?.data?.message || "N-ATLaS speech could not be generated. Trying your device voice instead.");
      } else if (status === 501) {
        setNotice("N-ATLaS server-side speech is currently disabled. Trying your device voice instead.");
      } else {
        setNotice("N-ATLaS speech is unavailable. Trying your device voice instead.");
      }
      await speakWithDevice(text, messageIndex);
    }
  };

  const transcribeRecording = async (blob, mimeType) => {
    if (!blob.size) {
      setNotice("No audio was captured. Please try recording again.");
      return;
    }
    if (blob.size > 12 * 1024 * 1024) {
      setNotice("That recording is too large. Please record a shorter voice message.");
      return;
    }
    setBusy(true);
    setNotice("Sending your recording to N-ATLaS for transcription…");
    try {
      const extension = mimeType.includes("mp4") ? "m4a" : mimeType.includes("ogg") ? "ogg" : "webm";
      const form = new FormData();
      form.append("file", blob, `elevoni-voice.${extension}`);
      form.append("language", language);
      const response = await api.post("/api/n-atlas/transcribe", form);
      const result = response.data?.data;
      if (!response.data?.success || !result?.text) throw new Error("N-ATLaS did not return a transcript. Please try again.");
      setInput(result.text);
      setNotice(result.notice || "Transcription ready. Review the text, then send it to N-ATLaS.");
    } catch (error) {
      setNotice(error.response?.data?.message || error.message || "N-ATLaS could not transcribe that recording. You can type your message instead.");
    } finally {
      setBusy(false);
    }
  };

  const startListening = async () => {
    setNotice("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setNotice("Audio recording is not supported in this browser. You can still type your request.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      streamRef.current = stream;
      const supportedTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
      const mimeType = typeof MediaRecorder.isTypeSupported === "function" ? (supportedTypes.find((type) => MediaRecorder.isTypeSupported(type)) || "") : "";
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recordedChunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data?.size) recordedChunksRef.current.push(event.data); };
      recorder.onerror = () => setNotice("The recording stopped unexpectedly. Please try again or type your request.");
      recorder.onstop = () => {
        const actualType = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(recordedChunksRef.current, { type: actualType });
        recordedChunksRef.current = [];
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setListening(false);
        transcribeRecording(blob, actualType);
      };
      recorderRef.current = recorder;
      recorder.start();
      setListening(true);
      setNotice("Recording… Select the microphone again when you finish speaking.");
    } catch (error) {
      setListening(false);
      setNotice(error?.name === "NotAllowedError" ? "Microphone permission was denied. Allow microphone access in your browser settings." : "Unable to access the microphone. Check your browser and device permissions.");
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const stopListening = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") { recorderRef.current.onstop = null; recorderRef.current.stop(); }
    else setListening(false);
  };

  const send = async (value = input) => {
    const text = value.trim();
    if (!text || busy) return;
    const priorMessages = messages.slice(-10).map(({ role, text: messageText }) => ({ role, text: String(messageText || "").slice(0, 1500) }));
    setMessages((current) => [...current, { role: "user", text }]);
    setInput("");
    setBusy(true);
    setNotice("");
    try {
      const response = await api.post("/api/n-atlas/chat", {
        message: text,
        language,
        history: priorMessages,
      });
      const result = response.data?.data;
      if (!response.data?.success || !result?.reply) throw new Error("N-ATLAS returned an unexpected response.");
      if (result.draft) {
        setDraft((current) => ({
          name: result.draft.name || current?.name || "",
          category: result.draft.category || current?.category || "",
          subcategory: result.draft.subcategory || current?.subcategory || "",
          quantity: result.draft.quantity ?? current?.quantity ?? "",
          unit: result.draft.unit || current?.unit || "kg",
          price: result.draft.price ?? current?.price ?? "",
          sourceText: result.draft.sourceText || text,
        }));
      }
      setMessages((current) => [...current, { role: "assistant", text: result.reply }]);
    } catch (error) {
      const message = error.response?.data?.message || error.message || "N-ATLAS couldn't respond. Please try again.";
      setNotice(message);
      setMessages((current) => [...current, { role: "assistant", text: message, error: true }]);
    } finally {
      setBusy(false);
    }
  };

  const updateDraft = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const draftReady = draft && draft.name.trim() && draft.category && draft.subcategory && draft.quantity && Number(draft.quantity) > 0 && draft.price !== "" && Number(draft.price) >= 0;

  return (
    <section className="natlas-shell">
      <aside className="natlas-rail">
        <div className="natlas-rail-brand"><span className="natlas-mark">N</span><span>N-ATLAS</span></div>
        <button className="natlas-new-chat" onClick={() => { setMessages([]); setDraft(null); setNotice(""); }}>＋ <span>New conversation</span></button>
        <div className="natlas-rail-label">YOUR WORKSPACE</div>
        <Link to="/" className="natlas-rail-link">⌂ <span>Vendor dashboard</span></Link>
        <Link to="/sales" className="natlas-rail-link">▤ <span>Sales records</span></Link>
        <div className="natlas-rail-bottom"><span className="natlas-status-dot" /> Designed for farmers<br /><small>Powered by Elevoni</small><small className="natlas-model-attribution">N-ATLaS initiative · Federal Ministry of Communications, Innovation and Digital Economy · Powered by Awarri Technologies</small></div>
      </aside>

      <div className="natlas-main">
        <header className="natlas-topbar">
          <div><span className="natlas-top-kicker">ELEVONI INTELLIGENCE</span><h1>N-ATLAS <span>Intelligence</span></h1></div>
          <label className="natlas-language"> <span>Language</span><select value={language} disabled={busy || listening} onChange={(event) => { setLanguage(event.target.value); setNotice(event.target.value === "pcm-NG" ? "Nigerian Pidgin selected. Voice transcription currently uses the Nigerian English ASR model; results may be inaccurate. The assistant will be prompted to reply in Pidgin." : "Language preference saved. Voice input uses the matching N-ATLaS ASR model; language accuracy still needs native-speaker validation."); }} aria-label="Choose assistant language">{LANGUAGES.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select></label>
        </header>

        <div className="natlas-conversation">
          {messages.length === 0 ? (
            <div className="natlas-welcome">
              <div className="natlas-orb"><span>N</span><i /><b /></div>
              <p className="natlas-welcome-eyebrow">YOUR AGRICULTURAL COMPANION</p>
              <h2>{activeLanguage.greeting}</h2>
              <p className="natlas-welcome-copy">Your agricultural workspace companion. Ask questions, prepare listing drafts, and explore your own recorded activity with answers grounded in Elevoni data.</p>
              <div className="natlas-suggestions">{suggestions.map((item) => <button key={item.title} onClick={() => send(item.title)}><span>{item.icon}</span><strong>{item.title}</strong><small>{item.detail}</small><b>↗</b></button>)}</div>
            </div>
          ) : (
            <div className="natlas-thread">
              {messages.map((message, index) => <article className={`natlas-message ${message.role}`} key={`${index}-${message.role}`}><div className="natlas-avatar">{message.role === "assistant" ? "N" : "Y"}</div><div className="natlas-message-body"><span className="natlas-message-name">{message.role === "assistant" ? "N-ATLAS" : "You"}</span><p>{message.text}</p>{message.role === "assistant" && <button className={`natlas-speak ${speakingMessage === index ? "active" : ""}`} onClick={() => speak(message.text, index)} aria-label={speakingMessage === index ? "Stop spoken response" : "Read response aloud"}>{speakingMessage === index ? "■" : "◖))"} <span>{speakingMessage === index ? "Stop speaking" : "Listen"}</span></button>}</div></article>)}
              {busy && <div className="natlas-thinking"><span /><span /><span /> <small>N-ATLAS is thinking</small></div>}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {draft && <section className="natlas-draft">
          <div className="natlas-draft-head"><div><span className="natlas-draft-label">ASSISTED LISTING</span><h3>Review your product draft</h3></div><button onClick={() => setDraft(null)} aria-label="Close draft">×</button></div>
          <p className="natlas-draft-note">AI-assisted draft only. Nothing has been published or saved. Review every field, then continue to the vendor listing form. Vendor approval still applies.</p>
          <div className="natlas-draft-grid">
            <label>Product name<input value={draft.name} onChange={(e) => updateDraft("name", e.target.value)} placeholder="e.g. Maize" /></label>
            <label>Category<select value={draft.category} onChange={(e) => setDraft((current) => ({ ...current, category: e.target.value, subcategory: "" }))}><option value="">Choose category</option>{PRODUCT_CATEGORIES.map((v) => <option key={v}>{v}</option>)}</select></label>
            <label>Subcategory<select value={draft.subcategory} onChange={(e) => updateDraft("subcategory", e.target.value)} disabled={!draft.category}><option value="">Choose subcategory</option>{(SUBCATEGORIES_BY_CATEGORY[draft.category] || []).map((v) => <option key={v}>{v}</option>)}</select></label>
            <label>Quantity<input type="number" min="0" step="any" value={draft.quantity} onChange={(e) => updateDraft("quantity", e.target.value)} placeholder="e.g. 50" /></label>
            <label>Unit<select value={draft.unit} onChange={(e) => updateDraft("unit", e.target.value)}>{["kg","gram","piece","crate","ton","bag","carton","litre","service","hour"].map((v) => <option key={v}>{v}</option>)}</select></label>
            <label>Asking price (₦)<input type="number" min="0" value={draft.price} onChange={(e) => updateDraft("price", e.target.value)} placeholder="Your price" /></label>
          </div>
          <div className="natlas-draft-actions"><span>{draftReady ? "Details look complete — continue in your dashboard to add description and media." : "Complete the required fields to prepare this draft."}</span><Link to="/" onClick={() => { if (draftReady) localStorage.setItem("natlas-product-draft", JSON.stringify({ name: draft.name, category: draft.category, subcategory: draft.subcategory, stockQuantity: draft.quantity, unitOfMeasure: draft.unit, price: draft.price, description: "" })); }} className={draftReady ? "ready" : ""}>Continue to listing form ↗</Link></div>
        </section>}

        <div className="natlas-composer-wrap">
          {notice && <p className="natlas-notice" role="status">{notice}</p>}
          <form className="natlas-composer" onSubmit={(event) => { event.preventDefault(); send(); }}>
            <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} placeholder={activeLanguage.placeholder} rows={1} aria-label="Message N-ATLAS" />
            <div className="natlas-composer-tools"><span className="natlas-input-hint">AI-assisted answers can be wrong. Review important details before acting.</span><div><button type="button" className={`natlas-mic ${listening ? "recording" : ""}`} disabled={busy} onClick={listening ? stopListening : startListening} aria-label={listening ? "Stop recording" : "Start voice input"}>{listening ? "■" : "♩"}</button><button type="submit" className="natlas-send" disabled={!input.trim() || busy} aria-label="Send message">↑</button></div></div>
          </form>
          <p className="natlas-disclaimer">Voice input is transcribed by the private N-ATLaS gateway. Spoken replies use the private N-ATLaS voice service when it is enabled and licensed; otherwise Elevoni falls back to your browser/device voice. Device voice availability and pronunciation vary by language.</p>
        </div>
      </div>
    </section>
  );
}
