import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { natlasApi } from "../../api";
import { PRODUCT_CATEGORIES, PRODUCT_UNITS, SUBCATEGORIES_BY_CATEGORY } from "../../constants/categoryExport";
import "./NAtlas.css";


const MicIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8" /></svg>;
const StopIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>;
const VolumeIcon = () => <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7m3-10a9 9 0 0 1 0 13" /></svg>;

const LANGUAGES = [
  { code: "en-NG", label: "English", greeting: "Hello. What are you working on today?", placeholder: "Ask Elevoni Assistant about your farm or business…" },
  { code: "pcm-NG", label: "Nigerian Pidgin", greeting: "How far! Wetin you wan do today?", placeholder: "Talk to Elevoni Assistant about your farm or market…" },
  { code: "ha-NG", label: "Hausa", greeting: "Sannu. Me kake son yi a yau?", placeholder: "Yi magana da Elevoni Assistant game da gonarka…" },
  { code: "ig-NG", label: "Igbo", greeting: "Ndewo. Kedu ihe ị chọrọ ime taa?", placeholder: "Gwa Elevoni Assistant gbasara ugbo gị…" },
  { code: "yo-NG", label: "Yorùbá", greeting: "Ẹ káàbọ̀. Kí ni o fẹ́ ṣe lónìí?", placeholder: "Bá Elevoni Assistant sọ̀rọ̀ nípa oko rẹ…" },
];
const LANGUAGE_TTS_CODES = { "en-NG": "en", "pcm-NG": "pcm", "ha-NG": "ha", "ig-NG": "ig", "yo-NG": "yo" };
const suggestions = [
  { icon: "＋", title: "Prepare a product listing", detail: "Turn your product details into a draft" },
  { icon: "⌕", title: "Find products on Elevoni", detail: "Explore what buyers can discover" },
  { icon: "▤", title: "Understand my sales records", detail: "Learn from sales you have recorded" },
];

const requestErrorMessage = (error, fallback) => {
  if (error?.code === "ERR_CANCELED" || error?.name === "AbortError") return "cancelled";
  if (["ECONNABORTED", "ETIMEDOUT"].includes(error?.code)) {
    return "Elevoni Assistant is taking longer than expected. Please try again.";
  }
  return error?.response?.data?.message || error?.message || fallback;
};

