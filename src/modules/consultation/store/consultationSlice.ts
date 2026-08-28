import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Doctor, TimeSlot, ConsultationBooking } from '../types/consultationTypes';
import { consultationRepository } from '../repositories/consultationRepository';

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
    arg: { specialty?: string; searchQuery?: string } | string | undefined,
    { rejectWithValue }
  ) => {
    try {
      if (typeof arg === 'string') {
        return await consultationRepository.getDoctors(arg);
      }
      return await consultationRepository.getDoctors(arg?.specialty, arg?.searchQuery);
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchDoctorSlots = createAsyncThunk(
  'consultation/fetchDoctorSlots',
  async ({ doctorId, date }: { doctorId: string; date: string }, { rejectWithValue }) => {
    try {
      return await consultationRepository.getSlots(doctorId, date);
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const bookSlotThunk = createAsyncThunk(
  'consultation/bookSlot',
  async (bookingPayload: Omit<ConsultationBooking, 'id' | 'createdAt' | 'status'>, { rejectWithValue }) => {
    try {
      return await consultationRepository.bookConsultation(bookingPayload);
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const consultationSlice = createSlice({
  name: 'consultation',
  initialState,
  reducers: {
    setActiveSpecialty: (state, action: PayloadAction<string>) => {
      state.activeSpecialty = action.payload;
    },
    setSelectedDoctor: (state, action: PayloadAction<Doctor | null>) => {
      state.selectedDoctor = action.payload;
    },
    setSelectedSlot: (state, action: PayloadAction<TimeSlot | null>) => {
      state.selectedSlot = action.payload;
    },
    cancelBooking: (state, action: PayloadAction<string>) => {
      state.upcomingBookings = state.upcomingBookings.filter((b) => b.id !== action.payload);
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
      .addCase(bookSlotThunk.fulfilled, (state, action) => {
        state.upcomingBookings.unshift(action.payload);
        state.selectedSlot = null;
      });
  },
});

export const { setActiveSpecialty, setSelectedDoctor, setSelectedSlot, cancelBooking } = consultationSlice.actions;
export default consultationSlice.reducer;
