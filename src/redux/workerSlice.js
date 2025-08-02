import {createAsyncThunk, createSlice, createSelector} from '@reduxjs/toolkit';
import api from '../api/api';

export const fetchWorkersThunk = createAsyncThunk(
  'workers/list',
  async (_, {rejectWithValue}) => {
    try {
      const response = await api.get('/workers/list');
      console.log('response:', response.data.workers);

      return response.data.workers;
    } catch (error) {
      console.error(
        'Failed to fetch the workers list',
        error.response?.data?.workers?.message || error,
      );

      return rejectWithValue(
        error.response?.data?.workers?.message ||
          error.message ||
          'Failed to fetch workers',
      );
    }
  },
);

const workerSlice = createSlice({
  name: 'worker',
  initialState: {
    workers: [],
    loading: false,
    error: null,
    searchText: '',
  },
  reducers: {
    setSearchText: (state, action) => {
      state.searchText = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchWorkersThunk.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkersThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.workers = action.payload;
      })
      .addCase(fetchWorkersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const selectFilteredWorkers = createSelector(
  state => state.worker.workers,
  state => state.worker.searchText.toLowerCase(),
  (workers, searchText) =>
    workers.filter(worker => worker.name?.toLowerCase().includes(searchText)),
);

export const {setSearchText} = workerSlice.actions;
export default workerSlice.reducer;
