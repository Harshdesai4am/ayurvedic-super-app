import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { HealthRecord, RecordCategory } from '../types/healthRecordTypes';
import { healthRecordsRepository } from '../repositories/healthRecordsRepository';

interface HealthRecordsState {
  records: HealthRecord[];
  selectedCategory: string;
  searchQuery: string;
  selectedRecord: HealthRecord | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: HealthRecordsState = {
  records: [],
  selectedCategory: 'All',
  searchQuery: '',
  selectedRecord: null,
  isLoading: false,
  error: null,
};

export const fetchHealthRecords = createAsyncThunk(
  'healthRecords/fetchRecords',
  async (_, { rejectWithValue }) => {
    try {
      return await healthRecordsRepository.getRecords();
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const addHealthRecordThunk = createAsyncThunk(
  'healthRecords/addRecord',
  async (payload: Omit<HealthRecord, 'id' | 'createdAt'>, { rejectWithValue }) => {
    try {
      return await healthRecordsRepository.createRecord(payload);
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const healthRecordsSlice = createSlice({
  name: 'healthRecords',
  initialState,
  reducers: {
    setRecordCategoryFilter: (state, action: PayloadAction<string>) => {
      state.selectedCategory = action.payload;
    },
    setRecordSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSelectedRecord: (state, action: PayloadAction<HealthRecord | null>) => {
      state.selectedRecord = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHealthRecords.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchHealthRecords.fulfilled, (state, action) => {
        state.isLoading = false;
        state.records = action.payload;
      })
      .addCase(fetchHealthRecords.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(addHealthRecordThunk.fulfilled, (state, action) => {
        state.records.unshift(action.payload);
      });
  },
});

export const { setRecordCategoryFilter, setRecordSearchQuery, setSelectedRecord } =
  healthRecordsSlice.actions;
export default healthRecordsSlice.reducer;
