import { useState } from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
import { Dialog, TextField, Input, Label, FieldError, Button } from 'heroui-native';
import { DialogBlurBackdrop } from '@/src/components/dialog-blur-backdrop';

const VALID_NAME_RE = /^[A-Za-z0-9-]+$/;
const MAX_LENGTH = 20;

function extractErrorMessage(e: unknown): string {
  if (!(e instanceof Error)) return 'Something went wrong';
  const match = e.message.match(/Uncaught Error: (.+?)(?:\n|$)/);
  return match ? match[1] : e.message;
}

function clientValidate(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  if (trimmed.length > MAX_LENGTH) return `${MAX_LENGTH} characters max`;
  if (/\s/.test(trimmed)) return 'No spaces allowed';
  if (!VALID_NAME_RE.test(trimmed)) return 'Letters, numbers, and hyphens only';
  return null;
}

type Props = {
  isOpen: boolean;
  onSave: (name: string) => Promise<void>;
  onDismiss: () => void;
};

export const SpaceNamePromptDialog = ({ isOpen, onSave, onDismiss }: Props) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const clientError = value.trim().length > 0 ? clientValidate(value) : null;
  const canSave = value.trim().length > 0 && !clientError;
  const displayError = clientError ?? error;

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    try {
      await onSave(value.trim());
      setValue('');
      setError(null);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDismiss = () => {
    setValue('');
    setError(null);
    onDismiss();
  };

  return (
    <Dialog isOpen={isOpen} onOpenChange={(open) => { if (!open) handleDismiss(); }}>
      <Dialog.Portal>
        <DialogBlurBackdrop />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Dialog.Content className="mx-auto w-full max-w-sm">
            <View className="mb-4 gap-1">
              <Dialog.Title>Want to give this space a name? It&apos;s yours.</Dialog.Title>
              <Dialog.Description>
                A soft label, just for you. You can change it anytime in settings.
              </Dialog.Description>
            </View>

            <TextField isInvalid={!!displayError} className="mb-5">
              <Label>Name</Label>
              <Input
                value={value}
                onChangeText={(t) => { setValue(t); setError(null); }}
                placeholder="e.g. ember, haven, mine"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={MAX_LENGTH + 2}
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
              {displayError ? <FieldError>{displayError}</FieldError> : null}
            </TextField>

            <View className="flex-row justify-end gap-3">
              <Button variant="ghost" size="sm" onPress={handleDismiss} isDisabled={isSaving}>
                Not now
              </Button>
              <Button
                variant="primary"
                size="sm"
                onPress={handleSave}
                isDisabled={!canSave || isSaving}
              >
                Save
              </Button>
            </View>
          </Dialog.Content>
        </KeyboardAvoidingView>
      </Dialog.Portal>
    </Dialog>
  );
};
