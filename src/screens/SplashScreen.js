import {ActivityIndicator, StyleSheet, Text, View, Image} from 'react-native';
import React, {useEffect, useState} from 'react';
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';

const SplashScreen = () => {
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const credentials = await Keychain.getGenericPassword();
        const email = await AsyncStorage.getItem('email');

        console.log('AccessToken:', credentials.username);
        console.log('RefreshToken:', credentials.password);

        const accessToken = credentials.username;
        const refreshToken = credentials.password;

        if (accessToken && refreshToken && email) {
          console.log('user is logged in:', {accessToken, refreshToken, email});
          setIsLoading(false);
          navigation.replace('Dashboard');
        } else {
          console.log('No credentials found');
          navigation.replace('Login');
        }
      } catch (error) {
        console.error('Error', 'Authentication Failed');
        navigation.replace('Login');
      }
    };

    checkLogin();
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.appName}>Manage My Daura</Text>

      <ActivityIndicator size="large" color="#635BFF" style={{marginTop: 32}} />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
    borderRadius: 24,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#635BFF',
    marginBottom: 12,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#888',
    letterSpacing: 0.2,
  },
});
