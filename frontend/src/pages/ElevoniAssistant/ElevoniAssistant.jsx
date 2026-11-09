import { useContext, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import axios from "axios";
import { FaMicrophone, FaStop, FaVolumeUp, FaPaperPlane, FaArrowRight } from "react-icons/fa";
import { resolveApiBaseUrl } from "../../utils/apiBase";
import { formatNaira, marketplaceEnquiryUrl } from "../../utils/marketplace";
import { ASSISTANT_CLIENT_TIMEOUT_MS, ASSISTANT_TRANSCRIPTION_TIMEOUT_MS } from "../../../../shared/assistantConfig.mjs";
import { getAssistantVisitorId } from "../../../../shared/assistantVisitor.mjs";
import { StoreContext } from "../../context/StoreContext";
import "./ElevoniAssistant.css";

const API = resolveApiBaseUrl();
const LANGUAGES = [
  { code: "en-NG", label: "English", greeting: "Hello! What are you looking for today?", placeholder: "Tell me what you need…", quickPrompts: ["I want to buy chickens", "Find rice sellers", "Show me the marketplace"] },
  { code: "pcm-NG", label: "Pidgin", greeting: "How far! Wetin you dey find today?", placeholder: "Tell me wetin you need…", quickPrompts: ["I wan buy chicken", "Find people wey dey sell rice", "Show me market"] },
  { code: "ha-NG", label: "Hausa", greeting: "Sannu! Me kake nema a yau?", placeholder: "Faɗa min abin da kake nema…", quickPrompts: ["Ina son sayen kaji", "Nemo masu sayar da shinkafa", "Nuna min kasuwa"] },
  { code: "yo-NG", label: "Yorùbá", greeting: "Ẹ káàbọ̀! Kí ni ẹ ń wá lónìí?", placeholder: "Sọ ohun tí o ń wá…", quickPrompts: ["Mo fẹ́ ra adìẹ", "Wa àwọn tó ń ta ìrẹsì", "Fi ọjà hàn mí"] },
  { code: "ig-NG", label: "Igbo", greeting: "Ndewo! Kedu ihe ị na-achọ taa?", placeholder: "Gwa m ihe ị na-achọ…", quickPrompts: ["Achọrọ m ịzụta ọkụkọ", "Chọta ndị na-ere osikapa", "Gosi m ahịa"] },
];

function getErrorMessage(error) {
  if (error?.code === "ERR_CANCELED" || error?.name === "AbortError") return "Request cancelled.";
  if (error?.code === "ECONNABORTED" || error?.code === "ETIMEDOUT") return "Elevoni Assistant is taking longer than expected. Please try again.";
  return error?.response?.data?.message || "Elevoni Assistant could not complete that request. Please try again.";
}

function ListingCard({ listing }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageSrc = !listing.image ? "" : /^https?:\/\//i.test(listing.image)
    ? listing.image
    : listing.image.startsWith("/") ? `${API}${listing.image}` : `${API}/images/${listing.image}`;
  return (
    <article className="elevoni-assistant-listing">
      {imageSrc && !imageFailed ? <img src={imageSrc} alt={listing.name} loading="lazy" onError={() => setImageFailed(true)} /> : <div className="elevoni-assistant-listing-placeholder" aria-hidden="true">E</div>}
      <div className="elevoni-assistant-listing-content">
        <strong>{listing.name}</strong>
        <span className="elevoni-assistant-listing-price">{listing.pricePrefix ? `${listing.pricePrefix} ` : ""}{formatNaira(listing.price)} / {listing.unit || "unit"}</span>
        <span className="elevoni-assistant-listing-vendor">{listing.vendorName || "Approved Elevoni vendor"}</span>
        <span className="elevoni-assistant-listing-location">{[listing.lga, listing.state].filter(Boolean).join(", ") || "Location not provided"}</span>
        {listing.availability && <span className="elevoni-assistant-listing-location">{listing.availability}</span>}
        {listing.matchReasons?.length > 0 && <small className="elevoni-assistant-stock-note">Matched on: {listing.matchReasons.join(", ")}</small>}
        {listing.stockMatch === "sufficient" && <small className="elevoni-assistant-stock-note">Recorded stock meets the requested quantity</small>}
        {listing.stockMatch === "not_confirmed" && <small className="elevoni-assistant-stock-note">Confirm current stock with the seller</small>}
        <div className="elevoni-assistant-listing-actions">
          <Link to={`/product/${listing.id}`}>View listing <FaArrowRight aria-hidden="true" /></Link>
          <a href={marketplaceEnquiryUrl({ name: listing.name, vendorId: { businessName: listing.vendorName } })} target="_blank" rel="noreferrer">Enquire</a>
        </div>
      </div>
    </article>
  );
}

export default function ElevoniAssistant() {
  const navigate = useNavigate();
  const { cartItems, fish_list, setCartQuantity } = useContext(StoreContext);
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem("elevoni-assistant-customer-language") || localStorage.getItem("tinka-customer-language") || localStorage.getItem("konekta-customer-language");
    return LANGUAGES.some((item) => item.code === saved) ? saved : "en-NG";
  });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [notice, setNotice] = useState("");
  const [speakingId, setSpeakingId] = useState(null);
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

  useEffect(() => { localStorage.setItem("elevoni-assistant-customer-language", language); }, [language]);
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

  const authHeaders = () => {
    const headers = { "X-Elevoni-Visitor-ID": getAssistantVisitorId() };
    try {
      const token = window.localStorage.getItem("token");
      if (token) headers.token = token;
    } catch { /* public storefront requests can remain anonymous */ }
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
    const languagePrefix = language === "pcm-NG" ? "pcm" : language.slice(0, 2);
    const voice = voices.find((item) => item.lang?.toLowerCase() === language.toLowerCase()
      || item.lang?.toLowerCase().startsWith(`${languagePrefix.toLowerCase()}-`)
      || item.lang?.toLowerCase() === languagePrefix.toLowerCase());
    if (!voice) {
      setSpeakingId(null);
      setNotice(`No matching ${languageInfo.label} voice is available on this device, and the cloud voice could not generate audio. The response is still available as text.`);
      return;
    }
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = voice.lang;
    utterance.voice = voice;
    utterance.rate = 0.96;
    utterance.onend = () => { if (mountedRef.current) setSpeakingId(null); };
    utterance.onerror = () => { if (mountedRef.current) { setSpeakingId(null); setNotice("Your device could not play this voice message. Please try again or read the text."); } };
    setSpeakingId(id);
    setNotice(`Playing with your device's ${languageInfo.label} voice.`);
    window.speechSynthesis.speak(utterance);
  };

  const speak = async (text, id) => {
    if (speakingId === id) { stopVoicePlayback(); return; }
    stopVoicePlayback();
    setSpeakingId(id);
    const controller = new AbortController();
    voiceRequestRef.current = controller;
    try {
      const response = await axios.post(`${API}/api/assistant/customer/speech`, { text, language }, {
        responseType: "blob", timeout: ASSISTANT_CLIENT_TIMEOUT_MS, signal: controller.signal, headers: authHeaders(),
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
      setNotice(response.headers?.["x-elevoni-voice-note"] || "Playing Elevoni Assistant's cloud voice message.");
      return;
    } catch (error) {
      if (error?.code === "ERR_CANCELED" || error?.name === "AbortError" || controller.signal.aborted) return;
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = "";
      audioRef.current = null;
      if ("speechSynthesis" in window && typeof window.SpeechSynthesisUtterance !== "undefined") {
        await speakWithDevice(text, id, controller.signal);
      } else {
        setSpeakingId(null);
        setNotice(`Cloud voice could not generate ${languageInfo.label} audio, and this browser does not support spoken playback. The text response is still available.`);
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
      const cartContext = fish_list
        .filter((product) => Number(cartItems?.[product._id] || 0) > 0)
        .slice(0, 30)
        .map((product) => ({ id: product._id, name: product.name, quantity: Number(cartItems[product._id]) }));
      const response = await axios.post(`${API}/api/assistant/customer/chat`, { message: text, language, history, cart: cartContext }, { signal: controller.signal, timeout: ASSISTANT_CLIENT_TIMEOUT_MS, headers: authHeaders() });
      const result = response.data?.data;
      if (response.data?.success !== true || !result?.reply) throw new Error("Unexpected response from Elevoni Assistant.");
      let cartSyncFailed = false;
      for (const action of Array.isArray(result.cartActions) ? result.cartActions : []) {
        if (action?.type !== "set_quantity" || typeof action.productId !== "string" || !Number.isSafeInteger(action.quantity) || action.quantity < 0) continue;
        const synced = await setCartQuantity(action.productId, action.quantity);
        if (synced === false || synced === "forbidden") cartSyncFailed = true;
      }
      if (!mountedRef.current) return;
      if (cartSyncFailed) setNotice("Your cart was updated on this device, but account synchronisation needs attention. Please check your cart before checkout.");
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
    form.append("file", blob, `elevoni-assistant-voice.${extension}`);
    form.append("language", language);
    setBusy(true);
    setNotice("Listening to your voice message…");
    const controller = new AbortController();
    requestRef.current = controller;
    try {
      const response = await axios.post(`${API}/api/assistant/customer/transcribe`, form, { timeout: ASSISTANT_TRANSCRIPTION_TIMEOUT_MS, signal: controller.signal, headers: authHeaders() });
      const transcript = response.data?.data?.text;
      if (!response.data?.success || typeof transcript !== "string" || !transcript.trim()) throw new Error("No clear words were detected. Try again or type your request.");
      setInput(transcript.trim());
      setNotice(response.data?.data?.notice || "Your words have been written below. Check them, then tap Send.");
    } catch (error) {
      if (error?.code !== "ERR_CANCELED" && error?.name !== "AbortError" && mountedRef.current) {
        setNotice(error.response?.data?.message || error.message || "Elevoni Assistant could not understand that recording. Please try again.");
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
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
        setNotice(error?.name === "NotAllowedError" ? "Microphone permission was denied. Allow microphone access in your browser settings." : "Could not open your microphone. Check your device settings and try again.");
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
    <main className="elevoni-assistant-page">
      <Helmet>
        <title>Elevoni Assistant | Elevoni Farms</title>
        <meta name="description" content="Use Elevoni Assistant to find agricultural products on Elevoni by voice or text." />
      </Helmet>
      <header className="elevoni-assistant-toolbar">
        <div className="elevoni-assistant-page-heading">
          <h1>Elevoni Assistant</h1>
          <p>Find products by speaking or typing.</p>
        </div>
        <label className="elevoni-assistant-language">
          <span>Language</span>
          <select value={language} disabled={busy || listening} onChange={(event) => {
            const nextLanguage = event.target.value;
            stopVoicePlayback();
            setLanguage(nextLanguage);
            setMessages([]);
            setInput("");
            setNotice(nextLanguage === "pcm-NG" ? "Nigerian Pidgin selected. A new conversation will use this language." : `Language changed to ${LANGUAGES.find((item) => item.code === nextLanguage)?.label || "the selected language"}. A new conversation has started.`);
          }} aria-label="Choose Elevoni Assistant language">
            {LANGUAGES.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
          </select>
        </label>
      </header>

      <section className="elevoni-assistant-content" aria-label="Elevoni Assistant customer assistant">
        {messages.length === 0 ? (
          <div className="elevoni-assistant-welcome">
            <h2>{languageInfo.greeting}</h2>
            <p className="elevoni-assistant-intro">What do you need today?</p>
            <div className="elevoni-assistant-quick-prompts">{languageInfo.quickPrompts.map((prompt) => <button type="button" key={prompt} onClick={() => send(prompt)} disabled={busy}>{prompt}</button>)}</div>
          </div>
        ) : (
          <div className="elevoni-assistant-thread">
            <div className="elevoni-assistant-thread-heading"><strong>Conversation</strong><button type="button" onClick={resetChat}>New chat</button></div>
            {messages.map((message) => (
              <article className={`elevoni-assistant-message ${message.role}`} key={message.id}>
                <div className="elevoni-assistant-message-mark">{message.role === "assistant" ? "E" : "You"}</div>
                <div className="elevoni-assistant-message-body">
                  <strong>{message.role === "assistant" ? "Elevoni Assistant" : "You"}</strong>
                  <p>{message.text}</p>
                  {message.role === "assistant" && !message.error && <button type="button" className={`elevoni-assistant-play ${speakingId === message.id ? "playing" : ""}`} onClick={() => speak(message.text, message.id)}><FaVolumeUp aria-hidden="true" /> {speakingId === message.id ? "Stop voice message" : "Play voice message"}</button>}
                  {message.navigation?.path && <button type="button" className="elevoni-assistant-navigation" onClick={() => navigate(message.navigation.path)}>{message.navigation.label} <FaArrowRight aria-hidden="true" /></button>}
                  {message.listings?.length > 0 && <div className="elevoni-assistant-listings"><h3>Listings found</h3>{message.listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>}
                </div>
              </article>
            ))}
            {busy && <div className="elevoni-assistant-loading" role="status"><span /><span /><span /> <small>Elevoni Assistant is listening and preparing your answer…</small></div>}
            <div ref={conversationEndRef} />
          </div>
        )}
      </section>

      <section className="elevoni-assistant-composer-area">
        {notice && <p className="elevoni-assistant-notice" role="status">{notice}</p>}
        <form className="elevoni-assistant-composer" onSubmit={(event) => { event.preventDefault(); void send(); }}>
          <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder={languageInfo.placeholder} rows={2} aria-label="Type what you are looking for" disabled={busy || listening} />
          <div className="elevoni-assistant-composer-actions">
            <span>{listening ? "Recording…" : "Speak or type"}</span>
            <div>
              <button type="button" className={`elevoni-assistant-record ${listening ? "recording" : ""}`} onClick={listening ? stopRecording : startRecording} disabled={busy} aria-label={listening ? "Stop recording" : "Record a voice message"}>{listening ? <FaStop aria-hidden="true" /> : <FaMicrophone aria-hidden="true" />}<span>{listening ? "Stop" : "Speak"}</span></button>
              <button type="submit" className="elevoni-assistant-send" disabled={!input.trim() || busy || listening} aria-label="Send message"><FaPaperPlane aria-hidden="true" /><span>Send</span></button>
            </div>
          </div>
        </form>
        <p className="elevoni-assistant-disclaimer">Check availability, final price and delivery with the seller before paying.</p>
        <p className="elevoni-assistant-attribution">AI by <strong>OpenAI</strong> <span aria-hidden="true">·</span> Voice by <strong>ElevenLabs</strong></p>
      </section>

    </main>
  );
}