export default function NAtlas() {
  const [language, setLanguage] = useState(() => { const saved = localStorage.getItem("natlas-language"); return LANGUAGES.some((item) => item.code === saved) ? saved : "en-NG"; });
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState(null);
  const [notice, setNotice] = useState("");
  const [speakingMessage, setSpeakingMessage] = useState(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const bottomRef = useRef(null);
  const activeRequestRef = useRef(null);
  const mountedRef = useRef(false);
  const speechAudioRef = useRef(null);
  const speechUrlRef = useRef("");
  const speechRequestRef = useRef(null);
  const activeLanguage = useMemo(() => LANGUAGES.find((item) => item.code === language) || LANGUAGES[0], [language]);

  useEffect(() => { localStorage.setItem("natlas-language", language); }, [language]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, busy, draft]);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      activeRequestRef.current?.abort();
      activeRequestRef.current = null;
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.onstop = null;
        recorderRef.current.onerror = null;
        recorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      speechRequestRef.current?.abort();
      speechAudioRef.current?.pause();
      if (speechUrlRef.current) URL.revokeObjectURL(speechUrlRef.current);
    };
  }, []);

  const cancelActiveRequest = () => {
    if (!activeRequestRef.current) return;
    activeRequestRef.current.abort();
    setNotice("Request cancelled. You can try again whenever you're ready.");
  };

  const speakWithDevice = async (text, messageIndex, signal) => {
    if (!mountedRef.current) return;
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
    if (!mountedRef.current || signal?.aborted) return;
    const requestedCode = LANGUAGE_TTS_CODES[language] || "en";
    const matchingVoice = voices.find((voice) => voice.lang?.toLowerCase().startsWith(requestedCode));
    const defaultVoice = voices.find((voice) => voice.default) || voices[0];
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = language === "pcm-NG" ? "en-NG" : language;
    utterance.voice = matchingVoice || defaultVoice || null;
    utterance.onend = () => { if (mountedRef.current) setSpeakingMessage(null); };
    utterance.onerror = () => {
      if (mountedRef.current) {
        setSpeakingMessage(null);
        setNotice("Your device could not play this response. Try another browser voice or read the text response.");
      }
    };
    setSpeakingMessage(messageIndex);
    if (!matchingVoice && defaultVoice) {
      setNotice(`Your device has no dedicated ${activeLanguage.label} voice. Playing with its default voice; pronunciation may be inaccurate.`);
    } else {
      setNotice(matchingVoice ? `Playing with your device's ${activeLanguage.label} voice.` : "No speech voice is installed on this device.");
    }
    window.speechSynthesis.speak(utterance);
  };

  const stopVoicePlayback = () => {
    speechRequestRef.current?.abort();
    speechRequestRef.current = null;
    speechAudioRef.current?.pause();
    speechAudioRef.current = null;
    if (speechUrlRef.current) URL.revokeObjectURL(speechUrlRef.current);
    speechUrlRef.current = "";
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeakingMessage(null);
  };

  const speak = async (text, messageIndex) => {
    if (speakingMessage === messageIndex) {
      stopVoicePlayback();
      setNotice("Voice message stopped.");
      return;
    }
    stopVoicePlayback();
    setSpeakingMessage(messageIndex);
    const controller = new AbortController();
    speechRequestRef.current = controller;
    try {
      const response = await natlasApi.post("/api/n-atlas/speech", { text, language }, { responseType: "blob", signal: controller.signal });
      const contentType = response.headers?.["content-type"] || response.data?.type || "";
      if (!contentType.toLowerCase().includes("audio/") || !response.data?.size) throw new Error("Server speech is not available.");
      const url = URL.createObjectURL(response.data);
      speechUrlRef.current = url;
      const audio = new Audio(url);
      speechAudioRef.current = audio;
      audio.onended = () => {
        if (mountedRef.current) setSpeakingMessage(null);
        if (speechUrlRef.current === url) { URL.revokeObjectURL(url); speechUrlRef.current = ""; }
        if (speechAudioRef.current === audio) speechAudioRef.current = null;
      };
      audio.onerror = () => {
        if (mountedRef.current) { setSpeakingMessage(null); setNotice("The voice message could not be played. Please try again or read the response."); }
        if (speechUrlRef.current === url) { URL.revokeObjectURL(url); speechUrlRef.current = ""; }
        if (speechAudioRef.current === audio) speechAudioRef.current = null;
      };
      await audio.play();
      setNotice(response.headers?.["x-elevoni-voice-note"] || "Playing Elevoni Assistant's cloud voice message.");
      return;
    } catch (error) {
      if (error?.code === "ERR_CANCELED" || error?.name === "AbortError" || controller.signal.aborted) return;
      if (speechUrlRef.current) URL.revokeObjectURL(speechUrlRef.current);
      speechUrlRef.current = "";
      speechAudioRef.current = null;
      if (import.meta.env.VITE_ALLOW_DEVICE_TTS_FALLBACK === "true") {
        await speakWithDevice(text, messageIndex, controller.signal);
      } else {
        setSpeakingMessage(null);
        setNotice(error?.response?.data?.message || "Cloud voice is unavailable for this language right now. You can still read the response.");
      }
    } finally {
      if (speechRequestRef.current === controller) speechRequestRef.current = null;
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
    const controller = new AbortController();
    activeRequestRef.current = controller;
    setBusy(true);
    setNotice("Listening to your voice message…");
    try {
      const extension = mimeType.includes("mp4") ? "m4a" : mimeType.includes("ogg") ? "ogg" : "webm";
      const form = new FormData();
      form.append("file", blob, `elevoni-assistant-voice.${extension}`);
      form.append("language", language);
      const response = await natlasApi.post("/api/n-atlas/transcribe", form, { signal: controller.signal });
      const result = response.data?.data;
      if (!response.data?.success || !result?.text) throw new Error("Elevoni Assistant did not return a transcript. Please try again.");
      if (mountedRef.current) {
        setInput(result.text);
        setNotice(result.notice || "Transcription ready. Review the text, then send it to Elevoni Assistant.");
      }
    } catch (error) {
      const errorMessage = requestErrorMessage(error, "Elevoni Assistant could not transcribe that recording. You can type your message instead.");
      if (errorMessage === "cancelled") {
        if (mountedRef.current) setNotice("Transcription cancelled. You can record another message or type instead.");
      } else if (mountedRef.current) {
        setNotice(errorMessage);
      }
    } finally {
      if (activeRequestRef.current === controller) activeRequestRef.current = null;
      if (mountedRef.current) setBusy(false);
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
      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
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
        if (recorderRef.current === recorder) recorderRef.current = null;
        setListening(false);
        transcribeRecording(blob, actualType);
      };
      recorderRef.current = recorder;
      recorder.start();
      setListening(true);
      setNotice("Recording… Select the microphone again when you finish speaking.");
    } catch (error) {
      if (mountedRef.current) {
        setListening(false);
        setNotice(error?.name === "NotAllowedError" ? "Microphone permission was denied. Allow microphone access in your browser settings." : "Unable to access the microphone. Check your browser and device permissions.");
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const stopListening = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
    else setListening(false);
  };

  const send = async (value = input) => {
    const text = value.trim();
    if (!text || busy) return;
    const priorMessages = messages.slice(-10).map(({ role, text: messageText }) => ({ role, text: String(messageText || "").slice(0, 1500) }));
    setMessages((current) => [...current, { role: "user", text }]);
    setInput("");
    const controller = new AbortController();
    activeRequestRef.current = controller;
    setBusy(true);
    setNotice("");
    try {
      const response = await natlasApi.post("/api/n-atlas/chat", {
        message: text,
        language,
        history: priorMessages,
      }, { signal: controller.signal });
      const result = response.data?.data;
      if (!response.data?.success || !result?.reply) throw new Error("Elevoni Assistant returned an unexpected response.");
      if (!mountedRef.current) return;
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
      const errorMessage = requestErrorMessage(error, "Elevoni Assistant couldn't respond. Please try again.");
      if (errorMessage === "cancelled") {
        if (mountedRef.current) setNotice("Request cancelled. You can try again whenever you're ready.");
      } else if (mountedRef.current) {
        setNotice(errorMessage);
        setMessages((current) => [...current, { role: "assistant", text: errorMessage, error: true }]);
      }
    } finally {
      if (activeRequestRef.current === controller) activeRequestRef.current = null;
      if (mountedRef.current) setBusy(false);
    }
  };

  const updateDraft = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const draftReady = draft && draft.name.trim() && draft.category && draft.subcategory && draft.quantity && Number(draft.quantity) > 0 && draft.price !== "" && Number(draft.price) > 0;

  return (
    <section className="natlas-shell">
      <aside className="natlas-rail">
        <div className="natlas-rail-brand"><span className="natlas-mark">E</span><span>Elevoni Assistant</span></div>
        <button className="natlas-new-chat" onClick={() => { cancelActiveRequest(); stopVoicePlayback(); setMessages([]); setDraft(null); setNotice(""); }}>＋ <span>New conversation</span></button>
        <div className="natlas-rail-label">YOUR WORKSPACE</div>
        <Link to="/" className="natlas-rail-link">⌂ <span>Vendor dashboard</span></Link>
        <Link to="/sales" className="natlas-rail-link">▤ <span>Sales records</span></Link>
        <div className="natlas-rail-bottom"><span className="natlas-status-dot" /> Designed for farmers<br /><small>Powered by Elevoni</small><small className="natlas-model-attribution">N-ATLaS intelligence · ElevenLabs cloud voice</small>
          <details className="natlas-attribution"><summary>About N-ATLaS</summary>
            <p>N-ATLaS is an initiative of the Federal Ministry of Communications, Innovation and Digital Economy, and powered by Awarri Technologies.</p>
            <p>Awarri Technologies and the Federal Government of Nigeria, developers of N-ATLaS (Hausa-ASR / Igbo-ASR / Yoruba-ASR / NigerianAccentedEnglish).</p>
          </details>
        </div>
      </aside>

      <div className="natlas-main">
        <header className="natlas-topbar">
          <div><span className="natlas-top-kicker">ELEVONI INTELLIGENCE</span><h1>Elevoni Assistant <span>Intelligence</span></h1></div>
          <label className="natlas-language"> <span>Language</span><select value={language} disabled={busy || listening} onChange={(event) => { setLanguage(event.target.value); setNotice(event.target.value === "pcm-NG" ? "Pidgin selected. Voice recognition may not capture every Pidgin word correctly. Please review the transcript before sending." : "Language selected. You can type or record a voice message. Some language recognition may need review."); }} aria-label="Choose assistant language">{LANGUAGES.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select></label>
        </header>

        <div className="natlas-conversation">
          {messages.length === 0 ? (
            <div className="natlas-welcome">
              <div className="natlas-orb"><span>E</span><i /><b /></div>
              <p className="natlas-welcome-eyebrow">YOUR FARM BUSINESS ASSISTANT</p>
              <h2>{activeLanguage.greeting}</h2>
              <p className="natlas-welcome-copy">A simple assistant for your farm business. Ask questions, prepare product listings and understand your recorded sales.</p>
              <div className="natlas-suggestions">{suggestions.map((item) => <button key={item.title} onClick={() => send(item.title)}><span>{item.icon}</span><strong>{item.title}</strong><small>{item.detail}</small><b>↗</b></button>)}</div>
            </div>
          ) : (
            <div className="natlas-thread">
              {messages.map((message, index) => <article className={`natlas-message ${message.role}`} key={`${index}-${message.role}`}><div className="natlas-avatar">{message.role === "assistant" ? "E" : "Y"}</div><div className="natlas-message-body"><span className="natlas-message-name">{message.role === "assistant" ? "Elevoni Assistant" : "You"}</span><p>{message.text}</p>{message.role === "assistant" && <button className={`natlas-speak ${speakingMessage === index ? "active" : ""}`} onClick={() => speak(message.text, index)} aria-label={speakingMessage === index ? "Stop spoken response" : "Read response aloud"}>{speakingMessage === index ? <StopIcon /> : <VolumeIcon />} <span>{speakingMessage === index ? "Stop voice" : "Play voice message"}</span></button>}</div></article>)}
              {busy && <div className="natlas-thinking"><span /><span /><span /> <small>Elevoni Assistant is preparing an answer</small></div>}
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
            <label>Unit<select value={draft.unit} onChange={(e) => updateDraft("unit", e.target.value)}>{PRODUCT_UNITS.map((v) => <option key={v}>{v}</option>)}</select></label>
            <label>Asking price (₦)<input type="number" min="0" value={draft.price} onChange={(e) => updateDraft("price", e.target.value)} placeholder="Your price" /></label>
          </div>
          <div className="natlas-draft-actions"><span>{draftReady ? "Details look complete — continue in your dashboard to add description and media." : "Complete the required fields to prepare this draft."}</span><Link to="/" onClick={() => { if (draftReady) localStorage.setItem("natlas-product-draft", JSON.stringify({ name: draft.name, category: draft.category, subcategory: draft.subcategory, stockQuantity: draft.quantity, unitOfMeasure: draft.unit, price: draft.price, description: "" })); }} className={draftReady ? "ready" : ""}>Continue to listing form ↗</Link></div>
        </section>}

        <div className="natlas-composer-wrap">
          {notice && <p className="natlas-notice" role="status">{notice}</p>}
          <form className="natlas-composer" onSubmit={(event) => { event.preventDefault(); send(); }}>
            <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} placeholder={activeLanguage.placeholder} rows={1} aria-label="Type a message to Elevoni Assistant" />
            <div className="natlas-composer-tools"><span className="natlas-input-hint">AI-assisted answers can be wrong. Review important details before acting.</span><div>{busy && <button type="button" className="natlas-cancel" onClick={cancelActiveRequest}>Cancel</button>}<button type="button" className={`natlas-mic ${listening ? "recording" : ""}`} disabled={busy} onClick={listening ? stopListening : startListening} aria-label={listening ? "Stop recording" : "Start voice input"}>{listening ? <StopIcon /> : <MicIcon />}</button><button type="submit" className="natlas-send" disabled={!input.trim() || busy} aria-label="Send message">↑</button></div></div>
          </form>
          <p className="natlas-disclaimer">Voice recordings are transcribed by ElevenLabs. N-ATLaS processes the text you send and remains subject to its rolling 30-day usage condition. Spoken replies use configured ElevenLabs cloud voices; language coverage varies.</p>
        </div>
      </div>
    </section>
  );
}
