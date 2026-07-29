import { useCallback, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { File, UploadType } from 'expo-file-system';
import { useMutation, useQuery } from 'convex/react';
import { useToast } from 'heroui-native';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { MAX_SPECIALTIES, type Specialty } from '@/convex/lib/specialties';
import { SETUP_STEPS, firstIncompleteStep, type SetupDraft } from './steps';

type TextDraft = Pick<SetupDraft, 'displayName' | 'bio'>;

/**
 * Draft state for the setup flow. Text fields stay local until the step is
 * left (one write per step instead of one per keystroke); the photo is not
 * drafted at all — it's uploaded on pick, and the reactive query carries the
 * new URL back rather than an effect mirroring it into state.
 */
export function useXolacerSetup() {
  const { toast } = useToast();
  const saved = useQuery(api.xolacerChat.myXolacerProfile);
  const upsert = useMutation(api.xolacerChat.upsertMyXolacerProfile);
  const generateUploadUrl = useMutation(api.xolacerChat.generatePhotoUploadUrl);
  const setXolacerPhoto = useMutation(api.xolacerChat.setXolacerPhoto);
  const publish = useMutation(api.xolacerChat.publishProfile);

  const [index, setIndex] = useState(0);
  const [resumed, setResumed] = useState(false);
  const [visible, setVisible] = useState(true);
  const [uploading, setUploading] = useState(false);
  const pendingIndex = useRef<number | null>(null);

  // Server values seed the fields once; after that the local draft owns them.
  const [edits, setEdits] = useState<Partial<TextDraft>>({});
  const [specialtyEdits, setSpecialtyEdits] = useState<string[] | null>(null);
  const draft: SetupDraft = {
    photoUrl: saved?.photoUrl,
    displayName: edits.displayName ?? saved?.displayName ?? '',
    bio: edits.bio ?? saved?.bio ?? '',
    specialties: specialtyEdits ?? saved?.specialties ?? [],
  };

  /**
   * Open on the first thing still missing instead of always step 1. For a new
   * xolacer that IS step 1, so nothing changes for them — it only saves a
   * returning xolacer from tapping Continue past steps they already finished.
   * Seeded once, in render rather than an effect, so it never fights the user:
   * after this runs, `index` is theirs and filling a field can't move them.
   */
  if (!resumed && saved !== undefined) {
    setResumed(true);
    const blocking = firstIncompleteStep(draft);
    setIndex(blocking ? SETUP_STEPS.indexOf(blocking) : SETUP_STEPS.length - 1);
  }

  const setField = useCallback(
    (key: keyof TextDraft, value: string) =>
      setEdits((prev) => ({ ...prev, [key]: value })),
    [],
  );

  /**
   * Toggling stays local until the step is left, same as the text fields —
   * a chip that waits on a round trip to fill in feels broken. The cap is
   * enforced here and again server-side.
   */
  const toggleSpecialty = useCallback(
    (slug: string) =>
      setSpecialtyEdits((prev) => {
        const current = prev ?? saved?.specialties ?? [];
        if (current.includes(slug)) return current.filter((item) => item !== slug);
        if (current.length >= MAX_SPECIALTIES) return current;
        return [...current, slug];
      }),
    [saved?.specialties],
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
        specialties: draft.specialties as Specialty[],
      }),
    [upsert, draft.displayName, draft.bio, draft.specialties],
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
    const asset = picked.assets[0];
    // `.finally()` rather than try/finally — the React Compiler skips
    // optimization for try/finally bodies. The `.catch()` is what keeps the
    // fire-and-forget call in PhotoStep from becoming an unhandled rejection.
    await uploadPhoto(asset.uri, asset.mimeType, generateUploadUrl, setXolacerPhoto)
      .finally(() => setUploading(false))
      .catch((error) => {
        console.error('[xolacer-setup] photo upload failed', error);
        toast.show({ label: "Couldn't upload that photo. Try again." });
      });
  }, [generateUploadUrl, setXolacerPhoto, toast]);

  return {
    draft,
    setField,
    toggleSpecialty,
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

/**
 * The picked file streams to Convex natively rather than through
 * `fetch(uri).blob()`. Reading a `file://` URI back through RN's fetch fails
 * outright on Android, and where it does work it yields a blob with an empty
 * `type`, so the upload lands with a blank Content-Type. `File.upload` reads
 * the file on the native side and sends the picker's own mime type.
 */
async function uploadPhoto(
  uri: string,
  mimeType: string | undefined,
  generateUploadUrl: () => Promise<string>,
  setXolacerPhoto: (args: { storageId: Id<'_storage'> }) => Promise<null>,
) {
  const uploadUrl = await generateUploadUrl();
  const result = await new File(uri).upload(uploadUrl, {
    httpMethod: 'POST',
    uploadType: UploadType.BINARY_CONTENT,
    headers: { 'Content-Type': mimeType ?? 'image/jpeg' },
  });
  // A failed upload answers with text, not JSON — parsing it first would throw
  // something unreadable instead of the actual status.
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Photo upload failed (${result.status}): ${result.body}`);
  }
  const { storageId } = JSON.parse(result.body) as { storageId: Id<'_storage'> };
  await setXolacerPhoto({ storageId });
}
