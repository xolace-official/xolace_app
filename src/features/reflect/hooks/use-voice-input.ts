import { useState, useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function useVoiceInput() {
  const [isRecording, setIsRecording] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const consentStatus = useQuery(api.consent.getCurrentStatus, {
    consentType: 'voice_processing',
  });
  const grantConsent = useMutation(api.consent.grant);

  const isRecordingRef = useRef(false);

  useSpeechRecognitionEvent('start', () => {
    setIsRecording(true);
    isRecordingRef.current = true;
  });

  useSpeechRecognitionEvent('end', () => {
    setIsRecording(false);
    isRecordingRef.current = false;
    setPartialTranscript('');
  });

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript ?? '';
    setPartialTranscript(transcript);
  });

  useSpeechRecognitionEvent('error', (event) => {
    if (event.error !== 'aborted' && event.error !== 'no-speech') {
      setError(event.message ?? event.error);
    }
    setIsRecording(false);
    isRecordingRef.current = false;
  });

  useEffect(() => {
    return () => {
      if (isRecordingRef.current) {
        ExpoSpeechRecognitionModule.abort();
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!result.granted) {
      setError('Microphone permission is required for voice input.');
      return;
    }

    if (consentStatus?.status !== 'granted') {
      try {
        await grantConsent({
          consentType: 'voice_processing',
          consentLanguageVersion: '1.0',
        });
      } catch {
        // Non-blocking — consent failure should not prevent voice input
      }
    }

    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: false,
      addsPunctuation: Platform.OS === 'ios',
      iosTaskHint: 'dictation',
      maxAlternatives: 1,
    });
  }, [consentStatus, grantConsent]);

  const stopRecording = useCallback(() => {
    ExpoSpeechRecognitionModule.abort();
  }, []);

  return {
    isRecording,
    partialTranscript,
    startRecording,
    stopRecording,
    error,
  };
}
