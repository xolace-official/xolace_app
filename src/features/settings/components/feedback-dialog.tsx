import { useState, useEffect } from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
import { Dialog, TextArea, Button } from 'heroui-native';
import { DialogBlurBackdrop } from '@/src/components/dialog-blur-backdrop';
import { AppText } from '@/src/components/shared/app-text';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { usePostHog } from 'posthog-react-native';

const MAX_LENGTH = 1000;

function extractErrorMessage(e: unknown): string {
  if (!(e instanceof Error)) return 'Something went wrong';
  const match = e.message.match(/Uncaught Error: (.+?)(?:\n|$)/);
  return match ? match[1] : e.message;
}

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export const FeedbackDialog = ({ isOpen, onOpenChange }: Props) => {
  const [text, setText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitFeedback = useMutation(api.feedback.submit);
  const canSubmit = useQuery(api.feedback.canSubmitGeneral);
  const posthog = usePostHog();

  useEffect(() => {
    if (isOpen) {
      setText('');
      setError(null);
      setSent(false);
      setIsSaving(false);
    }
  }, [isOpen]);

  const isRateLimited = canSubmit === false;
  const isDisabled = isSaving || !text.trim() || isRateLimited || sent;

  const handleSend = async () => {
    if (isDisabled) return;
    setIsSaving(true);
    setError(null);
    try {
      await submitFeedback({ type: 'general', text: text.trim() });
      setSent(true);
      posthog.capture('feedback_submitted', {
        type: 'general',
        has_text: true,
        has_option: false,
      });
      setTimeout(() => onOpenChange(false), 1500);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <DialogBlurBackdrop />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Dialog.Content className="mx-auto w-full max-w-sm">
            <View className="mb-4 gap-1">
              <Dialog.Title>Send feedback</Dialog.Title>
              <Dialog.Description>
                What&apos;s on your mind?
              </Dialog.Description>
            </View>

            <TextArea
              value={text}
              onChangeText={(t: string) => { setText(t); setError(null); }}
              placeholder="Tell us what you think..."
              maxLength={MAX_LENGTH}
              isDisabled={isSaving || sent}
              className="min-h-[120] mb-1"
              accessibilityHint="Up to 1000 characters"
            />

            <AppText className="text-xs text-foreground/30 text-right mb-2">
              {text.length} / {MAX_LENGTH}
            </AppText>

            {isRateLimited && (
              <AppText className="text-xs text-foreground/50 mt-1 mb-2">
                You&apos;ve sent feedback today — come back tomorrow.
              </AppText>
            )}

            {error && (
              <AppText className="text-xs text-danger/80 mt-1 mb-2">
                {error}
              </AppText>
            )}

            <View className="flex-row justify-end gap-3 mt-1">
              <Button
                variant="ghost"
                size="sm"
                onPress={() => onOpenChange(false)}
                isDisabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onPress={handleSend}
                isDisabled={isDisabled}
                accessibilityLabel="Send feedback"
              >
                {sent ? 'Sent.' : isSaving ? 'Sending...' : 'Send'}
              </Button>
            </View>
          </Dialog.Content>
        </KeyboardAvoidingView>
      </Dialog.Portal>
    </Dialog>
  );
};
