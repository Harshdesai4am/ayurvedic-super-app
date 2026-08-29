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
  isLoading: boolean;
  error: string | null;
}

const initialState: ConsultationState = {
  doctors: [],
  selectedDoctor: null,
  slots: [],
  selectedSlot: null,
  upcomingBookings: [],
  activeSpecialty: 'All',
  isLoading: false,
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
    } | undefined,
    { dispatch, rejectWithValue }
  ) => {
    try {
      // 1. Return local SQLite data immediately to show UI instantly
      const localDocs = await consultationRepository.getDoctorsLocally();
      const filteredSortedLocal = consultationRepository.filterAndSortDoctors(
        localDocs,
        arg?.filters,
        arg?.sortBy
      );

      // 2. Spin off background sync check (asynchronous, non-blocking)
      consultationRepository.syncDoctorsBackground().then((updatedDocs) => {
        if (updatedDocs) {
          const filteredSortedRemote = consultationRepository.filterAndSortDoctors(
            updatedDocs,
            arg?.filters,
            arg?.sortBy
          );
          dispatch(setDoctors(filteredSortedRemote));
        }
      });

      return filteredSortedLocal;
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

export const consultationSlice = createSlice({
  name: 'consultation',
  initialState,
  reducers: {
    setDoctors: (state, action: PayloadAction<Doctor[]>) => {
      state.doctors = action.payload;
    },
    setActiveSpecialty: (state, action: PayloadAction<string>) => {
      state.activeSpecialty = action.payload;
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
      .addCase(fetchDoctors.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDoctors.fulfilled, (state, action) => {
        state.isLoading = false;
        state.doctors = action.payload;
      })
      .addCase(fetchDoctors.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
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
      });
  },
});

export const { setDoctors, setActiveSpecialty, setSelectedDoctor, setSelectedSlot, holdSelectedSlotLocally } = consultationSlice.actions;
export default consultationSlice.reducer;
