import { cn } from '@/lib/utils';
import React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

/**
 * Drop-in replacement for React Native's Text with default font and theme color applied.
 * Use this instead of importing Text from 'react-native' directly.
 *
 * Default styles: `font-normal text-foreground` — override via className prop.
 */
export const AppText = React.forwardRef<RNText, RNTextProps>((props, ref) => {
  const { className, ...restProps } = props;

  return (
    <RNText ref={ref} className={cn('font-normal text-foreground', className)} {...restProps} />
  );
});

AppText.displayName = 'AppText';
