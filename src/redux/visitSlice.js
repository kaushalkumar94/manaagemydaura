import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import api from '../api/api';

export const addVisitThunk = createAsyncThunk(
  'visits/add',
  async (
    {createdBy, dateTime, location, message, isSent},
    {rejectWithValue},
  ) => {
    try {
      console.log('Visit creation data:', {
        createdBy,
        dateTime,
        location,
        message,
        isSent,
      });

      const visitData = {
        createdBy,
        dateTime,
        location,
        message,
        isSent: false,
      };

      const response = await api.post('/visits/add', visitData);

      console.log('Response from server:', response.data);
      return response.data;
    } catch (error) {
      console.error(
        'Failed to create visit:',
        error.response?.data?.message || error.message,
      );
      console.error('Error object:', error.toJSON ? error.toJSON() : error);

      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          'Something went wrong',
      );
    }
  },
);

export const deleteVisitThunk = createAsyncThunk(
  'visits/delete',
  async (visitId, {rejectWithValue}) => {
    try {
      console.log('Visit deletion data:', visitId);
      const response = await api.delete(`visits/delete/${visitId}`);
      console.log('response:', response.data);
      return {message: response.data.message, deletedId: visitId};
    } catch (error) {
      console.error(
        'Failed to delete the visit',
        error.response?.data?.message,
      );

      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          'Something went wrong',
      );
    }
  },
);

export const sendVisitThunk = createAsyncThunk(
  'visits/send',
  async ({visitId}, {rejectWithValue}) => {
    try {
      const response = await api.post('/sms/sendwhatsappvisit', {visitId});
      console.log('response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to send the visit', error.response?.data?.message);

      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          'Something went wrong',
      );
    }
  },
);

const visitSlice = createSlice({
  name: 'visit',
  initialState: {
    visits: [],
    loading: false,
    error: null,
  },
  reducers: {
    setVisits: (state, action) => {
      state.visits = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(addVisitThunk.pending, state => {
        console.log('Visit creation pending...');
        state.loading = true;
        state.error = null;
      })
      .addCase(addVisitThunk.fulfilled, (state, action) => {
        console.log('Visit created successfully');
        state.loading = false;
        state.error = null;
        const newVisit = action.payload?.newVisit || action.payload;

        if (newVisit) {
          state.visits.push(newVisit);
        } else {
          console.warn('No newVisit found in response', newVisit);
        }
      })
      .addCase(addVisitThunk.rejected, (state, action) => {
        console.log('Could not create a visit');
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteVisitThunk.pending, state => {
        console.log('Visit deletion pending..');
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteVisitThunk.fulfilled, (state, action) => {
        console.log('Visit deleted successfully');
        state.loading = false;
        state.error = null;
        state.visits = state.visits.filter(
          v => v.id !== action.payload.deletedId,
        );
      })
      .addCase(deleteVisitThunk.rejected, (state, action) => {
        console.log('Could not delete the visit');
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(sendVisitThunk.pending, state => {
        console.log('Message pending..');
        state.loading = true;
        state.error = null;
      })
      .addCase(sendVisitThunk.fulfilled, (state, action) => {
        console.log('Message sent successfully');
        state.loading = false;
        state.error = null;

        const sentVisitId = action.meta.arg.visitId;

        const index = state.visits.findIndex(v => v.id === sentVisitId);
        if (index !== -1) {
          state.visits[index] = {...state.visits[index], isSent: true};
        }
      })
      .addCase(sendVisitThunk.rejected, (state, action) => {
        console.log('Could not send the visit');
        state.loading = false;
        state.error = action.payload;
      });
  },
});
export const {setVisits} = visitSlice.actions;
export default visitSlice.reducer;
