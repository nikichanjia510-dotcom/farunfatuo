interface SpeechRecognitionResultLike {
  0: { transcript: string };
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}

type VoiceWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

export function canRecognizeSpeech(): boolean {
  const voiceWindow = window as VoiceWindow;
  return Boolean(
    voiceWindow.SpeechRecognition ?? voiceWindow.webkitSpeechRecognition,
  );
}

export function startSpeechRecognition(callbacks: {
  onResult: (text: string) => void;
  onEnd: () => void;
  onError: () => void;
}): SpeechRecognitionLike | null {
  const voiceWindow = window as VoiceWindow;
  const Recognition =
    voiceWindow.SpeechRecognition ?? voiceWindow.webkitSpeechRecognition;
  if (!Recognition) return null;
  const recognition = new Recognition();
  recognition.lang = 'zh-CN';
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.onresult = (event) => {
    const transcript = event.results[0]?.[0]?.transcript;
    if (transcript) callbacks.onResult(transcript);
  };
  recognition.onerror = callbacks.onError;
  recognition.onend = callbacks.onEnd;
  recognition.start();
  return recognition;
}

export function speak(text: string): void {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = 0.9;
  utterance.pitch = 1.08;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}
