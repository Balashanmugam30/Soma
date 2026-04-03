"use client";

import { useState } from "react";

type SpeechRecognitionResultEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type SpeechRecognitionErrorEvent = {
  error: string;
};

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

type SpeechWindow = Window &
  typeof globalThis & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

export function useSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recognitionSupported =
    typeof window !== "undefined" &&
    Boolean(
      (window as SpeechWindow).SpeechRecognition ||
        (window as SpeechWindow).webkitSpeechRecognition,
    );

  const synthesisSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  async function listenOnce() {
    if (!recognitionSupported) {
      throw new Error("Speech recognition is not supported in this browser.");
    }

    const SpeechRecognition =
      (window as SpeechWindow).SpeechRecognition ||
      (window as SpeechWindow).webkitSpeechRecognition;

    return new Promise<string>((resolve, reject) => {
      if (!SpeechRecognition) {
        reject(new Error("Speech recognition is not supported in this browser."));
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = navigator.language || "en-US";
      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript ?? "";
        resolve(transcript);
      };
      recognition.onerror = (event) => {
        reject(new Error(event.error || "Unable to capture voice input."));
      };
      recognition.onend = () => {
        setIsListening(false);
      };

      setIsListening(true);
      recognition.start();
    });
  }

  function speak(text: string) {
    if (!synthesisSupported) {
      throw new Error("Speech synthesis is not supported in this browser.");
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  return {
    isListening,
    isSpeaking,
    recognitionSupported,
    synthesisSupported,
    listenOnce,
    speak,
  };
}
