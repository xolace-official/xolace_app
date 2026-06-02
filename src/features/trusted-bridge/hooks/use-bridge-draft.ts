import { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

type Status = 'idle' | 'loading' | 'success' | 'error';

const FALLBACK_DRAFT =
  "I've been sitting with something and wanted to share it with you. " +
  "I processed some feelings today that made me think of you. " +
  "I just wanted you to know I'm thinking of you.";

export function useBridgeDraft() {
  const [status, setStatus] = useState<Status>('idle');
  const [draft, setDraft] = useState('');
  const requestDraft = useAction(api.ai.bridge.requestBridgeDraft);

  const generate = async (
    sessionId: Id<'sessions'>,
    recipientName: string,
    recipientRelationship?: string,
  ) => {
    setStatus('loading');
    try {
      const result = await requestDraft({ sessionId, recipientName, recipientRelationship });
      setDraft(result.draft);
      setStatus('success');
    } catch {
      setDraft(FALLBACK_DRAFT);
      setStatus('error');
    }
  };

  const reset = () => {
    setStatus('idle');
    setDraft('');
  };

  return { status, draft, setDraft, generate, reset };
}
