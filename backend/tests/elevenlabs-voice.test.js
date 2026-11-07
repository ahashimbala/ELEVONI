import test from "node:test";
import assert from "node:assert/strict";
import { transcribeElevenLabs, speakElevenLabs } from "../services/elevenLabsVoice.js";

const baseEnv = {
  ELEVENLABS_API_KEY: "test-key",
  ELEVENLABS_STT_MODEL: "scribe_v2",
  ELEVENLABS_TTS_MODEL: "eleven_v3",
  ELEVENLABS_HAUSA_VOICE_ID: "hausa-voice-id",
  ELEVENLABS_YORUBA_VOICE_ID: "yoruba-voice-id",
  ELEVENLABS_IGBO_VOICE_ID: "igbo-voice-id",
  ELEVENLABS_ENGLISH_VOICE_ID: "english-voice-id",
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

test("ElevenLabs transcription uses Scribe v2 and maps Hausa language correctly", async () => {
  let captured;
  const result = await transcribeElevenLabs({
    audio: Buffer.from("audio"), filename: "voice.webm", mimeType: "audio/webm", language: "ha-NG", env: baseEnv,
    fetchImpl: async (url, options) => {
      captured = { url, options };
      return jsonResponse({ text: "Ina neman kaji", language_code: "hau", language_probability: 0.96 });
    },
  });
  assert.equal(captured.url, "https://api.elevenlabs.io/v1/speech-to-text");
  assert.equal(captured.options.headers["xi-api-key"], "test-key");
  assert.equal(captured.options.body.get("model_id"), "scribe_v2");
  assert.equal(captured.options.body.get("language_code"), "hau");
  assert.equal(result.text, "Ina neman kaji");
  assert.equal(result.provider, "elevenlabs");
});

test("Pidgin transcription is explicitly marked as Nigerian English approximation", async () => {
  const result = await transcribeElevenLabs({
    audio: Buffer.from("audio"), language: "pcm-NG", env: baseEnv,
    fetchImpl: async (_url, options) => {
      assert.equal(options.body.get("language_code"), "eng");
      return jsonResponse({ text: "I wan buy chicken", language_code: "eng" });
    },
  });
  assert.match(result.notice, /Nigerian English recognition/);
});

test("ElevenLabs transcription fails closed without a server API key", async () => {
  await assert.rejects(
    transcribeElevenLabs({ audio: Buffer.from("audio"), env: {} }),
    (error) => error.code === "ELEVENLABS_NOT_CONFIGURED" && error.status === 503,
  );
});

test("ElevenLabs speech uses configured Hausa voice and returns MP3 audio", async () => {
  let captured;
  const result = await speakElevenLabs({
    text: "Sannu", language: "ha-NG", env: baseEnv,
    fetchImpl: async (url, options) => {
      captured = { url, options };
      return new Response(Buffer.from("mp3-audio"), { status: 200, headers: { "content-type": "audio/mpeg" } });
    },
  });
  assert.match(captured.url, /text-to-speech\/hausa-voice-id\?output_format=mp3_44100_128$/);
  assert.equal(captured.options.headers["xi-api-key"], "test-key");
  assert.equal(JSON.parse(captured.options.body).language_code, "ha");
  assert.equal(JSON.parse(captured.options.body).model_id, "eleven_v3");
  assert.equal(result.contentType, "audio/mpeg");
  assert.equal(result.audio.toString(), "mp3-audio");
});

test("Igbo cloud speech uses its dedicated voice ID and Igbo language code", async () => {
  let captured;
  const result = await speakElevenLabs({
    text: "Ndewo, kedu ka ị mere?", language: "ig-NG", env: baseEnv,
    fetchImpl: async (url, options) => {
      captured = { url, options };
      return new Response(Buffer.from("igbo-mp3"), { status: 200, headers: { "content-type": "audio/mpeg" } });
    },
  });
  assert.match(captured.url, /text-to-speech\/igbo-voice-id\?output_format=mp3_44100_128$/);
  assert.equal(JSON.parse(captured.options.body).language_code, "ig");
  assert.equal(JSON.parse(captured.options.body).model_id, "eleven_v3");
  assert.equal(result.audio.toString(), "igbo-mp3");
  assert.match(result.note, /Igbo/);
});

test("Igbo cloud speech requires its dedicated voice ID", async () => {
  await assert.rejects(
    speakElevenLabs({ text: "Ndewo", language: "ig-NG", env: { ...baseEnv, ELEVENLABS_IGBO_VOICE_ID: "" } }),
    (error) => error.code === "ELEVENLABS_VOICE_NOT_CONFIGURED" && error.status === 503,
  );
});

test("Hausa cloud speech requires a configured voice ID", async () => {
  await assert.rejects(
    speakElevenLabs({ text: "Sannu", language: "ha-NG", env: { ELEVENLABS_API_KEY: "test-key" } }),
    (error) => error.code === "ELEVENLABS_VOICE_NOT_CONFIGURED" && error.status === 503,
  );
});

test("ElevenLabs provider rate limits are returned as HTTP 429", async () => {
  await assert.rejects(
    transcribeElevenLabs({ audio: Buffer.from("audio"), env: baseEnv, fetchImpl: async () => new Response("rate limited", { status: 429 }) }),
    (error) => error.code === "ELEVENLABS_RATE_LIMITED" && error.status === 429,
  );
});
