export async function startSpeechRecognition(): Promise<{
  start: () => void;
  stop: () => void;
  isListening: boolean;
  transcript: string;
}> {
  const SpeechRecognition = 
    typeof window !== 'undefined' 
      ? (window.SpeechRecognition || (window as any).webkitSpeechRecognition)
      : null;

  if (!SpeechRecognition) {
    throw new Error('Speech Recognition API not supported in this browser');
  }

  const recognition = new SpeechRecognition();
  let isListening = false;
  let transcript = '';

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'hi-IN'; // Default to Hindi

  recognition.onstart = () => {
    isListening = true;
  };

  recognition.onresult = (event: any) => {
    transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
  };

  recognition.onend = () => {
    isListening = false;
  };

  return {
    start: () => recognition.start(),
    stop: () => recognition.stop(),
    isListening,
    transcript,
  };
}

export async function textToSpeech(text: string): Promise<void> {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'hi-IN';
  utterance.rate = 1;
  utterance.pitch = 1;

  return new Promise((resolve) => {
    utterance.onend = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined') {
    window.speechSynthesis.cancel();
  }
}

export const SPEECH_LANGUAGES = [
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'en-IN', name: 'English (India)' },
  { code: 'en-US', name: 'English (US)' },
];
