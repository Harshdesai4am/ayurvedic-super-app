import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, useWindowDimensions, ActivityIndicator, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShoppingCart, SlidersHorizontal, Check } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../../../app/store/store';
import {
  fetchProducts,
  setSelectedCategory,
  setSortBy,
  toggleWishlistThunk,
  loadWishlist
} from '../store/shopSlice';
import { addToCartThunk, loadCartThunk } from '../store/cartSlice';
import {
  selectProducts,
  selectSelectedCategory,
  selectSearchQuery,
  selectWishlistIds,
  selectIsShopLoading,
  selectHasMoreProducts,
  selectProductsPage,
  selectSortBy,
  selectCartCount
} from '../selectors/shopSelectors';
import { useTheme } from '../../../app/theme/ThemeProvider';
import { ProductCard } from '../components/ProductCard';
import { SearchBar } from '../../../shared/components/ui/SearchBar';
import { Chip } from '../../../shared/components/ui/Chip';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { BottomSheet } from '../../../shared/components/ui/BottomSheet';
import { Button } from '../../../shared/components/ui/Button';
import { useToast } from '../../../shared/components/ui/Toast';
import { ROUTES } from '../../../app/constants/routes';
import { Product } from '../types/shopTypes';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';

const SHOP_CATEGORIES = ['All', 'Oils', 'Churna', 'Supplements', 'Teas', 'Skincare'];
const BRANDS = ['All', 'Himalaya Wellness', 'Kottakkal Arya Vaidya Sala', 'Organic India', 'Dabur', 'Baidyanath'];

const ProductListItem = React.memo(({
  item,
  isWishlisted,
  numColumns,
  onAddToCart,
  onToggleWishlist,
}: {
  item: Product;
  isWishlisted: boolean;
  numColumns: number;
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
}) => {
  const handleAddToCart = useCallback(() => onAddToCart(item), [item, onAddToCart]);
  const handleToggleWishlist = useCallback(() => onToggleWishlist(item.id), [item, onToggleWishlist]);
  return (
    <ProductCard
      product={item}
      isWishlisted={isWishlisted}
      numColumns={numColumns}
      onPress={() => {}}
      onAddToCart={handleAddToCart}
      onToggleWishlist={handleToggleWishlist}
    />
  );
});

