import { useRef, useState } from "react";
import { View } from "react-native";
import { captureRef } from "react-native-view-shot";
import { useToast } from "heroui-native";

export function useQuoteSharing(displayedQuote: { text: string } | null) {
  const sharingCardRef = useRef<View>(null);
  const layoutResolverRef = useRef<(() => void) | null>(null);
  const imageResolverRef = useRef<(() => void) | null>(null);
  const imageLoadedRef = useRef(false);
  const [isSharingLoading, setIsSharingLoading] = useState(false);
  const [showSharingCard, setShowSharingCard] = useState(false);
  const [shareImageUri, setShareImageUri] = useState<string | null>(null);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const { toast } = useToast();

  // Called from the off-screen wrapper's onLayout — signals the card is ready to capture.
  const onSharingCardLayout = () => {
    layoutResolverRef.current?.();
    layoutResolverRef.current = null;
  };

  const onSharingCardImageLoadEnd = () => {
    imageLoadedRef.current = true;
    imageResolverRef.current?.();
    imageResolverRef.current = null;
  };

  const handleShare = async () => {
    if (!displayedQuote || isSharingLoading) return;
    setIsSharingLoading(true);
    imageLoadedRef.current = false;
    setShowSharingCard(true);
    try {
      // Wait until the off-screen card reports its layout before capturing.
      await new Promise<void>((resolve) => {
        layoutResolverRef.current = resolve;
      });

      // Ensure expo-image has finished rendering before capture.
      if (!imageLoadedRef.current) {
        await new Promise<void>((resolve) => {
          const timeoutId = setTimeout(resolve, 180);
          imageResolverRef.current = () => {
            clearTimeout(timeoutId);
            resolve();
          };
        });
      }

      const uri = await captureRef(sharingCardRef, {
        format: "png",
        quality: 1,
      });
      setShareImageUri(uri);
      setShowShareSheet(true);
    } catch {
      toast.show({
        label: "Couldn't prepare image",
        description: "Something went wrong. Try again.",
        variant: "default",
      });
    } finally {
      layoutResolverRef.current = null;
      imageResolverRef.current = null;
      setIsSharingLoading(false);
      setShowSharingCard(false);
    }
  };

  return {
    handleShare,
    onSharingCardLayout,
    onSharingCardImageLoadEnd,
    sharingCardRef,
    isSharingLoading,
    showSharingCard,
    showShareSheet,
    setShowShareSheet,
    shareImageUri,
    setShareImageUri,
  };
}
