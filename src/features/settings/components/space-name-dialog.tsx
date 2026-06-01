import { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { Dialog, TextField, Input, Label, FieldError, Button } from 'heroui-native';
import { DialogBlurBackdrop } from '@/src/components/dialog-blur-backdrop';
import { AppText } from '@/src/components/shared/app-text';
import { SPACE_NAME_MAX_LENGTH, validateSpaceName } from '@/convex/lib/spaceName';

function extractErrorMessage(e: unknown): string {
  if (!(e instanceof Error)) return 'Something went wrong';
  const match = e.message.match(/Uncaught Error: (.+?)(?:\n|$)/);
  return match ? match[1] : e.message;
}

function clientValidate(name: string): string | null {
  if (!name.trim()) return null;
  const result = validateSpaceName(name);
  return result.ok ? null : result.message;
}

type Props = {
  isOpen: boolean;
  currentName?: string;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => Promise<void>;
  onClear: () => Promise<void>;
};

type FormProps = Omit<Props, 'isOpen'>;

const SpaceNameForm = ({ currentName, onOpenChange, onSave, onClear }: FormProps) => {
  const [value, setValue] = useState(currentName ?? '');
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
      onOpenChange(false);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    setIsSaving(true);
    try {
      await onClear();
      onOpenChange(false);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog.Content className="mx-auto w-full max-w-sm">
      <View className="mb-4 gap-1">
        <Dialog.Title>Your space</Dialog.Title>
        <Dialog.Description>
          A soft label, just for you.
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
          maxLength={SPACE_NAME_MAX_LENGTH + 2}
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />
        {displayError ? <FieldError>{displayError}</FieldError> : null}
      </TextField>

      <View className="flex-row items-center">
        {currentName ? (
          <Pressable onPress={handleClear} disabled={isSaving} hitSlop={8}>
            <AppText className="text-sm text-foreground/40">
              Remove name
            </AppText>
          </Pressable>
        ) : null}
        <View className="flex-1" />
        <View className="flex-row gap-3">
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
            onPress={handleSave}
            isDisabled={!canSave || isSaving}
          >
            Save
          </Button>
        </View>
      </View>
    </Dialog.Content>
  );
};

export const SpaceNameDialog = ({
  isOpen,
  currentName,
  onOpenChange,
  onSave,
  onClear,
}: Props) => {
  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <DialogBlurBackdrop />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {isOpen && (
            <SpaceNameForm
              currentName={currentName}
              onOpenChange={onOpenChange}
              onSave={onSave}
              onClear={onClear}
            />
          )}
        </KeyboardAvoidingView>
      </Dialog.Portal>
    </Dialog>
  );
};
