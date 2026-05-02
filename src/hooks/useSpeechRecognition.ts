import { useCallback, useEffect, useRef, useState } from 'react';

// Web Speech API type declarations (not in standard lib.dom.d.ts)
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onstart: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: ISpeechRecognition, ev: ISpeechRecognitionEvent) => void) | null;
  onerror: ((this: ISpeechRecognition, ev: ISpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => void) | null;
}

interface ISpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: ISpeechRecognitionResultList;
}

interface ISpeechRecognitionResultList {
  length: number;
  item(index: number): ISpeechRecognitionResult;
  [index: number]: ISpeechRecognitionResult;
}

interface ISpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): ISpeechRecognitionAlternative;
  [index: number]: ISpeechRecognitionAlternative;
}

interface ISpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface ISpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

type ISpeechRecognitionConstructor = new () => ISpeechRecognition;

// ───────────────────────────────────────────────

type SpeechStatus = 'idle' | 'listening' | 'processing' | 'error';

interface UseSpeechRecognitionResult {
  status: SpeechStatus;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  supported: boolean;
  startListening: () => void;
  stopListening: () => void;
}

export function useSpeechRecognition(
  onResult: (transcript: string) => void
): UseSpeechRecognitionResult {
  const [status, setStatus] = useState<SpeechStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const statusRef = useRef<SpeechStatus>('idle');

  // Keep statusRef in sync
  useEffect(() => { statusRef.current = status; }, [status]);

  const getAPI = (): ISpeechRecognitionConstructor | undefined => {
    if (typeof window === 'undefined') return undefined;
    return (
      (window as unknown as { SpeechRecognition?: ISpeechRecognitionConstructor }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: ISpeechRecognitionConstructor }).webkitSpeechRecognition
    );
  };

  const supported = !!getAPI();

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setStatus('idle');
    setInterimTranscript('');
  }, []);

  const startListening = useCallback(() => {
    const API = getAPI();
    if (!API) {
      setError('Speech recognition not supported in this browser. Please type instead.');
      return;
    }
    setError(null);
    setTranscript('');
    setInterimTranscript('');

    const recognition = new API();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 3;

    recognition.onstart = () => setStatus('listening');

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setInterimTranscript(interim);
      if (final) {
        setTranscript(final.trim());
        setStatus('processing');
        onResult(final.trim());
      }
    };

    recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
      const msg =
        event.error === 'no-speech'
          ? 'No speech detected. Try again.'
          : event.error === 'not-allowed'
          ? 'Microphone access denied. Please enable it in browser settings.'
          : `Speech error: ${event.error}`;
      setError(msg);
      setStatus('error');
    };

    recognition.onend = () => {
      if (statusRef.current === 'listening') setStatus('idle');
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;
    recognition.start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onResult]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  return {
    status,
    transcript,
    interimTranscript,
    error,
    supported,
    startListening,
    stopListening,
  };
}
