import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { useTheme } from '../../../app/theme/ThemeProvider';

export interface AvatarProps {
  source?: string;
  name?: string;
  size?: number;
  style?: StyleProp<any>;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name = 'User',
  size = 48,
  style,
}) => {
  const { theme } = useTheme();
  const [hasError, setHasError] = useState(false);

  const getInitials = (str: string) => {
    const parts = str.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  if (source && !hasError) {
    return (
      <Image
        source={{ uri: source }}
        onError={() => setHasError(true)}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.colors.brand[100],
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.initials,
          {
            color: theme.colors.brand[700],
            fontSize: size * 0.4,
          },
        ]}
      >
        {getInitials(name)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '700',
  },
});
