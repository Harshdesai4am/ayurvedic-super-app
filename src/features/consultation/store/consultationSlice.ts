import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Doctor, TimeSlot, ConsultationBooking } from '../types/consultationTypes';
import { consultationRepository } from '../repository/consultationRepository';

interface ConsultationState {
  doctors: Doctor[];
  selectedDoctor: Doctor | null;
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  upcomingBookings: ConsultationBooking[];
  activeSpecialty: string;
  specialties: string[];
  isLoading: boolean;
  page: number;
  hasMore: boolean;
  totalCount: number;
  doctorsRequestId: string | null;
  error: string | null;
}

const initialState: ConsultationState = {
  doctors: [],
  selectedDoctor: null,
  slots: [],
  selectedSlot: null,
  upcomingBookings: [],
  activeSpecialty: 'All',
  specialties: [],
  isLoading: false,
  page: 1,
  hasMore: true,
  totalCount: 0,
  doctorsRequestId: null,
  error: null,
};

export const fetchDoctors = createAsyncThunk(
  'consultation/fetchDoctors',
  async (
    arg: {
      filters?: {
        specialty?: string;
        gender?: 'Male' | 'Female' | 'All';
        minExperience?: number;
        minRating?: number;
        maxFee?: number;
        language?: string;
        verifiedOnly?: boolean;
        availableToday?: boolean;
        onlineOnly?: boolean;
        searchQuery?: string;
      };
      sortBy?: 'RATING_DESC' | 'PRICE_ASC' | 'EXPERIENCE_DESC' | 'REVIEWS_DESC' | 'ALPHA_ASC';
      page?: number;
      refreshing?: boolean;
    } | undefined,
    { dispatch, getState, rejectWithValue, requestId }
  ) => {
    try {
      const state = (getState() as any).consultation as ConsultationState;
      const page = arg?.page !== undefined ? arg.page : (arg?.refreshing ? 1 : state.page);

      // 1. Return local SQLite data immediately to show UI instantly
      const localDocs = await consultationRepository.getDoctorsLocally();
      const filteredSortedLocal = consultationRepository.filterAndSortDoctors(
        localDocs,
        arg?.filters,
        arg?.sortBy
      );

      // Pagination slice
      const limit = 10;
      const start = (page - 1) * limit;
      const paginatedLocal = filteredSortedLocal.slice(start, start + limit);
      const hasMoreLocal = filteredSortedLocal.length > start + limit;

      // 2. Spin off background sync check (asynchronous, non-blocking)
      consultationRepository.syncDoctorsBackground().then((updatedDocs) => {
        if (updatedDocs) {
          const filteredSortedRemote = consultationRepository.filterAndSortDoctors(
            updatedDocs,
            arg?.filters,
            arg?.sortBy
          );
          const paginatedRemote = filteredSortedRemote.slice(start, start + limit);
          const hasMoreRemote = filteredSortedRemote.length > start + limit;

          dispatch(setDoctorsFromRequest({
            requestId,
            doctors: paginatedRemote,
            hasMore: hasMoreRemote,
            totalCount: filteredSortedRemote.length,
            page,
            refreshing: !!arg?.refreshing
          }));
        }
      });

      return {
        doctors: paginatedLocal,
        hasMore: hasMoreLocal,
        totalCount: filteredSortedLocal.length,
        page,
        refreshing: !!arg?.refreshing,
        requestId,
      };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch doctors');
    }
  }
);

export const fetchDoctorSlots = createAsyncThunk(
  'consultation/fetchDoctorSlots',
  async ({ doctorId, date }: { doctorId: string; date: string }, { rejectWithValue }) => {
    try {
      return await consultationRepository.getSlots(doctorId, date);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch slots');
    }
  }
);

export const fetchUpcomingBookings = createAsyncThunk(
  'consultation/fetchUpcomingBookings',
  async (_, { rejectWithValue }) => {
    try {
      return await consultationRepository.getUpcomingBookations();
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch bookings');
    }
  }
);

export const bookSlotThunk = createAsyncThunk(
  'consultation/bookSlot',
  async (bookingPayload: Omit<ConsultationBooking, 'id' | 'createdAt' | 'status'>, { rejectWithValue }) => {
    try {
      return await consultationRepository.bookConsultation(bookingPayload);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to book slot');
    }
  }
);

