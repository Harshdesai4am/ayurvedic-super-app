import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../../app/theme/ThemeProvider';

export type DoshaType = 'vata' | 'pitta' | 'kapha';

export interface TagProps {
  label: string;
  dosha?: DoshaType;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
}

export const Tag: React.FC<TagProps> = ({
  label,
  dosha,
  color,
  backgroundColor,
  style,
}) => {
  const { theme } = useTheme();

  let bg = theme.colors.surface;
  let text = theme.colors.textSecondary;

  if (dosha) {
    const doshaConfig = theme.colors.dosha[dosha];
    bg = doshaConfig.background;
    text = doshaConfig.primary;
  } else {
    if (backgroundColor) bg = backgroundColor;
    if (color) text = color;
  }

  return (
    <View style={[styles.tag, { backgroundColor: bg, borderRadius: theme.radii.sm }, style]}>
      <Text style={[styles.tagText, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
