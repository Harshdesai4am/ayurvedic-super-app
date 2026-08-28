import React from 'react';
import { View, StyleSheet, ViewProps, ViewStyle } from 'react-native';
import { useTheme } from '../../../app/theme/ThemeProvider';

export interface CardProps extends ViewProps {
  elevation?: 'none' | 'low' | 'medium' | 'high';
  bordered?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  elevation = 'low',
  bordered = true,
  style,
  ...rest
}) => {
  const { theme } = useTheme();

  const cardStyle: ViewStyle = {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    borderWidth: bordered ? 1 : 0,
    borderColor: theme.colors.border,
    ...theme.elevation[elevation],
  };

  return (
    <View style={[cardStyle, style]} {...rest}>
      {children}
    </View>
  );
};
