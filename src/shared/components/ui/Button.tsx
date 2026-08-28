import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { useTheme } from '../../../app/theme/ThemeProvider';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  onPress,
  ...rest
}) => {
  const { theme } = useTheme();

  const getContainerStyle = (): ViewStyle => {
    let bg = theme.colors.brand[500];
    let border = 'transparent';

    if (variant === 'secondary') {
      bg = theme.colors.earth[500];
    } else if (variant === 'outline') {
      bg = 'transparent';
      border = theme.colors.brand[500];
    } else if (variant === 'ghost') {
      bg = 'transparent';
    } else if (variant === 'danger') {
      bg = theme.colors.status.error;
    }

    let paddingVertical: number = theme.spacing.sm;
    let paddingHorizontal: number = theme.spacing.md;

    if (size === 'sm') {
      paddingVertical = theme.spacing.xs;
      paddingHorizontal = theme.spacing.sm;
    } else if (size === 'lg') {
      paddingVertical = theme.spacing.md;
      paddingHorizontal = theme.spacing.lg;
    }

    return {
      backgroundColor: disabled ? theme.colors.surface : bg,
      borderColor: border,
      borderWidth: variant === 'outline' ? 1 : 0,
      borderRadius: theme.radii.md,
      paddingVertical,
      paddingHorizontal,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: disabled ? 0.6 : 1,
    };
  };

  const getTextStyle = (): TextStyle => {
    let color = '#FFFFFF';

    if (variant === 'outline' || variant === 'ghost') {
      color = theme.colors.brand[500];
    } else if (disabled) {
      color = theme.colors.textMuted;
    }

    let fontSize = 16;
    if (size === 'sm') fontSize = 14;
    if (size === 'lg') fontSize = 18;

    return {
      color,
      fontSize,
      fontWeight: '600',
      textAlign: 'center',
    };
  };

  return (
    <TouchableOpacity
      style={[getContainerStyle(), style]}
      disabled={disabled || isLoading}
      onPress={onPress}
      activeOpacity={0.8}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' ? theme.colors.brand[500] : '#FFFFFF'} />
      ) : (
        <>
          {leftIcon && <>{leftIcon}</>}
          <Text style={[getTextStyle(), leftIcon ? { marginLeft: 8 } : null, rightIcon ? { marginRight: 8 } : null, textStyle]}>
            {title}
          </Text>
          {rightIcon && <>{rightIcon}</>}
        </>
      )}
    </TouchableOpacity>
  );
};
