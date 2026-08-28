import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../../app/theme/ThemeProvider';

export interface ChipProps {
  label: string;
  isSelected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  isSelected = false,
  onPress,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          backgroundColor: isSelected
            ? theme.colors.brand[500]
            : theme.colors.surface,
          borderColor: isSelected
            ? theme.colors.brand[500]
            : theme.colors.border,
          borderRadius: theme.radii.full,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.chipText,
          {
            color: isSelected
              ? '#FFFFFF'
              : theme.colors.textSecondary,
            fontWeight: isSelected ? '600' : '400',
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  chipText: {
    fontSize: 14,
  },
});
