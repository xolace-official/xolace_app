import { useCallback, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { SETUP_STEPS, type SetupDraft } from './steps';

type TextDraft = Pick<SetupDraft, 'displayName' | 'bio'>;

/**
 * Draft state for the setup flow. Text fields stay local until the step is
 * left (one write per step instead of one per keystroke); the photo is not
 * drafted at all — it's uploaded on pick, and the reactive query carries the
 * new URL back rather than an effect mirroring it into state.
 */
export function useListenerSetup() {
  const saved = useQuery(api.listenerChat.myListenerProfile);
  const upsert = useMutation(api.listenerChat.upsertMyListenerProfile);
  const generateUploadUrl = useMutation(api.listenerChat.generatePhotoUploadUrl);
  const setListenerPhoto = useMutation(api.listenerChat.setListenerPhoto);
  const publish = useMutation(api.listenerChat.publishProfile);

  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [uploading, setUploading] = useState(false);
  const pendingIndex = useRef<number | null>(null);

  // Server values seed the fields once; after that the local draft owns them.
  const [edits, setEdits] = useState<Partial<TextDraft>>({});
  const draft: SetupDraft = {
    photoUrl: saved?.photoUrl,
    displayName: edits.displayName ?? saved?.displayName ?? '',
    bio: edits.bio ?? saved?.bio ?? '',
  };

  const setField = useCallback(
    (key: keyof TextDraft, value: string) =>
      setEdits((prev) => ({ ...prev, [key]: value })),
    [],
  );

  /** Cross-fade: fade out, swap the step, fade back in on transition end. */
  const goToStep = useCallback(
    (next: number) => {
      if (next === index || next < 0 || next >= SETUP_STEPS.length) return;
      pendingIndex.current = next;
      setVisible(false);
    },
    [index],
  );

  const handleFadeComplete = useCallback(() => {
    if (pendingIndex.current === null) return;
    setIndex(pendingIndex.current);
    pendingIndex.current = null;
    setVisible(true);
  }, []);

  const saveText = useCallback(
    () =>
      upsert({
        displayName: draft.displayName.trim() || undefined,
        bio: draft.bio.trim() || undefined,
      }),
    [upsert, draft.displayName, draft.bio],
  );

  const pickPhoto = useCallback(async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (picked.canceled) return;

    setUploading(true);
    // `.finally()` rather than try/finally — the React Compiler skips
    // optimization for try/finally bodies.
    await uploadPhoto(picked.assets[0].uri, generateUploadUrl, setListenerPhoto).finally(
      () => setUploading(false),
    );
  }, [generateUploadUrl, setListenerPhoto]);

  return {
    draft,
    setField,
    index,
    visible,
    uploading,
    goToStep,
    handleFadeComplete,
    saveText,
    pickPhoto,
    publish,
    loading: saved === undefined,
  };
}

async function uploadPhoto(
  uri: string,
  generateUploadUrl: () => Promise<string>,
  setListenerPhoto: (args: { storageId: Id<'_storage'> }) => Promise<null>,
) {
  const uploadUrl = await generateUploadUrl();
  const blob = await fetch(uri).then((response) => response.blob());
  const result = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': blob.type },
    body: blob,
  });
  const { storageId } = (await result.json()) as { storageId: Id<'_storage'> };
  await setListenerPhoto({ storageId });
}
