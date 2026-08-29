import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import consultationReducer from '../../features/consultation/store/consultationSlice';
import shopReducer from '../../features/shop/store/shopSlice';
import cartReducer from '../../features/shop/store/cartSlice';
import healthRecordsReducer from '../../features/healthRecords/store/healthRecordsSlice';


export const store = configureStore({
  reducer: {
    consultation: consultationReducer,
    shop: shopReducer,
    cart: cartReducer,
    healthRecords: healthRecordsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
