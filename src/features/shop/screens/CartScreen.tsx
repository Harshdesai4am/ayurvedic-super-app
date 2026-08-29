import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, Clipboard, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Copy } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../../../app/store/store';
import {
  loadCartThunk,
  removeFromCartThunk,
  updateQuantityThunk,
  clearCartThunk,
  applyCoupon
} from '../store/cartSlice';
import {
  selectCartItems,
  selectCouponCode,
  selectDiscountPercentage,
  selectCartSubtotal,
  selectCartDiscountAmount,
  selectCartTax,
  selectCartTotal
} from '../selectors/shopSelectors';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { CartItemRow } from '../components/CartItemRow';
import { Input } from '../../../shared/components/ui/Input';
import { Button } from '../../../shared/components/ui/Button';
import { Card } from '../../../shared/components/ui/Card';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { useToast } from '../../../shared/components/ui/Toast';
import { ROUTES } from '../../../app/constants/routes';

export const CartScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  // Selectors
  const items = useAppSelector(selectCartItems);
  const couponCode = useAppSelector(selectCouponCode);
  const discountPercentage = useAppSelector(selectDiscountPercentage);
  const subtotal = useAppSelector(selectCartSubtotal);
  const discountAmount = useAppSelector(selectCartDiscountAmount);
  const tax = useAppSelector(selectCartTax);
  const total = useAppSelector(selectCartTotal);

  const [couponInput, setCouponInput] = useState('');
  const isTablet = width >= 768;

  // Load cart items on mount
  useEffect(() => {
    dispatch(loadCartThunk());
  }, [dispatch]);

  const handleApplyCoupon = () => {
    dispatch(applyCoupon(couponInput));
    const normalizedInput = couponInput.toUpperCase().trim();
    if (normalizedInput === 'AYUR10') {
      showToast('Coupon applied! 10% OFF', 'success');
    } else if (normalizedInput === 'HERBAL20') {
      showToast('Coupon applied! 20% OFF', 'success');
    } else {
      showToast('Invalid Coupon Code. Try AYUR10 or HERBAL20', 'error');
    }
  };

  const handleCheckout = () => {
    showToast('Order Placed Successfully! (Offline Sync Enabled)', 'success');
    dispatch(clearCartThunk());
    navigation.navigate(ROUTES.SHOP.PRODUCT_LISTING);
  };

  const handleCopyCoupon = (code: string) => {
    Clipboard.setString(code);
    setCouponInput(code);
    showToast(`Copied test coupon code '${code}' and pre-filled!`, 'success');
  };

  const handleRemoveCoupon = () => {
    dispatch(applyCoupon(''));
    setCouponInput('');
    showToast('Coupon removed successfully.', 'success');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.responsiveWrapper,
          { maxWidth: isTablet ? 768 : '100%', alignSelf: 'center', width: '100%', flex: 1 },
        ]}
      >
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Shopping Cart</Text>

        {items.length === 0 ? (
          <EmptyState
            title="Your Cart is Empty"
            description="Explore our herbal formulations, oils, and remedies."
            actionTitle="Shop Now"
            onAction={() => navigation.navigate(ROUTES.SHOP.PRODUCT_LISTING)}
          />
        ) : (
          <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom }]}>
            {items.map((item) => (
              <CartItemRow
                key={item.product.id}
                item={item}
                onIncrement={() =>
                  dispatch(
                    updateQuantityThunk({ productId: item.product.id, quantity: item.quantity + 1 })
                  )
                }
                onDecrement={() =>
                  dispatch(
                    updateQuantityThunk({ productId: item.product.id, quantity: item.quantity - 1 })
                  )
                }
                onRemove={() => dispatch(removeFromCartThunk(item.product.id))}
              />
            ))}

            <Card style={styles.couponCard}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                Apply Coupon Code
              </Text>
              <View style={styles.couponRow}>
                <Input
                  placeholder="Enter Promo Code"
                  value={couponInput}
                  onChangeText={setCouponInput}
                  containerStyle={styles.couponInput}
                />
                <Button title="Apply" size="md" onPress={handleApplyCoupon} style={styles.applyBtn} />
              </View>

              <View style={styles.testCouponsContainer}>
                <Text style={[styles.testCouponLabel, { color: theme.colors.textSecondary }]}>
                  Test Coupon Codes (Tap to Copy):
                </Text>
                <View style={styles.couponChipsRow}>
                  {['AYUR10', 'HERBAL20'].map((code) => (
                    <TouchableOpacity
                      key={code}
                      style={[styles.copyChip, { borderColor: theme.colors.border }]}
                      onPress={() => handleCopyCoupon(code)}
                    >
                      <Text style={[styles.copyChipText, { color: theme.colors.brand[700] }]}>
                        {code} ({code === 'AYUR10' ? '10% OFF' : '20% OFF'})
                      </Text>
                      <Copy size={11} color={theme.colors.brand[500]} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {couponCode && (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Check size={14} color={theme.colors.status.success} style={{ marginRight: 4 }} />
                    <Text style={[styles.appliedText, { color: theme.colors.status.success, marginTop: 0 }]}>
                      Coupon '{couponCode}' Active ({discountPercentage}% OFF)
                    </Text>
                  </View>
                  <TouchableOpacity onPress={handleRemoveCoupon}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.status.error }}>
                      Remove
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </Card>

            <Card style={styles.summaryCard}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                Order Summary
              </Text>
              <View style={styles.priceRow}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Subtotal</Text>
                <Text style={[styles.val, { color: theme.colors.textPrimary }]}>₹{subtotal}</Text>
              </View>
              {discountAmount > 0 && (
                <View style={styles.priceRow}>
                  <Text style={[styles.label, { color: theme.colors.status.success }]}>Discount</Text>
                  <Text style={[styles.val, { color: theme.colors.status.success }]}>
                    -₹{discountAmount}
                  </Text>
                </View>
              )}
              <View style={styles.priceRow}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Ayurvedic Cess Tax (5%)</Text>
                <Text style={[styles.val, { color: theme.colors.textPrimary }]}>₹{tax}</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.priceRow}>
                <Text style={[styles.totalLabel, { color: theme.colors.textPrimary }]}>Total Payable</Text>
                <Text style={[styles.totalVal, { color: theme.colors.brand[500] }]}>₹{total}</Text>
              </View>
            </Card>
          </ScrollView>
        )}

        {items.length > 0 && (
          <View
            style={[
              styles.footer,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                paddingBottom: insets.bottom + 16,
                maxWidth: isTablet ? 768 : '100%',
                alignSelf: 'center',
              },
            ]}
          >
            <Button
              title={`Checkout • ₹${total}`}
              size="lg"
              onPress={handleCheckout}
              style={styles.checkoutBtn}
            />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  responsiveWrapper: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    padding: 16,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  couponCard: {
    marginVertical: 12,
    padding: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponInput: {
    flex: 1,
    marginVertical: 0,
  },
  applyBtn: {
    marginLeft: 8,
    height: 48,
  },
  appliedText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  summaryCard: {
    marginBottom: 16,
    padding: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  label: {
    fontSize: 14,
  },
  val: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  totalVal: {
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
  },
  checkoutBtn: {
    width: '100%',
  },
  testCouponsContainer: {
    marginTop: 8,
  },
  testCouponLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  couponChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  copyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  copyChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
