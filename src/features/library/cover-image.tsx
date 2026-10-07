import { Image, type ImageProps } from 'expo-image';
import { imageSource } from '@/src/lib/image-source';

/** Every Lantern cover renders through here, so cache and placeholder changes land in one place. */
export function CoverImage({ uri, ...props }: Omit<ImageProps, 'source'> & { uri?: string }) {
  return uri ? <Image source={imageSource(uri)} {...props} /> : null;
}
