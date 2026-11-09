import { useEffect, useMemo, useRef, useState } from "react";
import { assistantApi } from "../../api";
import { PRODUCT_CATEGORIES, PRODUCT_UNITS, SUBCATEGORIES_BY_CATEGORY } from "../../constants/categoryExport";
import { requestMicrophoneStream, MICROPHONE_PERMISSION_HELP } from "../../utils/microphone.js";
import "./NAtlas.css";


const MicIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8" /></svg>;
const StopIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>;
const VolumeIcon = () => <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7m3-10a9 9 0 0 1 0 13" /></svg>;
const SendIcon = () => <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>;

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
  { icon: "▤", title: "Record a sale", detail: "Add a sale by speaking naturally" },
  { icon: "⌕", title: "Understand my sales records", detail: "Learn from sales you have recorded" },
];

const LANGUAGE_ERROR_MESSAGES = {
  "en-NG": "Elevoni Assistant could not complete that request. Please try again.",
  "pcm-NG": "Elevoni Assistant no fit complete that request. Abeg try again.",
  "ha-NG": "Mataimakin Elevoni bai iya kammala wannan buƙatar ba. Da fatan za a sake gwadawa.",
  "ig-NG": "Onye enyemaka Elevoni enweghị ike imecha arịrịọ a. Biko nwaa ọzọ.",
  "yo-NG": "Olùrànlọ́wọ́ Elevoni kò lè parí ìbéèrè yìí. Jọ̀wọ́ tún gbìyànjú.",
};
const requestErrorMessage = (error, fallback, language = "en-NG") => {
  if (error?.code === "ERR_CANCELED" || error?.name === "AbortError") return "cancelled";
  return LANGUAGE_ERROR_MESSAGES[language] || LANGUAGE_ERROR_MESSAGES["en-NG"] || fallback;
};

const LANGUAGE_CONFIRMATIONS = {
  "en-NG": {
    listing: "Your product listing has been submitted to Elevoni for review. It is not live on the marketplace yet; it will become available to buyers only after approval.",
    sale: "Your sales record has been saved. It is labelled farmer-reported and unverified; it has not been independently verified by Elevoni.",
    duplicate: "This sales record had already been submitted. I have closed the draft to avoid recording it twice.",
  },
  "pcm-NG": {
    listing: "You don submit your product listing give Elevoni make dem review am. E never dey live for marketplace; buyers go see am only after approval.",
    sale: "I don save your sales record. I mark am as farmer-reported and unverified; Elevoni never independently verify am.",
    duplicate: "You don submit this sales record before. I don close the draft so we no go record am twice.",
  },
  "ha-NG": {
    listing: "An aika bayanin kayanka ga Elevoni domin a duba shi. Har yanzu bai bayyana a kasuwa ba; masu saye za su gan shi ne bayan an amince da shi.",
    sale: "An adana bayanan cinikinka. An nuna cewa kai ne ka bayar da rahoton, kuma ba a tantance shi da kansa ba tukuna.",
    duplicate: "An riga an aika da wannan bayanin ciniki. Na rufe wannan daftarin don kada a adana shi sau biyu.",
  },
  "ig-NG": {
    listing: "E zigalaara ngwaahịa gị na Elevoni ka e nyochaa ya. Ọ pụtabeghị n'ahịa; ndị na-azụ ahịa ga-ahụ ya naanị mgbe akwadoro ya.",
    sale: "Echekwala ndekọ ire ahịa gị. Akara ya dị ka nke onye ọrụ ugbo kọrọ, a nyochabeghịkwa ya n'onwe ya.",
    duplicate: "E tinyela ndekọ ire ahịa a na mbụ. Emechiela akwụkwọ a ka anyị ghara idekọ ya ugboro abụọ.",
  },
  "yo-NG": {
    listing: "A ti fi àkọsílẹ̀ ọjà rẹ ránṣẹ́ sí Elevoni fún àyẹ̀wò. Kò tíì sí lórí ọjà; àwọn oníbàárà yóò rí i lẹ́yìn tí a bá fọwọ́ sí i.",
    sale: "A ti fi àkọsílẹ̀ títà rẹ pamọ́. A samisi rẹ̀ gẹ́gẹ́ bí ìròyìn olùgbẹ̀, a kò tíì ṣe àyẹ̀wò rẹ̀ lọ́tọ̀.",
    duplicate: "A ti fi àkọsílẹ̀ títà yìí ránṣẹ́ tẹ́lẹ̀. Mo ti pa àkọsílẹ̀ àkànṣe náà kí a má bà a kọ ọ́ lẹ́ẹ̀mejì.",
  },
};

