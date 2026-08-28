import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus, Minus, Trash2 } from 'lucide-react-native';
import { CartItem } from '../types/shopTypes';
import { useTheme } from '../../../app/theme/ThemeProvider';

export interface CartItemRowProps {
  item: CartItem;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}

export const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  onIncrement,
  onDecrement,
  onRemove,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
      <Image source={{ uri: item.product.image }} style={styles.image} />
      
      <View style={styles.details}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]} numberOfLines={1}>
          {item.product.name}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>
          ₹{item.product.price} each
        </Text>
        <Text style={[styles.total, { color: theme.colors.brand[500] }]}>
          Total: ₹{item.product.price * item.quantity}
        </Text>
      </View>

      <View style={styles.controls}>
        <View style={[styles.counter, { borderColor: theme.colors.border }]}>
          <TouchableOpacity style={styles.btn} onPress={onDecrement}>
            <Minus size={14} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.qty, { color: theme.colors.textPrimary }]}>{item.quantity}</Text>
          <TouchableOpacity style={styles.btn} onPress={onIncrement}>
            <Plus size={14} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
          <Trash2 size={16} color={theme.colors.status.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  details: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  total: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  controls: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
  },
  btn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  qty: {
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 6,
  },
  removeBtn: {
    marginTop: 6,
  },
  removeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
