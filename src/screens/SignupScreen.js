import React, {useState} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  BackHandler,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SignupScreen = ({navigation}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        BackHandler.exitApp();
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const validateEmail = text => {
    setEmail(text);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailError(
      text === ''
        ? 'Email is required'
        : !emailRegex.test(text)
        ? 'Enter a valid email address'
        : '',
    );
  };

  const validatePhone = text => {
    setPhone(text);
    const phoneRegex = /^[6-9]\d{9}$/;
    setPhoneError(
      text === ''
        ? 'Phone number is required'
        : !phoneRegex.test(text)
        ? 'Enter a valid 10-digit phone number'
        : '',
    );
  };

  const handlePasswordChange = text => {
    setPassword(text);
    if (text.length < 8) {
      setPasswordError('Password must be at least 8 characters');
    } else {
      setPasswordError('');
    }
  };

  const handleSignUp = async () => {
    if (!name || !email || !phone || !password) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }

    if (emailError || phoneError || passwordError) {
      Alert.alert('Error', 'Please fix the errors before proceeding.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        phone,
        password,
      });

      if (response.data) {
        await AsyncStorage.setItem('userEmail', email);
        Alert.alert('Success', 'Registration successful! Please login now.', [
          {text: 'OK', onPress: () => navigation?.replace('Login')},
        ]);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error(
        'Registration Error:',
        error.response?.data || error.message,
      );
      Alert.alert(
        'Registration Failed',
        error.response?.data?.message ||
          'Something went wrong. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  // const handleSignUp = async () => {
  //   if (!name || !email || !phone || !password) {
  //     Alert.alert('Error', 'All fields are required.');
  //     return;
  //   }

  //   if (emailError || phoneError) {
  //     Alert.alert('Error', 'Please fix the errors before proceeding.');
  //     return;
  //   }

  //   setLoading(true);
  //   try {
  //     const response = await api.post('/auth/register', {
  //       name,
  //       email,
  //       phone,
  //       password,
  //     });

  //     if (response.data) {
  //       await AsyncStorage.multiSet([
  //         ['userEmail', email],
  //         ['accessToken', response.data.accessToken],
  //         ['refreshToken', response.data.refreshToken],
  //       ]);

  //       Alert.alert('Success', 'Registration successful! Please login now. ', [
  //         {text: 'OK', onPress: () => navigation?.replace('Login')},
  //       ]);
  //     } else {
  //       throw new Error('Invalid response from server');
  //     }
  //   } catch (error) {
  //     console.error(
  //       'Registration Error:',
  //       error.response?.data || error.message,
  //     );
  //     Alert.alert(
  //       'Registration Failed',
  //       error.response?.data?.message ||
  //         'Something went wrong. Please try again.',
  //     );
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
        style={{flex: 1}}>
        <ScrollView
          contentContainerStyle={{flexGrow: 1}}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>Get Started</Text>
            <Text style={styles.subtitle}>
              Create your account to unlock seamless visit management.
            </Text>

            <View style={styles.inputWrapper}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Your name"
                  placeholderTextColor="#B0B6C3"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor="#B0B6C3"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={validateEmail}
                />
              </View>
              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}
            </View>

            <View style={styles.inputWrapper}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Phone number"
                  placeholderTextColor="#B0B6C3"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={validatePhone}
                />
              </View>
              {phoneError ? (
                <Text style={styles.errorText}>{phoneError}</Text>
              ) : null}
            </View>

            <View style={styles.inputWrapper}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#B0B6C3"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={handlePasswordChange}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}>
                  <Image
                    source={
                      showPassword
                        ? require('../assets/eye_closed.png')
                        : require('../assets/eye_open.png')
                    }
                    style={styles.eyeIcon}></Image>
                </TouchableOpacity>
              </View>
              {password !== '' && passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={[styles.signUpButton, loading && {opacity: 0.6}]}
              onPress={handleSignUp}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLinkText}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const COLORS = {
  primary: '#635BFF',
  primaryLight: '#F0EEFF',
  primaryDark: '#4A44C9',
  background: '#FFFFFF',
  border: '#E8E8ED',
  text: '#333333',
  textSecondary: '#71717A',
  selected: '#F0EEFF',
  selectedBorder: '#635BFF',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7FF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 25,
    marginTop: 60,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#635BFF',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 16,
    // elevation: 8,
  },
  logo: {
    width: 110,
    height: 110,
    borderRadius: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#222',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'AvenirNext-Bold' : 'Roboto',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 32,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'AvenirNext-Regular' : 'Roboto',
    fontStyle: 'italic',
    letterSpacing: 0.5,
    fontWeight: '400',
  },
  inputWrapper: {
    marginBottom: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 18,
    height: 54,
    borderLeftWidth: 3,
    borderColor: COLORS.primaryDark,
    shadowColor: '#635BFF',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    // elevation: 1,
  },
  input: {
    flex: 1,
    height: 54,
    color: '#222',
    fontSize: 16,
    backgroundColor: 'transparent',
    fontFamily: Platform.OS === 'ios' ? 'AvenirNext-Regular' : 'Roboto',
  },
  eyeIcon: {
    width: 22,
    height: 22,
    tintColor: '#888',
    marginLeft: 10,
  },
  errorText: {
    color: 'red',
    fontSize: 13,
    marginTop: 5,
    fontFamily: Platform.OS === 'ios' ? 'AvenirNext-Regular' : 'Roboto',
    fontStyle: 'italic',
    letterSpacing: 0.2,
  },
  signUpButton: {
    backgroundColor: '#635BFF',
    height: 54,
    width: '95%',
    borderRadius: 12,
    justifyContent: 'center',
    alignSelf: 'center',
    shadowColor: '#635BFF',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    // elevation: 2,
    marginBottom: 10,
    marginTop: 15,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    alignSelf: 'center',
    fontFamily: Platform.OS === 'ios' ? 'AvenirNext-Bold' : 'Roboto',
    letterSpacing: 0.5,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginText: {
    color: '#666',
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'AvenirNext-Regular' : 'Roboto',
    fontStyle: 'italic',
    marginRight: 4,
  },
  loginLinkText: {
    color: '#635BFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default SignupScreen;
