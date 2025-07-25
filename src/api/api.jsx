import axios from 'axios';
import {Alert} from 'react-native';
import * as Keychain from 'react-native-keychain';
// You might need to import navigation actions if you want to automatically redirect to login
// import { CommonActions } from '@react-navigation/native'; // Example: for React Navigation v5/6


let navigateToLoginHandler = null;

// Function to set the navigation handler from your main App component
export const setNavigationHandler = (handler) => {
    navigateToLoginHandler = handler;
};


// Create an Axios instance
const api = axios.create({
  baseURL: 'http://10.0.2.2:3000/api', // Use your appropriate base URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the access token in all requests
api.interceptors.request.use(
  async config => {
    const credentials = await Keychain.getGenericPassword();
    if (credentials && credentials.username) {
      // Ensure username (access token) exists
      config.headers['authorization'] = `Bearer ${credentials.username}`;
      // console.log('Sending token for:', config.url); // For debugging
    }
    return config;
  },
  error => Promise.reject(error),
);

// --- State for managing concurrent refresh requests ---
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      // Reconfigure the original request with the new token
      prom.resolve(token);
    }
  });
  failedQueue = []; // Clear the queue
};

// Add a response interceptor to handle 401, 403, 498 errors (expired/invalid tokens)
api.interceptors.response.use(
  response => response, // Directly return successful responses
  async error => {
    const originalRequest = error.config;
    // Check if it's a token expiration/invalid error and not already a retry
    if (
      error.response &&
      [401, 403, 498].includes(error.response.status) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true; // Mark this request as having attempted a retry
      console.log(
        `Token error ${error.response.status} for ${originalRequest.url}. Attempting to refresh...`,
      );

      // If a refresh operation is already in progress, queue this request
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({resolve, reject});
        })
          .then(token => {
            originalRequest.headers['authorization'] = `Bearer ${token}`; // Update header with new token
            return api(originalRequest); // Retry the original request
          })
          .catch(err => {
            return Promise.reject(err); // Propagate error if queue processing fails
          });
      }

      isRefreshing = true; // Set flag to indicate refresh is in progress

      try {
        const refreshSuccess = await refreshAccessToken(); // Call the client-side refresh function

        if (refreshSuccess) {
          // refreshSuccess is true if new tokens were obtained and stored
          const credentials = await Keychain.getGenericPassword();
          if (credentials && credentials.username) {
            const newAccessToken = credentials.username;
            console.log(
              'Successfully refreshed token. Retrying original request.',
            );
            originalRequest.headers[
              'authorization'
            ] = `Bearer ${newAccessToken}`;
            processQueue(null, newAccessToken); // Resolve all queued requests with the new token
            return api(originalRequest); // Retry the original failed request
          } else {
            // Should ideally not happen if refreshSuccess is true, but as a safeguard
            console.error(
              'Refresh reported success, but no access token found in Keychain.',
            );
            processQueue(new Error('No access token after refresh.')); // Reject queued
            Alert.alert('Session Expired', 'Please log in again.');
            if (navigateToLoginHandler) {
              navigateToLoginHandler(); // Trigger navigation to LoginScreen
            }
            return Promise.reject(error); // Propagate the original error
          }
        } else {
          // Refresh failed (e.g., refresh token expired or invalid on backend)
          console.log('Refresh token failed. Forcing logout.');
          processQueue(new Error('Refresh token failed.')); // Reject queued
          Alert.alert('Session Expired', 'Please log in again.');
          if (navigateToLoginHandler) {
            navigateToLoginHandler(); // Trigger navigation to LoginScreen
          }
          return Promise.reject(error); // Propagate the original error
        }
      } catch (refreshError) {
        console.error(
          'Unexpected error during token refresh process:',
          refreshError,
        );
        processQueue(refreshError); // Reject queued
        Alert.alert('Session Expired', 'Please log in again.');
        if (navigateToLoginHandler) {
          navigateToLoginHandler(); // Trigger navigation to LoginScreen
          }
        return Promise.reject(error); // Propagate the original error
      } finally {
        isRefreshing = false; // Reset the refreshing flag regardless of outcome
      }
    }

    return Promise.reject(error); // For all other types of errors (e.g., 400, 500 not related to auth)
  },
);

// Client-side Token refresh function
// This function should be called ONLY by the interceptor
const refreshAccessToken = async () => {
  try {
    console.log('Client: Attempting to refresh access token with backend...');
    const credentials = await Keychain.getGenericPassword();
    if (!credentials || !credentials.password) {
      console.log(
        'Client: No refresh token found in Keychain. Cannot refresh.',
      );
      await Keychain.resetGenericPassword(); // Clear any partial credentials
      return false; // Indicate failure: user needs to re-login
    }
    const currentRefreshToken = credentials.password; // This is the refresh token to send to backend
    // Use plain axios here to prevent infinite recursion with the interceptor
    const response = await axios.post(
      'http://10.0.2.2:3000/api/auth/refresh', // Ensure this is your backend refresh endpoint
      {refreshToken: currentRefreshToken}, // Send the current refresh token in the body
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    // Check if backend successfully returned both new access and refresh tokens
    if (response.data.accessToken && response.data.refreshToken) {
      await Keychain.setGenericPassword(
        response.data.accessToken, // Store the NEW access token (username)
        response.data.refreshToken, // Store the NEW refresh token (password)
      );
      console.log(
        'Client: New access and refresh tokens successfully stored in Keychain.',
      );
      return true; // Indicate success
    } else {
      console.error(
        'Client: Backend did not provide complete new tokens (access or refresh).',
        response.data,
      );
      await Keychain.resetGenericPassword(); // Clear credentials on incomplete response
      return false; // Indicate failure
    }
  } catch (error) {
    console.error(
      'Client: Error during refresh token API call:',
      error.response?.status,
      error.message,
    );
    // If the backend explicitly denied (e.g., 403 because refresh token expired on backend)
    if (error.response?.status === 403) {
      console.log(
        'Client: Backend rejected refresh token (likely expired or invalid).',
      );
    }
    await Keychain.resetGenericPassword(); // Clear credentials on any refresh failure
    return false; // Indicate failure
  }
};

export default api;
