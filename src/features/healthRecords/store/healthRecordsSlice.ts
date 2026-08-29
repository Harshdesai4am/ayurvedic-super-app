import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { HealthRecord } from '../types/healthRecordTypes';
import { healthRecordsRepository } from '../repository/healthRecordsRepository';

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
  async (_, { dispatch, rejectWithValue }) => {
    try {
      // 1. Fetch instantly from local SQLite DB
      const localRecords = await healthRecordsRepository.getRecordsLocally();

      // 2. Fire immediate cloud sync check (async, non-blocking)
      healthRecordsRepository.syncRecordsBackground().then((updatedRecords) => {
        if (updatedRecords) {
          dispatch(setRecords(updatedRecords));
        }
      });

      return localRecords;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch health records');
    }
  }
);

export const addHealthRecordThunk = createAsyncThunk(
  'healthRecords/addRecord',
  async (payload: Omit<HealthRecord, 'id' | 'createdAt'>, { rejectWithValue }) => {
    try {
      return await healthRecordsRepository.createRecord(payload);
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to create health record');
    }
  }
);

export const healthRecordsSlice = createSlice({
  name: 'healthRecords',
  initialState,
  reducers: {
    setRecords: (state, action: PayloadAction<HealthRecord[]>) => {
      state.records = action.payload;
    },
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
        state.error = null;
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

export const { setRecords, setRecordCategoryFilter, setRecordSearchQuery, setSelectedRecord } =
  healthRecordsSlice.actions;
export default healthRecordsSlice.reducer;
