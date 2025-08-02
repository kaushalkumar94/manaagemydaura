import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import api from '../api/api';

export const createSchedule = createAsyncThunk(
  'schedule/createSchedule',
  async ({date, slots}, {rejectWithValue}) => {
    console.log('Thunk Triggered - Payload:', {date, slots});
    try {
      const response = await api.post('/schedule/create', {date, slots});
      console.log('Backend Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Thunk Error:', error);
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create schedule',
      );
    }
  },
);

export const fetchAllSchedules = createAsyncThunk(
  'schedule/fetchAllSchedules',
  async (_, {rejectWithValue}) => {
    try {
      const response = await api.get('/schedule/fetchall');
      console.log('Fetched Schedules:', response.data);
      return response.data.schedules;
    } catch (error) {
      console.error('Fetch Error:', error);
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch schedules',
      );
    }
  },
);

export const deleteSchedule = createAsyncThunk(
  'schedule/deleteSchedule',
  async (scheduleId, {rejectWithValue}) => {
    try {
      const response = await api.delete(`/schedule/delete/${scheduleId}`);
      console.log('Deleted Schedule Data:', response.data);
      return scheduleId;
    } catch (error) {
      console.error('Delete Schedule Error:', error);
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete schedule',
      );
    }
  },
);

export const sendScheduleWhatsApp = createAsyncThunk(
  'schedule/sendScheduleWhatsApp',
  async ({scheduleId, date, slots, messages}, {rejectWithValue}) => {
    try {
      const response = await api.post('/sms/schedule-whatsapp', {
        scheduleId,
        date,
        slots,
        messages,
      });
      return {scheduleId, ...response.data};
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to send schedule via WhatsApp',
      );
    }
  },
);

const scheduleSlice = createSlice({
  name: 'schedule',
  initialState: {
    schedules: [],
    loading: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    clearScheduleStatus: state => {
      state.loading = false;
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(createSchedule.pending, state => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(createSchedule.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message;

        console.log(
          'Backend Response (createSchedule.fulfilled):',
          action.payload,
        );

        const {date, slots} = action.meta.arg;
        const existingIndex = state.schedules.findIndex(s => s.date === date);

        const newSchedule = {
          id: action.payload.scheduleId || Date.now(), // fallback if no backend ID
          date,
          slots,
          isSent: false,
        };

        if (existingIndex !== -1) {
          state.schedules[existingIndex] = newSchedule;
        } else {
          state.schedules.push(newSchedule);
        }
      })
      .addCase(createSchedule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error creating schedule';
      })

      .addCase(fetchAllSchedules.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllSchedules.fulfilled, (state, action) => {
        state.loading = false;
        state.schedules = action.payload;
      })
      .addCase(fetchAllSchedules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error fetching schedules';
      })

      .addCase(deleteSchedule.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSchedule.fulfilled, (state, action) => {
        state.loading = false;
        state.schedules = state.schedules.filter(s => s.id !== action.payload);
      })
      .addCase(deleteSchedule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error deleting schedule';
      })

      .addCase(sendScheduleWhatsApp.fulfilled, (state, action) => {
        if (action.payload.updatedSchedule) {
          const updated = action.payload.updatedSchedule;
          const idx = state.schedules.findIndex(s => s.id === updated.id);
          if (idx !== -1) {
            state.schedules[idx] = updated;
          }
        } else {
          const {scheduleId} = action.payload;
          const schedule = state.schedules.find(s => s.id === scheduleId);
          if (schedule) {
            schedule.isSent = true;
          }
        }
      })

      .addCase(sendScheduleWhatsApp.rejected, (state, action) => {
        state.error = action.payload || 'Error sending schedule';
      });
  },
});

export const {clearScheduleStatus} = scheduleSlice.actions;

export default scheduleSlice.reducer;
