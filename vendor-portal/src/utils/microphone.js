export async function requestMicrophoneStream({ onPrompt } = {}) {
  if (!navigator.mediaDevices?.getUserMedia) {
    const error = new Error("Microphone recording is not supported in this browser.");
    error.name = "NotSupportedError";
    throw error;
  }

  // The Permissions API is advisory and is not implemented consistently on
  // mobile Safari. Fall back to getUserMedia when the descriptor is unsupported.
  let permissionState = "prompt";
  if (navigator.permissions?.query) {
    try {
      const permission = await navigator.permissions.query({ name: "microphone" });
      permissionState = permission.state;
    } catch {
      permissionState = "prompt";
    }
  }

  if (permissionState === "denied") {
    const error = new Error("Microphone access is blocked in browser or device settings.");
    error.name = "NotAllowedError";
    throw error;
  }
  if (permissionState !== "granted") onPrompt?.();

  return navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  });
}

export const MICROPHONE_PERMISSION_HELP = "When prompted, choose ‘Always allow’ or ‘Allow while using this app’ if your browser offers it. A persistent grant prevents repeat prompts. Elevoni cannot select the browser's permission choice for you.";
