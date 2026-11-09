import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import axios from "axios";
import { FaMicrophone, FaStop, FaVolumeUp, FaPaperPlane, FaArrowRight } from "react-icons/fa";
import { resolveApiBaseUrl } from "../../utils/apiBase";
import { formatNaira, marketplaceEnquiryUrl } from "../../utils/marketplace";
import { NATLAS_CLIENT_TIMEOUT_MS } from "../../../../shared/natlasConfig.mjs";
import { requestMicrophoneStream, MICROPHONE_PERMISSION_HELP } from "../../utils/microphone.js";
import "./Tinka.css";

const API = resolveApiBaseUrl();
function createVisitorUuid() {
  return window.crypto?.randomUUID?.() || "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    return (char === "x" ? random : (random & 0x3) | 0x8).toString(16);
  });
}

function getOrCreateVisitorId() {
  const key = "elevoni-natlas-visitor-id";
  const valid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || "");
  try {
    const existing = window.localStorage.getItem(key);
    if (valid(existing)) return existing;
    const id = createVisitorUuid();
    window.localStorage.setItem(key, id);
    return id;
  } catch {
    try {
      const sessionId = window.sessionStorage.getItem(key);
      if (valid(sessionId)) return sessionId;
      const id = createVisitorUuid();
      window.sessionStorage.setItem(key, id);
      return id;
    } catch {
      return createVisitorUuid();
    }
  }
}
const LANGUAGES = [
  { code: "en-NG", label: "English", greeting: "Hello! What are you looking for today?", placeholder: "Tell me what you need…", quickPrompts: ["I want to buy chickens", "Find rice sellers", "Show me the marketplace"] },
  { code: "pcm-NG", label: "Pidgin", greeting: "How far! Wetin you dey find today?", placeholder: "Tell me wetin you need…", quickPrompts: ["I wan buy chicken", "Find people wey dey sell rice", "Show me market"] },
  { code: "ha-NG", label: "Hausa", greeting: "Sannu! Me kake nema a yau?", placeholder: "Faɗa min abin da kake nema…", quickPrompts: ["Ina son sayen kaji", "Nemo masu sayar da shinkafa", "Nuna min kasuwa"] },
  { code: "yo-NG", label: "Yorùbá", greeting: "Ẹ káàbọ̀! Kí ni ẹ ń wá lónìí?", placeholder: "Sọ ohun tí o ń wá…", quickPrompts: ["Mo fẹ́ ra adìẹ", "Wa àwọn tó ń ta ìrẹsì", "Fi ọjà hàn mí"] },
  { code: "ig-NG", label: "Igbo", greeting: "Ndewo! Kedu ihe ị na-achọ taa?", placeholder: "Gwa m ihe ị na-achọ…", quickPrompts: ["Achọrọ m ịzụta ọkụkọ", "Chọta ndị na-ere osikapa", "Gosi m ahịa"] },
];

function getErrorMessage(error) {
  if (error?.code === "ERR_CANCELED" || error?.name === "AbortError") return "Request cancelled.";
  if (error?.code === "ECONNABORTED" || error?.code === "ETIMEDOUT") return "TINKA is taking longer than expected. Please try again.";
  return error?.response?.data?.message || "TINKA could not complete that request. Please try again.";
}