export const ProductListingScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  // Selectors
  const products = useAppSelector(selectProducts);
  const selectedCategory = useAppSelector(selectSelectedCategory);
  const wishlistIds = useAppSelector(selectWishlistIds);
  const isLoading = useAppSelector(selectIsShopLoading);
  const hasMore = useAppSelector(selectHasMoreProducts);
  const page = useAppSelector(selectProductsPage);
  const sortBy = useAppSelector(selectSortBy);
  const totalCartCount = useAppSelector(selectCartCount);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isFilterSheetVisible, setIsFilterSheetVisible] = useState(false);

  // Filters State
  const [brand, setBrand] = useState('All');
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [minRating, setMinRating] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);

  const isFilterActive = useMemo(() => {
    return (
      brand !== 'All' ||
      minPrice !== 0 ||
      maxPrice !== 0 ||
      minRating !== 0 ||
      inStockOnly !== false ||
      sortBy !== undefined
    );
  }, [brand, minPrice, maxPrice, minRating, inStockOnly, sortBy]);

  // Temporary local states for filter bottom sheet
  const [tempBrand, setTempBrand] = useState('All');
  const [tempMinPrice, setTempMinPrice] = useState<number>(0);
  const [tempMaxPrice, setTempMaxPrice] = useState<number>(0);
  const [tempMinRating, setTempMinRating] = useState<number>(0);
  const [tempInStockOnly, setTempInStockOnly] = useState<boolean>(false);
  const [tempSortBy, setTempSortBy] = useState<any>(undefined);

  const openFilterSheet = () => {
    setTempBrand(brand);
    setTempMinPrice(minPrice);
    setTempMaxPrice(maxPrice);
    setTempMinRating(minRating);
    setTempInStockOnly(inStockOnly);
    setTempSortBy(sortBy);
    setIsFilterSheetVisible(true);
  };

  const handleApplyFilters = () => {
    setBrand(tempBrand);
    setMinPrice(tempMinPrice);
    setMaxPrice(tempMaxPrice);
    setMinRating(tempMinRating);
    setInStockOnly(tempInStockOnly);
    dispatch(setSortBy(tempSortBy));
    setIsFilterSheetVisible(false);
  };

  const numColumns = width >= 1024 ? 4 : width >= 600 ? 3 : 2;
  const isTablet = width >= 768;

  // Debounced search logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    dispatch(loadWishlist());
    dispatch(loadCartThunk());
  }, [dispatch]);

  // Combined fetch thunk triggering database load & background comparison sync
  useEffect(() => {
    dispatch(
      fetchProducts({
        category: selectedCategory,
        searchQuery: debouncedSearch,
        brand: brand === 'All' ? undefined : brand,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        minRating: minRating || undefined,
        inStockOnly,
        page: 1,
        sortBy: sortBy || undefined,
        refreshing: true,
      })
    );
  }, [dispatch, selectedCategory, debouncedSearch, brand, minPrice, maxPrice, minRating, inStockOnly, sortBy]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(
      fetchProducts({
        category: selectedCategory,
        searchQuery: debouncedSearch,
        brand: brand === 'All' ? undefined : brand,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        minRating: minRating || undefined,
        inStockOnly,
        page: 1,
        sortBy: sortBy || undefined,
        refreshing: true,
      })
    );
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      dispatch(
        fetchProducts({
          category: selectedCategory,
          searchQuery: debouncedSearch,
          brand: brand === 'All' ? undefined : brand,
          minPrice: minPrice || undefined,
          maxPrice: maxPrice || undefined,
          minRating: minRating || undefined,
          inStockOnly,
          page: page + 1,
          sortBy: sortBy || undefined,
        })
      );
    }
  };

  const handleResetFilters = () => {
    setTempBrand('All');
    setTempMinPrice(0);
    setTempMaxPrice(0);
    setTempMinRating(0);
    setTempInStockOnly(false);
    setTempSortBy(undefined);

    setBrand('All');
    setMinPrice(0);
    setMaxPrice(0);
    setMinRating(0);
    setInStockOnly(false);
    setSearch('');
    dispatch(setSelectedCategory('All'));
    dispatch(setSortBy(undefined));
    setIsFilterSheetVisible(false);
  };

  const handleToggleWishlist = useCallback((productId: string) => {
    dispatch(toggleWishlistThunk(productId));
    const isWish = wishlistIds.includes(productId);
    showToast(isWish ? 'Removed from Wishlist' : 'Added to Wishlist', 'success');
  }, [dispatch, wishlistIds, showToast]);

  const handleAddToCart = useCallback((product: Product) => {
    dispatch(addToCartThunk(product));
    showToast(`Added ${product.name} to Cart`, 'success');
  }, [dispatch, showToast]);

  const renderFooter = () => {
    if (!hasMore) {
      if (products.length > 0) {
        return (
          <Text style={[styles.endText, { color: theme.colors.textMuted }]}>
            All products loaded.
          </Text>
        );
      }
      return null;
    }
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.brand[500]} />
      </View>
    );
  };

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

          <View style={styles.searchRow}>
            <View style={{ flex: 1 }}>
              <SearchBar
                value={search}
                onChangeText={setSearch}
                placeholder="Search products, herbs, formulations..."
              />
            </View>
            <TouchableOpacity
              style={[styles.filterBtn, { borderColor: theme.colors.border }]}
              onPress={openFilterSheet}
            >
              <SlidersHorizontal size={18} color={theme.colors.textPrimary} />
              {isFilterActive && (
                <View style={[styles.filterDot, { backgroundColor: theme.colors.status.error }]} />
              )}
            </TouchableOpacity>
          </View>

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
          <View style={styles.shimmerGrid}>
            {Array.from({ length: 4 }).map((_, index) => (
              <View key={index} style={[styles.shimmerProductCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.card, width: numColumns === 4 ? '23%' : numColumns === 3 ? '31%' : '48%' }]}>
                <ShimmerPlaceholder style={styles.shimmerProductImage} />
                <View style={styles.shimmerProductContent}>
                  <ShimmerPlaceholder style={styles.shimmerProductCategory} />
                  <ShimmerPlaceholder style={styles.shimmerProductTitle} />
                  <ShimmerPlaceholder style={styles.shimmerProductSubtitle} />
                  <ShimmerPlaceholder style={styles.shimmerProductRating} />
                  <View style={styles.shimmerProductFooter}>
                    <ShimmerPlaceholder style={styles.shimmerProductPrice} />
                    <ShimmerPlaceholder style={styles.shimmerProductBtn} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : products.length === 0 ? (
          <EmptyState
            title="No Products Found"
            description="We couldn't find any Ayurvedic product matching your query."
            actionTitle="Reset All Filters"
            onAction={handleResetFilters}
          />
        ) : (
          <FlatList
            key={numColumns}
            data={products}
            numColumns={numColumns}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            ListFooterComponent={renderFooter}
            renderItem={({ item }) => (
              <ProductListItem
                item={item}
                isWishlisted={wishlistIds.includes(item.id)}
                numColumns={numColumns}
                onAddToCart={handleAddToCart}
                onToggleWishlist={handleToggleWishlist}
              />
            )}
          />
        )}

        {/* --- Shop Advanced Filters Bottom Sheet --- */}
        <BottomSheet
          isVisible={isFilterSheetVisible}
          onClose={() => setIsFilterSheetVisible(false)}
          title="Sort & Filter Products"
        >
          <ScrollView contentContainerStyle={styles.filterScroll} showsVerticalScrollIndicator={false}>
            {/* Sort Section */}
            <Text style={[styles.filterSectionTitle, { color: theme.colors.textPrimary }]}>Sort By</Text>
            <View style={styles.filterChipRow}>
              {[
                { label: 'Relevance', val: undefined },
                { label: 'Alphabetical', val: 'ALPHA_ASC' },
                { label: 'Rating (High-Low)', val: 'RATING_DESC' },
                { label: 'Price: Low to High', val: 'PRICE_ASC' },
                { label: 'Price: High to Low', val: 'PRICE_DESC' },
                { label: 'Recently Added', val: 'RECENT_DESC' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.label}
                  style={[
                    styles.filterOptionChip,
                    { borderColor: theme.colors.border },
                    tempSortBy === opt.val && { backgroundColor: theme.colors.brand[500] }
                  ]}
                  onPress={() => setTempSortBy(opt.val as any)}
                >
                  <Text style={[styles.filterOptionText, { color: tempSortBy === opt.val ? '#FFFFFF' : theme.colors.textPrimary }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            {/* Brand Filter */}
            <Text style={[styles.filterSectionTitle, { color: theme.colors.textPrimary }]}>Brand</Text>
            <View style={styles.filterChipRow}>
              {BRANDS.map((br) => (
                <TouchableOpacity
                  key={br}
                  style={[
                    styles.filterOptionChip,
                    { borderColor: theme.colors.border },
                    tempBrand === br && { backgroundColor: theme.colors.brand[500] }
                  ]}
                  onPress={() => setTempBrand(br)}
                >
                  <Text style={[styles.filterOptionText, { color: tempBrand === br ? '#FFFFFF' : theme.colors.textPrimary }]}>
                    {br.replace(' Wellness', '').replace(' Arya Vaidya Sala', '')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Price Filter */}
            <Text style={[styles.filterSectionTitle, { color: theme.colors.textPrimary, marginTop: 12 }]}>Max Price</Text>
            <View style={styles.filterChipRow}>
              {[
                { label: 'Any Price', val: 0 },
                { label: 'Under ₹200', val: 200 },
                { label: 'Under ₹500', val: 500 },
                { label: 'Under ₹1000', val: 1000 },
              ].map((price) => (
                <TouchableOpacity
                  key={price.val}
                  style={[
                    styles.filterOptionChip,
                    { borderColor: theme.colors.border },
                    tempMaxPrice === price.val && { backgroundColor: theme.colors.brand[500] }
                  ]}
                  onPress={() => setTempMaxPrice(price.val)}
                >
                  <Text style={[styles.filterOptionText, { color: tempMaxPrice === price.val ? '#FFFFFF' : theme.colors.textPrimary }]}>
                    {price.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Rating Filter */}
            <Text style={[styles.filterSectionTitle, { color: theme.colors.textPrimary, marginTop: 12 }]}>Minimum Rating</Text>
            <View style={styles.filterChipRow}>
              {[
                { label: 'Any Rating', val: 0 },
                { label: '4.0+ Stars', val: 4.0 },
                { label: '4.5+ Stars', val: 4.5 },
              ].map((rate) => (
                <TouchableOpacity
                  key={rate.val}
                  style={[
                    styles.filterOptionChip,
                    { borderColor: theme.colors.border },
                    tempMinRating === rate.val && { backgroundColor: theme.colors.brand[500] }
                  ]}
                  onPress={() => setTempMinRating(rate.val)}
                >
                  <Text style={[styles.filterOptionText, { color: tempMinRating === rate.val ? '#FFFFFF' : theme.colors.textPrimary }]}>
                    {rate.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            {/* Toggle Switch */}
            <Text style={[styles.filterSectionTitle, { color: theme.colors.textPrimary }]}>Availability</Text>
            <TouchableOpacity
              style={[styles.toggleCard, { borderColor: theme.colors.border }, tempInStockOnly && { backgroundColor: theme.colors.brand[50] }]}
              onPress={() => setTempInStockOnly(!tempInStockOnly)}
            >
              <Text style={[styles.toggleLabel, { color: theme.colors.textPrimary }]}>In Stock Only</Text>
              {tempInStockOnly && <Check size={16} color={theme.colors.brand[500]} />}
            </TouchableOpacity>

            <View style={styles.actionRow}>
              <Button title="Reset Filters" variant="outline" onPress={handleResetFilters} style={{ flex: 1 }} />
              <Button title="Apply Filters" onPress={handleApplyFilters} style={{ flex: 1.5 }} />
            </View>
          </ScrollView>
        </BottomSheet>
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
    marginBottom: 8,
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  filterBtn: {
    borderWidth: 1,
    height: 44,
    width: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
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
  footerLoader: {
    marginVertical: 16,
    alignItems: 'center',
  },
  endText: {
    textAlign: 'center',
    fontSize: 12,
    marginVertical: 16,
    fontWeight: '500',
  },
  filterScroll: {
    paddingBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  filterChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterOptionChip: {
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  filterOptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: '100%',
    marginBottom: 16,
  },
  toggleLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  shimmerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  shimmerProductCard: {
    margin: '1%',
    marginVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  shimmerProductImage: {
    height: 120,
    width: '100%',
  },
  shimmerProductContent: {
    padding: 10,
    gap: 6,
  },
  shimmerProductCategory: {
    width: 60,
    height: 14,
    borderRadius: 4,
    marginBottom: 4,
  },
  shimmerProductTitle: {
    width: '90%',
    height: 16,
    borderRadius: 4,
  },
  shimmerProductSubtitle: {
    width: '75%',
    height: 12,
    borderRadius: 4,
  },
  shimmerProductRating: {
    width: '45%',
    height: 12,
    borderRadius: 4,
    marginTop: 4,
  },
  shimmerProductFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  shimmerProductPrice: {
    width: 45,
    height: 18,
    borderRadius: 4,
  },
  shimmerProductBtn: {
    width: 50,
    height: 28,
    borderRadius: 6,
  },
});
