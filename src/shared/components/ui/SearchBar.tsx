import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useTheme } from '../../../app/theme/ThemeProvider';

export interface SearchBarProps {
  value?: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  debounceMs?: number;
  style?: ViewStyle;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value: externalValue,
  onChangeText,
  placeholder = 'Search doctors, products, records...',
  onClear,
  debounceMs = 300,
  style,
}) => {
  const { theme } = useTheme();
  const [internalValue, setInternalValue] = useState(externalValue || '');
  const onChangeTextRef = useRef(onChangeText);

  useEffect(() => {
    onChangeTextRef.current = onChangeText;
  }, [onChangeText]);

  useEffect(() => {
    if (externalValue !== undefined && externalValue !== internalValue) {
      setInternalValue(externalValue);
    }
  }, [externalValue]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onChangeTextRef.current(internalValue);
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [internalValue, debounceMs]);

  const handleClear = () => {
    setInternalValue('');
    onChangeTextRef.current('');
    onClear?.();
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.full,
        },
        style,
      ]}
    >
      <Search size={18} color={theme.colors.textMuted} style={styles.searchIcon} />
      <TextInput
        style={[styles.input, { color: theme.colors.textPrimary }]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        value={internalValue}
        onChangeText={setInternalValue}
        autoCorrect={false}
      />
      {internalValue.length > 0 && (
        <TouchableOpacity onPress={handleClear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <X size={16} color={theme.colors.textMuted} style={styles.clearIcon} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    marginVertical: 8,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  clearIcon: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '700',
  },
});
