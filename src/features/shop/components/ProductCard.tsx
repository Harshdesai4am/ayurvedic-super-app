import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Heart, Star } from 'lucide-react-native';
import { Product } from '../types/shopTypes';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { Card } from '../../../shared/components/ui/Card';
import { Tag } from '../../../shared/components/ui/Tag';
import { Button } from '../../../shared/components/ui/Button';

export interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onAddToCart: () => void;
  onToggleWishlist?: () => void;
  isWishlisted?: boolean;
  numColumns?: number;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(
  ({ product, onPress, onAddToCart, onToggleWishlist, isWishlisted = false, numColumns = 2 }) => {
    const { theme } = useTheme();

    const discount = product.originalPrice
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

    const itemWidth =
      numColumns === 4 ? '23%' : numColumns === 3 ? '31%' : '48%';

    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.88}
        style={[styles.container, { width: itemWidth as any }]}
      >
        <Card style={styles.card} elevation="low">
          <View style={styles.imageWrapper}>
            <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
            <TouchableOpacity style={styles.wishlistBtn} onPress={onToggleWishlist}>
              <Heart
                size={16}
                color={isWishlisted ? theme.colors.status.error : theme.colors.textMuted}
                fill={isWishlisted ? theme.colors.status.error : 'transparent'}
              />
            </TouchableOpacity>
            {discount > 0 && (
              <View style={[styles.discountBadge, { backgroundColor: theme.colors.status.error }]}>
                <Text style={styles.discountText}>{discount}% OFF</Text>
              </View>
            )}
          </View>

          <View style={styles.content}>
            <Tag label={product.category} style={styles.tag} />
            <Text style={[styles.title, { color: theme.colors.textPrimary }]} numberOfLines={1}>
              {product.name}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {product.subtitle}
            </Text>

            <View style={styles.ratingRow}>
              <Star size={12} color="#F59E0B" fill="#F59E0B" style={{ marginRight: 4 }} />
              <Text style={[styles.ratingText, { color: theme.colors.brand[500] }]}>
                {product.rating} ({product.reviewCount})
              </Text>
            </View>

            <View style={styles.priceRow}>
              <View style={styles.priceContainer}>
                <Text style={[styles.price, { color: theme.colors.textPrimary }]}>₹{product.price}</Text>
                {product.originalPrice && (
                  <Text style={[styles.originalPrice, { color: theme.colors.textMuted }]}>
                    ₹{product.originalPrice}
                  </Text>
                )}
              </View>
              <Button title="Add" size="sm" onPress={onAddToCart} />
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    width: '48%',
    margin: '1%',
    marginVertical: 6,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  imageWrapper: {
    height: 120,
    width: '100%',
    position: 'relative',
    backgroundColor: '#F3F4F6',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  wishlistBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartIcon: {
    fontSize: 14,
  },
  discountBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  content: {
    padding: 10,
  },
  tag: {
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
  },
  originalPrice: {
    fontSize: 11,
    textDecorationLine: 'line-through',
    marginLeft: 4,
  },
});
