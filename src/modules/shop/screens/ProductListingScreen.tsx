import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShoppingCart } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../../../app/store/store';
import { fetchProducts, setSelectedCategory, toggleWishlist } from '../store/shopSlice';
import { addToCart } from '../store/cartSlice';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { ProductCard } from '../components/ProductCard';
import { SearchBar } from '../../../shared/components/ui/SearchBar';
import { Chip } from '../../../shared/components/ui/Chip';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { useToast } from '../../../shared/components/ui/Toast';
import { ROUTES } from '../../../app/constants/routes';

const SHOP_CATEGORIES = ['All', 'Oils', 'Churna', 'Supplements', 'Teas', 'Skincare'];

export const ProductListingScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { products, selectedCategory, wishlistIds, isLoading } = useAppSelector((state) => state.shop);
  const cartItems = useAppSelector((state) => state.cart.items);

  const [search, setSearch] = useState('');
  const numColumns = width >= 1024 ? 4 : width >= 600 ? 3 : 2;
  const isTablet = width >= 768;

  useEffect(() => {
    dispatch(fetchProducts({ category: selectedCategory, searchQuery: search }));
  }, [dispatch, selectedCategory, search]);

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.responsiveWrapper,
          { maxWidth: isTablet ? 900 : '100%', alignSelf: 'center', width: '100%', flex: 1 },
        ]}
      >
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.topRow}>
            <View>
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Ayurvedic Store</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                Pure herbs, classical oils & formulations
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.cartBadgeBtn, { backgroundColor: theme.colors.brand[500] }]}
              onPress={() => navigation.navigate(ROUTES.SHOP.CART)}
            >
              <ShoppingCart size={20} color="#FFFFFF" />
              {totalCartCount > 0 && (
                <View style={[styles.badge, { backgroundColor: theme.colors.status.error }]}>
                  <Text style={styles.badgeText}>{totalCartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Search products, herbs, formulations..."
          />

          <FlatList
            horizontal
            data={SHOP_CATEGORIES}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            style={styles.chipList}
            renderItem={({ item }) => (
              <Chip
                label={item}
                isSelected={selectedCategory === item}
                onPress={() => dispatch(setSelectedCategory(item))}
              />
            )}
          />
        </View>

        {isLoading && products.length === 0 ? (
          <View style={styles.skeletonGrid}>
            <Skeleton height={180} width="48%" />
            <Skeleton height={180} width="48%" />
          </View>
        ) : products.length === 0 ? (
          <EmptyState
            title="No Products Found"
            description="We couldn't find any Ayurvedic product matching your query."
            actionTitle="Reset Search"
            onAction={() => {
              setSearch('');
              dispatch(setSelectedCategory('All'));
            }}
          />
        ) : (
          <FlatList
            key={numColumns}
            data={products}
            numColumns={numColumns}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <ProductCard
                product={item}
                isWishlisted={wishlistIds.includes(item.id)}
                numColumns={numColumns}
                onPress={() => {}}
                onAddToCart={() => {
                  dispatch(addToCart(item));
                  showToast(`Added ${item.name} to Cart`, 'success');
                }}
                onToggleWishlist={() => dispatch(toggleWishlist(item.id))}
              />
            )}
          />
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  cartBadgeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartIcon: {
    fontSize: 20,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  chipList: {
    marginVertical: 4,
  },
  skeletonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
});
