import axios from 'axios';
import {Alert} from 'react-native';
import * as Keychain from 'react-native-keychain';

let navigateToLoginHandler = null;

export const setNavigationHandler = handler => {
  navigateToLoginHandler = handler;
};

const api = axios.create({
  baseURL: 'https://managemydaura-2.onrender.com/api',
  // baseURL: 'http://10.0.2.2:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async config => {
    const credentials = await Keychain.getGenericPassword();
    if (credentials && credentials.username) {
      config.headers['authorization'] = `Bearer ${credentials.username}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (
      error.response &&
      [401, 403, 498].includes(error.response.status) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      console.log(
        `Token error ${error.response.status} for ${originalRequest.url}. Attempting to refresh...`,
      );

      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({resolve, reject});
        })
          .then(token => {
            originalRequest.headers['authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      isRefreshing = true;

      try {
        const refreshSuccess = await refreshAccessToken();

        if (refreshSuccess) {
          const credentials = await Keychain.getGenericPassword();
          if (credentials && credentials.username) {
            const newAccessToken = credentials.username;
            console.log(
              'Successfully refreshed token. Retrying original request.',
            );
            originalRequest.headers[
              'authorization'
            ] = `Bearer ${newAccessToken}`;
            processQueue(null, newAccessToken);
            return api(originalRequest);
          } else {
            console.error(
              'Refresh reported success, but no access token found in Keychain.',
            );
            processQueue(new Error('No access token after refresh.'));
            Alert.alert('Session Expired', 'Please log in again.');
            if (navigateToLoginHandler) {
              navigateToLoginHandler();
            }
            return Promise.reject(error);
          }
        } else {
          console.log('Refresh token failed. Forcing logout.');
          processQueue(new Error('Refresh token failed.'));
          Alert.alert('Session Expired', 'Please log in again.');
          if (navigateToLoginHandler) {
            navigateToLoginHandler();
          }
          return Promise.reject(error);
        }
      } catch (refreshError) {
        console.error(
          'Unexpected error during token refresh process:',
          refreshError,
        );
        processQueue(refreshError);
        Alert.alert('Session Expired', 'Please log in again.');
        if (navigateToLoginHandler) {
          navigateToLoginHandler();
        }
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

const refreshAccessToken = async () => {
  try {
    console.log('Client: Attempting to refresh access token with backend...');
    const credentials = await Keychain.getGenericPassword();
    if (!credentials || !credentials.password) {
      console.log(
        'Client: No refresh token found in Keychain. Cannot refresh.',
      );
      await Keychain.resetGenericPassword();
      return false;
    }
    const currentRefreshToken = credentials.password;

    const response = await axios.post(
      'https://managemydaura-2.onrender.com/api/auth/refresh',
      // 'http://10.0.2.2:3000/api/auth/refresh',
      {refreshToken: currentRefreshToken},
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (response.data.accessToken && response.data.refreshToken) {
      await Keychain.setGenericPassword(
        response.data.accessToken,
        response.data.refreshToken,
      );
      console.log(
        'Client: New access and refresh tokens successfully stored in Keychain.',
      );
      return true;
    } else {
      console.error(
        'Client: Backend did not provide complete new tokens (access or refresh).',
        response.data,
      );
      await Keychain.resetGenericPassword();
      return false;
    }
  } catch (error) {
    console.error(
      'Client: Error during refresh token API call:',
      error.response?.status,
      error.message,
    );

    if (error.response?.status === 403) {
      console.log(
        'Client: Backend rejected refresh token (likely expired or invalid).',
      );
    }
    await Keychain.resetGenericPassword();
    return false;
  }
};

export default api;
