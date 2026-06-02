import { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

type Status = 'idle' | 'loading' | 'success' | 'error';

const FALLBACK_DRAFT =
  "Hey — I've been working through something lately and I'd really like to talk to you about it. " +
  "Could we find some time soon?";

export function useBridgeDraft() {
  const [status, setStatus] = useState<Status>('idle');
  const [draft, setDraft] = useState('');
  const requestDraft = useAction(api.ai.bridge.requestBridgeDraft);

  const generate = async (
    sessionId: Id<'sessions'>,
    recipientName: string,
    recipientRelationship?: string,
    addressTerm?: string,
  ) => {
    setStatus('loading');
    try {
      const result = await requestDraft({ sessionId, recipientName, recipientRelationship, addressTerm });
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
