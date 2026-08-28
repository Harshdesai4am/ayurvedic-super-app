# Ayurvedic Super App 🌿

A production-grade, offline-first React Native Super Application built with **TypeScript**, **Redux Toolkit**, and **Clean Architecture**. The app brings together three completely independent health & wellness business modules into a unified mobile application:

1. **Consultation**: Discover BAMS/MD Ayurvedic specialists, filter by Dosha (Vata, Pitta, Kapha), reserve date/time slots, and book consultations.
2. **Shop**: E-commerce catalog for authentic Ayurvedic oils, powders, supplements, teas, and skincare products with local cart management and discount coupon validation.
3. **Health Records**: Encrypted electronic health records (EHR) timeline for prescriptions, lab tests, and vitals tracking.

---

## 🏛️ System Architecture

The application is structured using **Clean Architecture** with a **Feature-First** organization pattern:

```
src/
├── app/                  # Bootstrap configuration, theme tokens, store, navigation
│   ├── constants/        # Route names, storage keys, environment limits
│   ├── navigation/       # Root stack and bottom tab navigators
│   ├── store/            # Redux Toolkit store setup
│   └── theme/            # Centralized light/dark theme palette & typography
│
├── core/                 # Shared enterprise infrastructure & framework adapters
│   ├── api/              # Global Axios HTTP client & response interceptors
│   ├── errors/           # AppError domain class & React ErrorBoundary
│   ├── logger/           # Structured logging service
│   ├── network/          # NetInfo network status monitor hook
│   ├── offline/          # Persistent mutation queue & Sync Manager
│   └── storage/          # Rapid storage engine adapter (MMKV fallback)
│
├── modules/              # Independent Feature Modules
│   ├── consultation/     # Doctor catalog, slot grid, booking repository & slice
│   ├── shop/             # Product catalog, cart management, coupons & slice
│   ├── healthRecords/    # Encrypted EHR timeline, record creation & slice
│   └── profile/          # User profile, theme settings, offline queue monitor
│
└── shared/               # Atomic Design System
    └── components/ui/    # Button, Input, Card, Chip, Tag, Skeleton, EmptyState, Toast, SearchBar
```

---

## 🔄 Unidirectional Data Flow

To ensure high maintainability, UI views are strictly decoupled from API endpoints and local database instances:

`UI View Component` ➔ `Custom Hook` ➔ `Use Case / Repository` ➔ `API Client / Storage` ➔ `Response Mapper` ➔ `Redux State` ➔ `UI Render`

---

## 📶 Offline-First Engine

- **Persistent Caching**: All domain repositories load data from local MMKV storage first before reaching the network.
- **Offline Mutation Queue**: Actions performed while offline (consultation bookings, cart modifications, record additions) are enqueued in persistent storage.
- **Sync Manager**: On network connection, `SyncManager` processes queued mutations sequentially with automatic exponential backoff retry.

---

## ⚡ Performance Optimizations

1. **Virtualized Rendering**: Component lists optimized for high FPS scrolling.
2. **Component Memoization**: React 19 memoization (`React.memo`, `useMemo`, `useCallback`) applied across custom cards and slot grids.
3. **Debounced Search**: Search input queries debounced by 300ms to eliminate unnecessary filter re-renders.

---

## 🧪 Testing

Run Jest unit test suite:
```bash
npm test
```

---

## 🛠️ Requirements & Setup

- **Node.js**: >= 22.11.0
- **React Native**: 0.87.1
- **React**: 19.2.3