export const cancelBookingThunk = createAsyncThunk(
  'consultation/cancelBooking',
  async (bookingId: string, { rejectWithValue }) => {
    try {
      await consultationRepository.cancelBooking(bookingId);
      return bookingId;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to cancel booking');
    }
  }
);

export const fetchSpecialties = createAsyncThunk(
  'consultation/fetchSpecialties',
  async (_, { rejectWithValue }) => {
    try {
      return await consultationRepository.getSpecialties();
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch specialties');
    }
  }
);

export const consultationSlice = createSlice({
  name: 'consultation',
  initialState,
  reducers: {
    setDoctors: (state, action: PayloadAction<Doctor[]>) => {
      state.doctors = action.payload;
    },
    setDoctorsFromRequest: (
      state,
      action: PayloadAction<{ requestId: string; doctors: Doctor[]; hasMore: boolean; totalCount: number; page: number; refreshing: boolean }>
    ) => {
      if (state.doctorsRequestId === action.payload.requestId) {
        state.hasMore = action.payload.hasMore;
        state.page = action.payload.page;
        state.totalCount = action.payload.totalCount;
        if (action.payload.refreshing || action.payload.page === 1) {
          state.doctors = action.payload.doctors;
        } else {
          const existingIds = new Set(state.doctors.map((d) => d.id));
          const newDocs = action.payload.doctors.filter((d) => !existingIds.has(d.id));
          state.doctors = [...state.doctors, ...newDocs];
        }
      }
    },
    setActiveSpecialty: (state, action: PayloadAction<string>) => {
      state.activeSpecialty = action.payload;
      state.page = 1;
      state.doctors = [];
    },
    setSelectedDoctor: (state, action: PayloadAction<Doctor | null>) => {
      state.selectedDoctor = action.payload;
    },
    setSelectedSlot: (state, action: PayloadAction<TimeSlot | null>) => {
      state.selectedSlot = action.payload;
    },
    holdSelectedSlotLocally: (state, action: PayloadAction<{ doctorId: string; date: string; time: string }>) => {
      const { doctorId, date, time } = action.payload;
      consultationRepository.holdSlot(doctorId, date, time);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDoctors.pending, (state, action) => {
        state.isLoading = true;
        state.error = null;
        state.doctorsRequestId = action.meta.requestId;
      })
      .addCase(fetchDoctors.fulfilled, (state, action) => {
        if (state.doctorsRequestId === action.meta.requestId) {
          state.isLoading = false;
          state.hasMore = action.payload.hasMore;
          state.page = action.payload.page;
          state.totalCount = action.payload.totalCount;
          if (action.payload.refreshing || action.payload.page === 1) {
            state.doctors = action.payload.doctors;
          } else {
            const existingIds = new Set(state.doctors.map((d) => d.id));
            const newDocs = action.payload.doctors.filter((d) => !existingIds.has(d.id));
            state.doctors = [...state.doctors, ...newDocs];
          }
        }
      })
      .addCase(fetchDoctors.rejected, (state, action) => {
        if (state.doctorsRequestId === action.meta.requestId) {
          state.isLoading = false;
          state.error = action.payload as string;
        }
      })
      .addCase(fetchDoctorSlots.fulfilled, (state, action) => {
        state.slots = action.payload;
      })
      .addCase(fetchUpcomingBookings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUpcomingBookings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.upcomingBookings = action.payload;
      })
      .addCase(fetchUpcomingBookings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(bookSlotThunk.fulfilled, (state, action) => {
        state.upcomingBookings.unshift(action.payload);
        state.selectedSlot = null;
      })
      .addCase(cancelBookingThunk.fulfilled, (state, action) => {
        state.upcomingBookings = state.upcomingBookings.filter((b) => b.id !== action.payload);
      })
      .addCase(fetchSpecialties.fulfilled, (state, action) => {
        state.specialties = action.payload;
      });
  },
});

export const { setDoctors, setDoctorsFromRequest, setActiveSpecialty, setSelectedDoctor, setSelectedSlot, holdSelectedSlotLocally } = consultationSlice.actions;
export default consultationSlice.reducer;