function ListingCard({ listing }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageSrc = !listing.image ? "" : /^https?:\/\//i.test(listing.image)
    ? listing.image
    : listing.image.startsWith("/") ? `${API}${listing.image}` : `${API}/images/${listing.image}`;
  return (
    <article className="tinka-listing">
      {imageSrc && !imageFailed ? <img src={imageSrc} alt={listing.name} loading="lazy" onError={() => setImageFailed(true)} /> : <div className="tinka-listing-placeholder" aria-hidden="true">E</div>}
      <div className="tinka-listing-content">
        <strong>{listing.name}</strong>
        <span className="tinka-listing-price">{listing.pricePrefix ? `${listing.pricePrefix} ` : ""}{formatNaira(listing.price)} / {listing.unit || "unit"}</span>
        <span className="tinka-listing-vendor">{listing.vendorName || "Approved Elevoni vendor"}</span>
        <span className="tinka-listing-location">{[listing.lga, listing.state].filter(Boolean).join(", ") || "Location not provided"}</span>
        {listing.availability && <span className="tinka-listing-location">{listing.availability}</span>}
        {listing.matchReasons?.length > 0 && <small className="tinka-stock-note">Matched on: {listing.matchReasons.join(", ")}</small>}
        {listing.stockMatch === "sufficient" && <small className="tinka-stock-note">Recorded stock meets the requested quantity</small>}
        {listing.stockMatch === "not_confirmed" && <small className="tinka-stock-note">Confirm current stock with the seller</small>}
        <div className="tinka-listing-actions">
          <Link to={`/product/${listing.id}`}>View listing <FaArrowRight aria-hidden="true" /></Link>
          <a href={marketplaceEnquiryUrl({ name: listing.name, vendorId: { businessName: listing.vendorName } })} target="_blank" rel="noreferrer">Enquire</a>
        </div>
      </div>
    </article>
  );
}

