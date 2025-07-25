import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import api from '../api/api';
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({email, password}, {rejectWithValue}) => {
    try {
      console.log('Sending login data:', {email, password});

      if (!email || !password) {
        return rejectWithValue('Email and password are required.');
      }

      const response = await api.post('/auth/login', {email, password});

      console.log('login success:', response.data);

      const {
        accessToken,
        refreshToken,
        email: userEmail,
        upcomingVisits,
      } = response.data;

      await AsyncStorage.setItem('email', userEmail);
      await AsyncStorage.setItem(
        'upcomingVisits',
        JSON.stringify(upcomingVisits || []),
      );
      await Keychain.setGenericPassword(accessToken, refreshToken);
      await AsyncStorage.setItem('accessToken', accessToken);

      return {email, upcomingVisits, accessToken};
    } catch (error) {
      console.log('Login error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, {rejectWithValue}) => {
    try {
      await Keychain.resetGenericPassword();
      await AsyncStorage.removeItem('accessToken');
      return true;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: state => {
      state.error = null;
    },
    forceStopLoading: state => {
      state.loading = false;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loginUser.pending, state => {
        console.log('Log in pending...');
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        console.log('Log in successful');
        state.loading = false;
        state.user = {
          email: action.payload.email,
          accessToken: action.payload.accessToken,
          upcomingVisits: action.payload.upcomingVisits,
        };
      })
      .addCase(loginUser.rejected, (state, action) => {
        console.log('Log in rejected', action.payload);
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(logoutUser.fulfilled, state => {
        console.log('Logged out');
        state.user = null;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        console.error('Logout failed:', action.payload);
      });
  },
});
export const {clearError, forceStopLoading} = authSlice.actions;
export default authSlice.reducer;
