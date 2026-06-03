import { useRef, useState } from 'react';
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
  // Identifies the latest generation. The back button is reachable mid-load, so
  // the user can change recipient and regenerate while an earlier request is
  // still in flight — we drop any response that isn't from the newest call.
  const requestId = useRef(0);

  const generate = async (
    sessionId: Id<'sessions'>,
    recipientName: string,
    recipientRelationship?: string,
    addressTerm?: string,
  ) => {
    const id = ++requestId.current;
    setStatus('loading');
    try {
      const result = await requestDraft({ sessionId, recipientName, recipientRelationship, addressTerm });
      if (id !== requestId.current) return; // superseded by a newer request
      setDraft(result.draft);
      setStatus('success');
    } catch {
      if (id !== requestId.current) return;
      setDraft(FALLBACK_DRAFT);
      setStatus('error');
    }
  };

  return { status, draft, setDraft, generate };
}