export default function Tinka() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem("tinka-customer-language") || localStorage.getItem("konekta-customer-language");
    return LANGUAGES.some((item) => item.code === saved) ? saved : "en-NG";
  });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [notice, setNotice] = useState("");
  const [speakingId, setSpeakingId] = useState(null);
  const visitorIdRef = useRef(getOrCreateVisitorId());
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const requestRef = useRef(null);
  const mountedRef = useRef(false);
  const conversationEndRef = useRef(null);
  const audioRef = useRef(null);
  const audioUrlRef = useRef("");
  const voiceRequestRef = useRef(null);
  const languageInfo = LANGUAGES.find((item) => item.code === language) || LANGUAGES[0];

  useEffect(() => { localStorage.setItem("tinka-customer-language", language); }, [language]);
  useEffect(() => { conversationEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, busy]);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestRef.current?.abort();
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.onstop = null;
        recorderRef.current.onerror = null;
        recorderRef.current.ondataavailable = null;
        recorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      audioRef.current?.pause();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      voiceRequestRef.current?.abort();
    };
  }, []);

  const visitorHeaders = () => {
    const headers = { "X-Elevoni-Visitor-ID": visitorIdRef.current };
    try {
      const token = window.localStorage.getItem("token");
      if (token) headers.token = token;
    } catch { /* anonymous browser identity remains available */ }
    return headers;
  };

  const stopVoicePlayback = () => {
    voiceRequestRef.current?.abort();
    voiceRequestRef.current = null;
    audioRef.current?.pause();
    audioRef.current = null;
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = "";
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeakingId(null);
  };

  const speakWithDevice = async (text, id, signal) => {
    if (!("speechSynthesis" in window) || typeof window.SpeechSynthesisUtterance === "undefined") {
      setSpeakingId(null);
      setNotice("Voice playback is not available on this device. You can still read the answer.");
      return;
    }
    let voices = window.speechSynthesis.getVoices();
    if (!voices.length) {
      voices = await new Promise((resolve) => {
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeout);
          window.speechSynthesis.removeEventListener?.("voiceschanged", finish);
          resolve(window.speechSynthesis.getVoices());
        };
        const timeout = window.setTimeout(finish, 1200);
        window.speechSynthesis.addEventListener?.("voiceschanged", finish, { once: true });
      });
    }
    if (!mountedRef.current || signal?.aborted) return;
    const languagePrefix = language === "pcm-NG" ? "en" : language.slice(0, 2);
    const voice = voices.find((item) => item.lang?.toLowerCase().startsWith(languagePrefix));
    const fallback = voices.find((item) => item.default) || voices[0];
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = language === "pcm-NG" ? "en-NG" : language;
    utterance.voice = voice || fallback || null;
    utterance.rate = 0.96;
    utterance.onend = () => { if (mountedRef.current) setSpeakingId(null); };
    utterance.onerror = () => { if (mountedRef.current) { setSpeakingId(null); setNotice("Your device could not play this voice message. Please try again or read the text."); } };
    setSpeakingId(id);
    if (!voice && fallback) setNotice(`This device has no dedicated ${languageInfo.label} voice. Its default voice will be used, so pronunciation may vary.`);
    else setNotice(voice ? `Playing with your device's ${languageInfo.label} voice.` : "No speech voice is installed on this device.");
    window.speechSynthesis.speak(utterance);
  };

  const speak = async (text, id) => {
    if (speakingId === id) { stopVoicePlayback(); return; }
    stopVoicePlayback();
    setSpeakingId(id);
    const controller = new AbortController();
    voiceRequestRef.current = controller;
    try {
      const response = await axios.post(`${API}/api/n-atlas/customer/speech`, { text, language }, {
        responseType: "blob", timeout: NATLAS_CLIENT_TIMEOUT_MS, signal: controller.signal, headers: visitorHeaders(),
      });
      const contentType = response.headers?.["content-type"] || response.data?.type || "";
      if (!contentType.toLowerCase().includes("audio/") || !response.data?.size) throw new Error("Server speech is not available.");
      const url = URL.createObjectURL(response.data);
      audioUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        if (mountedRef.current) setSpeakingId(null);
        if (audioUrlRef.current === url) { URL.revokeObjectURL(url); audioUrlRef.current = ""; }
        if (audioRef.current === audio) audioRef.current = null;
      };
      audio.onerror = () => {
        if (mountedRef.current) { setSpeakingId(null); setNotice("The voice message could not be played. Try again or read the answer."); }
        if (audioUrlRef.current === url) { URL.revokeObjectURL(url); audioUrlRef.current = ""; }
        if (audioRef.current === audio) audioRef.current = null;
      };
      await audio.play();
      setNotice(response.headers?.["x-elevoni-voice-note"] || "Playing TINKA's cloud voice message.");
      return;
    } catch (error) {
      if (error?.code === "ERR_CANCELED" || error?.name === "AbortError" || controller.signal.aborted) return;
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = "";
      audioRef.current = null;
      if (import.meta.env.VITE_ALLOW_DEVICE_TTS_FALLBACK === "true") {
        await speakWithDevice(text, id, controller.signal);
      } else {
        setSpeakingId(null);
        setNotice(error?.response?.data?.message || "Cloud voice is unavailable for this language right now. You can still read the response.");
      }
    } finally {
      if (voiceRequestRef.current === controller) voiceRequestRef.current = null;
    }
  };

  const send = async (value = input) => {
    const text = value.trim();
    if (!text || busy) return;
    const history = messages.slice(-8).map(({ role, text: body }) => ({ role, text: body.slice(0, 700) }));
    setMessages((current) => [...current, { id: `u-${Date.now()}`, role: "user", text }]);
    setInput("");
    setNotice("");
    setBusy(true);
    const controller = new AbortController();
    requestRef.current = controller;
    try {
      const response = await axios.post(`${API}/api/n-atlas/customer/chat`, { message: text, language, history }, { signal: controller.signal, timeout: NATLAS_CLIENT_TIMEOUT_MS, headers: visitorHeaders() });
      const result = response.data?.data;
      if (response.data?.success !== true || !result?.reply) throw new Error("Unexpected response from TINKA.");
      if (!mountedRef.current) return;
      setMessages((current) => [...current, { id: `a-${Date.now()}`, role: "assistant", text: result.reply, listings: Array.isArray(result.listings) ? result.listings : [], navigation: result.navigation || null }]);
    } catch (error) {
      if (!mountedRef.current || error?.code === "ERR_CANCELED" || error?.name === "AbortError") return;
      const message = getErrorMessage(error);
      setNotice(message);
      setMessages((current) => [...current, { id: `e-${Date.now()}`, role: "assistant", text: message, error: true, listings: [] }]);
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
      if (mountedRef.current) setBusy(false);
    }
  };

  const transcribe = async (blob, mimeType) => {
    if (!blob?.size) { setNotice("No voice was recorded. Please try again."); return; }
    if (blob.size > 12 * 1024 * 1024) { setNotice("That recording is too large. Please record a shorter message."); return; }
    const extension = mimeType.includes("mp4") ? "m4a" : mimeType.includes("ogg") ? "ogg" : "webm";
    const form = new FormData();
    form.append("file", blob, `tinka-voice.${extension}`);
    form.append("language", language);
    setBusy(true);
    setNotice("Listening to your voice message…");
    const controller = new AbortController();
    requestRef.current = controller;
    try {
      const response = await axios.post(`${API}/api/n-atlas/customer/transcribe`, form, { timeout: NATLAS_CLIENT_TIMEOUT_MS, signal: controller.signal, headers: visitorHeaders() });
      const transcript = response.data?.data?.text;
      if (!response.data?.success || typeof transcript !== "string" || !transcript.trim()) throw new Error("No clear words were detected. Try again or type your request.");
      setInput(transcript.trim());
      setNotice(response.data?.data?.notice || "Your words have been written below. Check them, then tap Send.");
    } catch (error) {
      if (error?.code !== "ERR_CANCELED" && error?.name !== "AbortError" && mountedRef.current) {
        setNotice(error.response?.data?.message || error.message || "TINKA could not understand that recording. Please try again.");
      }
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
      if (mountedRef.current) setBusy(false);
    }
  };

  const startRecording = async () => {
    setNotice("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setNotice("Voice recording is not supported in this browser. You can type your request instead.");
      return;
    }
    try {
      const stream = await requestMicrophoneStream({ onPrompt: () => setNotice(MICROPHONE_PERMISSION_HELP) });
      if (!mountedRef.current) { stream.getTracks().forEach((track) => track.stop()); return; }
      streamRef.current = stream;
      const supported = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
      const mimeType = supported.find((type) => MediaRecorder.isTypeSupported?.(type)) || "";
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data?.size) chunksRef.current.push(event.data); };
      recorder.onerror = () => setNotice("The recording stopped unexpectedly. Please try again.");
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType || "audio/webm" });
        chunksRef.current = [];
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
        setListening(false);
        void transcribe(blob, blob.type || "audio/webm");
      };
      recorderRef.current = recorder;
      recorder.start();
      setListening(true);
      setNotice("Recording… Speak clearly, then tap the microphone again to finish.");
    } catch (error) {
      if (mountedRef.current) {
        setNotice(error?.name === "NotAllowedError" ? `Microphone permission was denied. ${MICROPHONE_PERMISSION_HELP}` : "Could not open your microphone. Check your device settings and try again.");
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
    else setListening(false);
  };

  const resetChat = () => {
    requestRef.current?.abort();
    stopVoicePlayback();
    setMessages([]); setInput(""); setNotice(""); setBusy(false); setSpeakingId(null);
  };

  return (
    <main className="tinka-page">
      <Helmet>
        <title>TINKA | Elevoni Assistant</title>
        <meta name="description" content="Use TINKA to find agricultural products on Elevoni by voice or text." />
      </Helmet>
      <header className="tinka-header">
        <Link to="/" className="tinka-brand"><span className="tinka-brand-mark">T</span><span><strong>TINKA</strong><small>By Elevoni</small></span></Link>
        <Link to="/marketplace" className="tinka-marketplace-link">Marketplace</Link>
        <label className="tinka-language"><span>Choose language</span><select value={language} disabled={busy || listening} onChange={(event) => { const nextLanguage = event.target.value; setLanguage(nextLanguage); setNotice(nextLanguage === "ig-NG" ? "Igbo voice input is supported through cloud transcription, but an Igbo cloud speaking voice is not configured yet. You can read TINKA’s response." : nextLanguage === "pcm-NG" ? "Pidgin voice input uses Nigerian English recognition. Please review the transcript; spoken output is an English-voice approximation." : "Language selected. Voice input is processed in the cloud; cloud voice playback depends on the configured language voice."); }} aria-label="Choose TINKA language">{LANGUAGES.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select></label>
      </header>

      <section className="tinka-content" aria-label="TINKA customer assistant">
        {messages.length === 0 ? (
          <div className="tinka-welcome">
            <div className="tinka-welcome-icon" aria-hidden="true">T</div>
            <p className="tinka-eyebrow">YOUR ELEVONI MARKETPLACE ASSISTANT</p>
            <h1>{languageInfo.greeting}</h1>
            <p className="tinka-intro">You can speak or type. Tell me the product, quantity and where you need it. I’ll look for real listings on Elevoni.</p>
            <div className="tinka-quick-prompts">{languageInfo.quickPrompts.map((prompt) => <button type="button" key={prompt} onClick={() => send(prompt)} disabled={busy}>{prompt}</button>)}</div>
          </div>
        ) : (
          <div className="tinka-thread">
            <div className="tinka-thread-heading"><div><span>YOUR CONVERSATION</span><strong>Finding the right products</strong></div><button type="button" onClick={resetChat}>New chat</button></div>
            {messages.map((message) => (
              <article className={`tinka-message ${message.role}`} key={message.id}>
                <div className="tinka-message-mark">{message.role === "assistant" ? "T" : "You"}</div>
                <div className="tinka-message-body">
                  <strong>{message.role === "assistant" ? "TINKA" : "You"}</strong>
                  <p>{message.text}</p>
                  {message.role === "assistant" && !message.error && <button type="button" className={`tinka-play ${speakingId === message.id ? "playing" : ""}`} onClick={() => speak(message.text, message.id)}><FaVolumeUp aria-hidden="true" /> {speakingId === message.id ? "Stop voice message" : "Play voice message"}</button>}
                  {message.navigation?.path && <button type="button" className="tinka-navigation" onClick={() => navigate(message.navigation.path)}>{message.navigation.label} <FaArrowRight aria-hidden="true" /></button>}
                  {message.listings?.length > 0 && <div className="tinka-listings"><h3>Listings found</h3>{message.listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>}
                </div>
              </article>
            ))}
            {busy && <div className="tinka-loading" role="status"><span /><span /><span /> <small>TINKA is listening and preparing your answer…</small></div>}
            <div ref={conversationEndRef} />
          </div>
        )}
      </section>

      <section className="tinka-composer-area">
        {notice && <p className="tinka-notice" role="status">{notice}</p>}
        <form className="tinka-composer" onSubmit={(event) => { event.preventDefault(); void send(); }}>
          <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder={languageInfo.placeholder} rows={2} aria-label="Type what you are looking for" disabled={busy || listening} />
          <div className="tinka-composer-actions">
            <span>{listening ? "Recording your voice" : "Speak or type — it’s your choice"}</span>
            <div>
              <button type="button" className={`tinka-record ${listening ? "recording" : ""}`} onClick={listening ? stopRecording : startRecording} disabled={busy} aria-label={listening ? "Stop recording" : "Record a voice message"}>{listening ? <FaStop aria-hidden="true" /> : <FaMicrophone aria-hidden="true" />}<span>{listening ? "Stop" : "Speak"}</span></button>
              <button type="submit" className="tinka-send" disabled={!input.trim() || busy || listening} aria-label="Send message"><FaPaperPlane aria-hidden="true" /><span>Send</span></button>
            </div>
          </div>
        </form>
        <p className="tinka-disclaimer">TINKA helps you discover listings. It does not confirm stock, place orders or take payments. Voice recordings are transcribed by ElevenLabs; TINKA text responses are generated by N-ATLaS. Confirm quantity, final price and delivery before paying.</p>
        <p className="tinka-usage-note">To meet Awarri’s usage condition, N-ATLaS chat access is subject to a rolling 30-day user condition. If you are not signed in, a random browser ID is stored for this count; message content is not stored in the usage record.</p>
      </section>
      <footer className="tinka-footer"><span>Designed for simple access to agricultural markets</span><span>N-ATLaS intelligence · ElevenLabs cloud voice · Elevoni</span>
        <details className="tinka-attribution"><summary>About the technology</summary>
          <p>N-ATLaS is an initiative of the Federal Ministry of Communications, Innovation and Digital Economy, and powered by Awarri Technologies.</p>
          <p>Awarri Technologies and the Federal Government of Nigeria, developers of N-ATLaS (Hausa-ASR / Igbo-ASR / Yoruba-ASR / NigerianAccentedEnglish).</p>
        </details>
      </footer>
    </main>
  );
}
