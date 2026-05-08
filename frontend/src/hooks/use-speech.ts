"use client";

import { useRef, useState } from "react";
import { postSpeechToText, postTextToSpeech } from "@/services/api";
import type { Language } from "@/types";

export function useSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const cancelledRef = useRef(false);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const playbackResolveRef = useRef<(() => void) | null>(null);

  const recognitionSupported =
    typeof window !== "undefined" &&
    "MediaRecorder" in window &&
    Boolean(navigator.mediaDevices?.getUserMedia);

  const synthesisSupported = typeof window !== "undefined" && "Audio" in window;

  async function listenOnce(language: Language = "en") {
    if (!recognitionSupported) {
      throw new Error("Speech recognition is not supported in this browser.");
    }

    return new Promise<string>((resolve, reject) => {
      void navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          streamRef.current = stream;
          chunksRef.current = [];
          cancelledRef.current = false;

          const preferredMimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
            ? "audio/webm;codecs=opus"
            : "audio/webm";
          const recorder = new MediaRecorder(stream, { mimeType: preferredMimeType });
          mediaRecorderRef.current = recorder;

          recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              chunksRef.current.push(event.data);
            }
          };

          recorder.onerror = () => {
            setIsListening(false);
            setIsProcessingVoice(false);
            reject(new Error("Unable to capture voice input."));
          };

          recorder.onstop = async () => {
            stream.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
            mediaRecorderRef.current = null;
            setIsListening(false);

            if (cancelledRef.current) {
              chunksRef.current = [];
              setIsProcessingVoice(false);
              resolve("");
              return;
            }

            if (chunksRef.current.length === 0) {
              setIsProcessingVoice(false);
              reject(new Error("Unable to capture voice input."));
              return;
            }

            setIsProcessingVoice(true);

            try {
              const audioBlob = new Blob(chunksRef.current, {
                type: recorder.mimeType || "audio/webm",
              });
              chunksRef.current = [];
              const transcript = await postSpeechToText(audioBlob, language);
              resolve(transcript);
            } catch (error) {
              reject(
                error instanceof Error
                  ? error
                  : new Error("Unable to capture voice input."),
              );
            } finally {
              setIsProcessingVoice(false);
            }
          };

          setIsListening(true);
          setIsProcessingVoice(false);
          recorder.start();
        })
        .catch(() => {
          setIsListening(false);
          setIsProcessingVoice(false);
          reject(new Error("Speech recognition is not supported in this browser."));
        });
    });
  }

  function stopListening() {
    cancelledRef.current = true;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsListening(false);
    setIsProcessingVoice(false);
  }

  function stopSpeaking() {
    if (activeAudioRef.current) {
      activeAudioRef.current.onended = null;
      activeAudioRef.current.onerror = null;
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
      activeAudioRef.current = null;
    }

    playbackResolveRef.current?.();
    playbackResolveRef.current = null;
    setIsSpeaking(false);
  }

  async function speak(text: string, language: Language = "en") {
    if (!synthesisSupported) {
      throw new Error("Speech synthesis is not supported in this browser.");
    }

    stopSpeaking();
    setIsSpeaking(true);

    try {
      const audio = await postTextToSpeech(text, language);
      if (!audio) {
        throw new Error("Text-to-speech request failed.");
      }

      const player = new Audio(`data:audio/mp3;base64,${audio}`);
      activeAudioRef.current = player;
      await new Promise<void>(async (resolve, reject) => {
        let settled = false;

        const finish = (callback?: () => void) => {
          if (settled) {
            return;
          }

          settled = true;
          playbackResolveRef.current = null;
          activeAudioRef.current = null;
          setIsSpeaking(false);
          callback?.();
        };

        playbackResolveRef.current = () => finish(resolve);

        player.onended = () => finish(resolve);
        player.onerror = () => {
          finish(() => reject(new Error("Text-to-speech playback failed.")));
        };

        try {
          await player.play();
        } catch (error) {
          finish(() =>
            reject(
              error instanceof Error
                ? error
                : new Error("Text-to-speech request failed."),
            ),
          );
        }
      });
    } catch (error) {
      setIsSpeaking(false);
      throw error instanceof Error
        ? error
        : new Error("Text-to-speech request failed.");
    }
  }

  return {
    isListening,
    isSpeaking,
    isProcessingVoice,
    recognitionSupported,
    synthesisSupported,
    listenOnce,
    stopListening,
    stopSpeaking,
    speak,
  };
}
