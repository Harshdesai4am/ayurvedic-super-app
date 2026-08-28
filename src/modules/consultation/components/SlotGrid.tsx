import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TimeSlot } from '../types/consultationTypes';
import { useTheme } from '../../../app/theme/ThemeProvider';

export interface SlotGridProps {
  slots: TimeSlot[];
  selectedSlotId?: string;
  onSelectSlot: (slot: TimeSlot) => void;
}

export const SlotGrid: React.FC<SlotGridProps> = ({ slots, selectedSlotId, onSelectSlot }) => {
  const { theme } = useTheme();

  return (
    <View style={styles.grid}>
      {slots.map((slot) => {
        const isSelected = selectedSlotId === slot.id;
        const isDisabled = !slot.isAvailable;

        return (
          <TouchableOpacity
            key={slot.id}
            disabled={isDisabled}
            onPress={() => onSelectSlot(slot)}
            activeOpacity={0.8}
            style={[
              styles.slotCard,
              {
                backgroundColor: isSelected
                  ? theme.colors.brand[500]
                  : isDisabled
                  ? theme.colors.surface
                  : theme.colors.card,
                borderColor: isSelected
                  ? theme.colors.brand[500]
                  : isDisabled
                  ? theme.colors.border
                  : theme.colors.border,
                opacity: isDisabled ? 0.4 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.slotTime,
                {
                  color: isSelected
                    ? '#FFFFFF'
                    : isDisabled
                    ? theme.colors.textMuted
                    : theme.colors.textPrimary,
                  fontWeight: isSelected ? '700' : '500',
                },
              ]}
            >
              {slot.time}
            </Text>
            <Text
              style={[
                styles.period,
                {
                  color: isSelected
                    ? '#E1F3E8'
                    : isDisabled
                    ? theme.colors.textMuted
                    : theme.colors.textSecondary,
                },
              ]}
            >
              {slot.period}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  slotCard: {
    width: '31%',
    margin: '1%',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotTime: {
    fontSize: 13,
  },
  period: {
    fontSize: 10,
    marginTop: 2,
  },
});