const createSalesSubmissionReference = () => {
  const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `sale-${id}`;
};

export default function NAtlas() {
  const [language, setLanguage] = useState(() => { const saved = localStorage.getItem("natlas-language"); return LANGUAGES.some((item) => item.code === saved) ? saved : "en-NG"; });
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState(null);
  const [salesDraft, setSalesDraft] = useState(null);
  const [savingListing, setSavingListing] = useState(false);
  const [savingSale, setSavingSale] = useState(false);
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
    const requestedCode = LANGUAGE_TTS_CODES[language] || language.slice(0, 2);
    const matchingVoice = voices.find((voice) => voice.lang?.toLowerCase() === language.toLowerCase()
      || voice.lang?.toLowerCase().startsWith(`${requestedCode.toLowerCase()}-`)
      || voice.lang?.toLowerCase() === requestedCode.toLowerCase());
    if (!matchingVoice) {
      setSpeakingMessage(null);
      setNotice(`No matching ${activeLanguage.label} voice is available on this device, and the cloud voice could not generate audio. The response is still available as text.`);
      return;
    }
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = matchingVoice.lang;
    utterance.voice = matchingVoice;
    utterance.onend = () => { if (mountedRef.current) setSpeakingMessage(null); };
    utterance.onerror = () => {
      if (mountedRef.current) {
        setSpeakingMessage(null);
        setNotice("Your device could not play this response. Try another browser voice or read the text response.");
      }
    };
    setSpeakingMessage(messageIndex);
    setNotice(`Playing with your device's ${activeLanguage.label} voice.`);
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
      const response = await assistantApi.post("/api/assistant/vendor/speech", { text, language }, { responseType: "blob", signal: controller.signal });
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
      if ("speechSynthesis" in window && typeof window.SpeechSynthesisUtterance !== "undefined") {
        await speakWithDevice(text, messageIndex, controller.signal);
      } else {
        setSpeakingMessage(null);
        setNotice(`Cloud voice could not generate ${activeLanguage.label} audio, and this browser does not support spoken playback. The text response is still available.`);
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
      const response = await assistantApi.post("/api/assistant/vendor/transcribe", form, { signal: controller.signal });
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
      const stream = await requestMicrophoneStream({ onPrompt: () => setNotice(MICROPHONE_PERMISSION_HELP) });
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
        setNotice(error?.name === "NotAllowedError" ? `Microphone permission was denied. ${MICROPHONE_PERMISSION_HELP}` : "Unable to access the microphone. Check your browser and device permissions.");
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
      const response = await assistantApi.post("/api/assistant/vendor/chat", {
        message: text,
        language,
        history: priorMessages,
      }, { signal: controller.signal });
      const result = response.data?.data;
      if (!response.data?.success || !result?.reply) throw new Error("Elevoni Assistant returned an unexpected response.");
      if (!mountedRef.current) return;
      if (result.draft) {
        setSalesDraft(null);
        setDraft((current) => ({
          name: result.draft.name || current?.name || "",
          category: result.draft.category || current?.category || "",
          subcategory: result.draft.subcategory || current?.subcategory || "",
          quantity: result.draft.quantity ?? current?.quantity ?? "",
          unit: result.draft.unit || current?.unit || PRODUCT_UNITS[0],
          price: result.draft.price ?? current?.price ?? "",
          description: result.draft.description || current?.description || "",
          originState: result.draft.originState || current?.originState || "",
          originLga: result.draft.originLga || current?.originLga || "",
          species: result.draft.species || current?.species || "",
          condition: result.draft.condition || current?.condition || "",
          productionMethod: result.draft.productionMethod || current?.productionMethod || "",
          weightRange: result.draft.weightRange || current?.weightRange || "",
          sourceText: result.draft.sourceText || text,
        }));
      }
      if (result.salesDraft) {
        setDraft(null);
        setSalesDraft((current) => ({
          submissionReference: current?.submissionReference || createSalesSubmissionReference(),
          productName: result.salesDraft.productName || current?.productName || "",
          unit: result.salesDraft.unit || current?.unit || "",
          quantity: result.salesDraft.quantity ?? current?.quantity ?? "",
          unitPrice: result.salesDraft.unitPrice ?? current?.unitPrice ?? "",
          saleDate: result.salesDraft.saleDate || current?.saleDate || "",
          salesChannel: result.salesDraft.salesChannel || current?.salesChannel || "",
          paymentStatus: result.salesDraft.paymentStatus || current?.paymentStatus || "",
          amountReceived: result.salesDraft.amountReceived ?? current?.amountReceived ?? "",
          fulfilmentStatus: result.salesDraft.fulfilmentStatus || current?.fulfilmentStatus || "pending",
          buyerIdentityStatus: result.salesDraft.buyerIdentityStatus || current?.buyerIdentityStatus || "unknown",
          buyerName: result.salesDraft.buyerName || current?.buyerName || "",
          buyerContact: result.salesDraft.buyerContact || current?.buyerContact || "",
          buyerState: result.salesDraft.buyerState || current?.buyerState || "",
          buyerArea: result.salesDraft.buyerArea || current?.buyerArea || "",
          saleTime: result.salesDraft.saleTime || current?.saleTime || "",
          notes: result.salesDraft.notes || current?.notes || "",
          sourceText: result.salesDraft.sourceText || text,
        }));
      }
      setMessages((current) => [...current, { role: "assistant", text: result.reply }]);
    } catch (error) {
      const errorMessage = requestErrorMessage(error, "Elevoni Assistant couldn't respond. Please try again.", language);
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
  const updateSalesDraft = (key, value) => setSalesDraft((current) => ({ ...current, [key]: value }));
  const draftReady = Boolean(draft && draft.name.trim() && draft.category && draft.subcategory && draft.unit && draft.quantity && Number(draft.quantity) > 0 && draft.price !== "" && Number(draft.price) > 0 && draft.originState?.trim());
  const saleTotal = Number(salesDraft?.quantity || 0) * Number(salesDraft?.unitPrice || 0);
  const resolvedAmountReceived = salesDraft?.paymentStatus === "paid" ? saleTotal : salesDraft?.paymentStatus === "unpaid" ? 0 : Number(salesDraft?.amountReceived || 0);
  const salesDraftReady = Boolean(salesDraft && salesDraft.productName?.trim() && salesDraft.unit && Number(salesDraft.quantity) > 0 && Number(salesDraft.unitPrice) > 0 && /^\d{4}-\d{2}-\d{2}$/.test(salesDraft.saleDate || "") && salesDraft.salesChannel && salesDraft.paymentStatus && Number.isFinite(resolvedAmountReceived) && resolvedAmountReceived >= 0 && resolvedAmountReceived <= saleTotal && (salesDraft.paymentStatus !== "partial" || (resolvedAmountReceived > 0 && resolvedAmountReceived < saleTotal)) && (salesDraft.buyerIdentityStatus !== "identified" || Boolean(salesDraft.buyerName?.trim() || salesDraft.buyerContact?.trim())) && (salesDraft.buyerIdentityStatus !== "anonymous" || (!salesDraft.buyerName?.trim() && !salesDraft.buyerContact?.trim())));

  const submitListing = async () => {
    if (!draftReady || savingListing) return;
    setSavingListing(true);
    setNotice("");
    try {
      const payload = {
        name: draft.name.trim(),
        description: draft.description || "",
        price: Number(draft.price),
        category: draft.category,
        subcategory: draft.subcategory,
        unitOfMeasure: draft.unit,
        stockQuantity: Number(draft.quantity),
        originLocation: { state: draft.originState.trim(), lga: draft.originLga || "" },
        species: draft.species || "",
        condition: draft.condition || "",
        productionMethod: draft.productionMethod || "",
        weightRange: draft.weightRange || "",
      };
      const response = await assistantApi.post("/api/products/vendor", payload);
      if (!response.data?.success) throw new Error(response.data?.message || "The listing could not be submitted.");
      setDraft(null);
      setMessages((current) => [...current, { role: "assistant", text: LANGUAGE_CONFIRMATIONS[language]?.listing || LANGUAGE_CONFIRMATIONS["en-NG"].listing }]);
      setNotice("Listing submitted for review.");
    } catch (error) {
      setNotice(error.response?.data?.message || error.message || "Unable to submit this listing. Please review the details and try again.");
    } finally {
      setSavingListing(false);
    }
  };

  const submitSalesRecord = async () => {
    if (!salesDraftReady || savingSale) return;
    setSavingSale(true);
    setNotice("");
    try {
      const payload = {
        submissionReference: salesDraft.submissionReference || createSalesSubmissionReference(),
        productName: salesDraft.productName.trim(),
        unit: salesDraft.unit,
        quantity: Number(salesDraft.quantity),
        unitPrice: Number(salesDraft.unitPrice),
        saleDate: salesDraft.saleDate,
        salesChannel: salesDraft.salesChannel,
        paymentStatus: salesDraft.paymentStatus,
        amountReceived: resolvedAmountReceived,
        fulfilmentStatus: salesDraft.fulfilmentStatus || "pending",
        buyerIdentityStatus: salesDraft.buyerIdentityStatus || "unknown",
        buyerName: salesDraft.buyerName || "",
        buyerContact: salesDraft.buyerContact || "",
        buyerState: salesDraft.buyerState || "",
        buyerArea: salesDraft.buyerArea || "",
        saleTime: salesDraft.saleTime || "",
        notes: salesDraft.notes || "",
      };
      const response = await assistantApi.post("/api/vendor/sales", payload);
      if (!response.data?.success) throw new Error(response.data?.message || "The sales record could not be saved.");
      setSalesDraft(null);
      setMessages((current) => [...current, { role: "assistant", text: LANGUAGE_CONFIRMATIONS[language]?.sale || LANGUAGE_CONFIRMATIONS["en-NG"].sale }]);
      setNotice("Sales record saved as farmer-reported and unverified.");
    } catch (error) {
      if (error.response?.status === 409 && error.response?.data?.duplicate) {
        setSalesDraft(null);
        setMessages((current) => [...current, { role: "assistant", text: LANGUAGE_CONFIRMATIONS[language]?.duplicate || LANGUAGE_CONFIRMATIONS["en-NG"].duplicate }]);
        setNotice("This sales record was already submitted.");
      } else {
        setNotice(error.response?.data?.message || error.message || "Unable to save this sales record. Please review the details and try again.");
      }
    } finally {
      setSavingSale(false);
    }
  };

  return (
    <section className="natlas-shell natlas-shell-simple">
      <div className="natlas-main">
        <header className="natlas-topbar">
          <div className="natlas-heading">
            <h1>Elevoni Assistant</h1>
            <p>Manage products and sales by voice or text.</p>
          </div>
          <div className="natlas-topbar-actions">
            <label className="natlas-language">
              <span>Language</span>
              <select value={language} disabled={busy || listening} onChange={(event) => {
                stopVoicePlayback();
                setLanguage(event.target.value);
                setMessages([]);
                setInput("");
                setDraft(null);
                setSalesDraft(null);
                setNotice(event.target.value === "pcm-NG" ? "Nigerian Pidgin selected. A new conversation will use this language." : `Language changed to ${LANGUAGES.find((item) => item.code === event.target.value)?.label || "the selected language"}. A new conversation has started.`);
              }} aria-label="Choose assistant language">
                {LANGUAGES.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
              </select>
            </label>
            <button type="button" className="natlas-new-chat" onClick={() => {
              cancelActiveRequest(); stopVoicePlayback(); setMessages([]); setDraft(null); setSalesDraft(null); setNotice("");
            }}>New chat</button>
          </div>
        </header>

        <div className="natlas-conversation">
          {messages.length === 0 ? (
            <div className="natlas-welcome">
              <h2>{activeLanguage.greeting}</h2>
              <p className="natlas-welcome-copy">What would you like to do?</p>
              <div className="natlas-suggestions">{suggestions.map((item) => <button key={item.title} onClick={() => send(item.title)}>
                <span aria-hidden="true">{item.icon}</span><strong>{item.title}</strong>
              </button>)}</div>
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
          <div className="natlas-draft-head"><div><span className="natlas-draft-label">ASSISTED PRODUCT LISTING</span><h3>Review your product details</h3></div><button onClick={() => setDraft(null)} aria-label="Close draft">×</button></div>
          <p className="natlas-draft-note">Check every detail. When you confirm, Elevoni submits this listing for administrative review. It will not appear in the marketplace until approved.</p>
          <p className="natlas-draft-note">I will collect missing details one question at a time in the chat below. Reply to each question in your own words. Nothing is submitted until you press the confirmation button.</p>
          <dl className="natlas-draft-summary">
            {[ ["Product", draft.name], ["Category", draft.category], ["Product type", draft.subcategory], ["Quantity", draft.quantity], ["Unit", draft.unit], ["Price per unit", draft.price ? `₦${Number(draft.price).toLocaleString("en-NG")}` : "Not provided"], ["State", draft.originState], ["LGA / area", draft.originLga], ["Description", draft.description] ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "Not provided yet"}</dd></div>)}
          </dl>
          <div className="natlas-draft-actions"><span>{draftReady ? "Review complete? Confirm to submit for approval." : "Complete the product name, category, subcategory, quantity, price and state."}</span><button type="button" onClick={submitListing} disabled={!draftReady || savingListing} className={draftReady ? "ready" : ""}>{savingListing ? "Submitting…" : "Confirm & submit listing"}</button></div>
        </section>}

        {salesDraft && <section className="natlas-draft natlas-sales-draft">
          <div className="natlas-draft-head"><div><span className="natlas-draft-label">VOICE SALES RECORD</span><h3>Review your sales details</h3></div><button onClick={() => setSalesDraft(null)} aria-label="Close sales draft">×</button></div>
          <p className="natlas-draft-note">Check the quantities and money carefully. This will be saved as a farmer-reported, unverified record. Elevoni will not treat it as a platform-verified sale.</p>
          <p className="natlas-draft-note">I will ask for missing sales details one at a time in the chat below. Please answer each question. This record remains farmer-reported and unverified.</p>
          <dl className="natlas-draft-summary">
            {[ ["Product sold", salesDraft.productName], ["Quantity", salesDraft.quantity], ["Unit", salesDraft.unit], ["Price per unit", salesDraft.unitPrice ? `₦${Number(salesDraft.unitPrice).toLocaleString("en-NG")}` : "Not provided"], ["Sale date", salesDraft.saleDate], ["Sales channel", salesDraft.salesChannel], ["Payment status", salesDraft.paymentStatus], ["Amount received", salesDraft.paymentStatus === "paid" ? `₦${saleTotal.toLocaleString("en-NG")}` : salesDraft.paymentStatus === "unpaid" ? "₦0" : salesDraft.amountReceived ? `₦${Number(salesDraft.amountReceived).toLocaleString("en-NG")}` : "Not provided"], ["Fulfilment", salesDraft.fulfilmentStatus], ["Buyer", salesDraft.buyerIdentityStatus === "anonymous" ? "Anonymous" : salesDraft.buyerName || "Not provided"] ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "Not provided yet"}</dd></div>)}
          </dl>
          <div className="natlas-sales-total"><span>Sale total</span><strong>₦{Number.isFinite(saleTotal) ? saleTotal.toLocaleString("en-NG") : "0"}</strong><span>Balance due</span><strong>₦{Math.max(0, saleTotal - resolvedAmountReceived).toLocaleString("en-NG")}</strong></div>
          <div className="natlas-draft-actions"><span>{salesDraftReady ? "Review the record, then confirm to save." : "Complete product, quantity, unit, unit price, date, sales channel and payment details."}</span><button type="button" onClick={submitSalesRecord} disabled={!salesDraftReady || savingSale} className={salesDraftReady ? "ready" : ""}>{savingSale ? "Saving…" : "Confirm & save sales record"}</button></div>
        </section>}

        <div className="natlas-composer-wrap">
          {notice && <p className="natlas-notice" role="status">{notice}</p>}
          <form className="natlas-composer" onSubmit={(event) => { event.preventDefault(); send(); }}>
            <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} placeholder={activeLanguage.placeholder} rows={1} aria-label="Type a message to Elevoni Assistant" />
            <div className="natlas-composer-tools"><span className="natlas-input-hint">Review details before saving.</span><div>{busy && <button type="button" className="natlas-cancel" onClick={cancelActiveRequest}>Cancel</button>}<button type="button" className={`natlas-mic ${listening ? "recording" : ""}`} disabled={busy} onClick={listening ? stopListening : startListening} aria-label={listening ? "Stop recording" : "Start voice input"}>{listening ? <StopIcon /> : <MicIcon />}</button><button type="submit" className="natlas-send" disabled={!input.trim() || busy || listening} aria-label="Send message"><SendIcon /><span>Send</span></button></div></div>
          </form>
          <p className="natlas-disclaimer">Answer one question at a time. Review the completed details, then confirm before submitting. Sales records are farmer-reported until independently verified.</p>
        </div>
      </div>
    </section>
  );
}
