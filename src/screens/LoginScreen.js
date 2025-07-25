import React, {useEffect, useState} from 'react';
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
  RefreshControl,
  BackHandler,
} from 'react-native';
import api from '../api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useDispatch, useSelector} from 'react-redux';
import {loginUser} from '../redux/authSlice';
import {setVisits} from '../redux/visitSlice';
import { clearError, forceStopLoading } from '../redux/authSlice';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { useFocusEffect } from '@react-navigation/native';


const LoginScreen = ({navigation}) => {

  // useEffect(() => {
  //   dispatch(forceStopLoading());
  // }, []);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  // const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const {loading, error, user} = useSelector(state => state.auth);

  const validateEmail = text => {
    setEmail(text);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (text === '') {
      setEmailError('Email is required');
    } else if (!emailRegex.test(text)) {
      setEmailError('Enter a valid email address');
    } else {
      setEmailError('');
    }
  };

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

  const handleLogin = async () => {
    try {
      if (!email || !password) {
        Alert.alert('Error', 'Please enter both email and password.');
        return;
      }
      if (emailError) {
        Alert.alert('Error', 'Please fix the email error before proceeding.');
        return;
      }
      console.log('loginUser dispatched');

      // timeoutId = setTimeout(() => {
        // dispatch(clearError());
        // Alert.alert('Login timeout', 'Login took too long. Please try again.');
      // }, 10000);

      const userData = await dispatch(loginUser({email, password})).unwrap();
      // clearTimeout(timeoutId);
      console.log('userData:', userData);
      dispatch(setVisits(userData.upcomingVisits));
      navigation.navigate('Dashboard');
    } catch (error) {
      // clearTimeout(timeoutId);
      console.error('Login error:', error);
      Alert.alert('Login failed', error);
    }

    // setLoading(true);

    // try {
    // console.log('Email:', email);
    // console.log('Password:', password);

    // const response = await api.post('/auth/login', {email, password});

    // await AsyncStorage.setItem('accessToken', userData.accessToken);
    // await AsyncStorage.setItem('refreshToken', userData.refreshToken);
    // console.log('userData.accessToken:', userData.accessToken);
    // console.log('userData.refreshToken:', userData.refreshToken);
    // navigation.replace('Dashboard');

    //   console.log('Response:', response.data);

    //   if (response.data && response.data.accessToken) {
    //     await AsyncStorage.setItem('email', response.data.email);
    //     await AsyncStorage.setItem('accessToken', response.data.accessToken);
    //     console.log('upcoming: ', response.data.upcomingVisits);
    //     await AsyncStorage.setItem(
    //       'upcomingVisits',
    //       JSON.stringify(response.data.upcomingVisits),
    //     );

    //     const visits = await AsyncStorage.getItem('upcomingVisits');
    //     console.log('visits: ', visits);
    //     Alert.alert('Success', 'Login successful!', [
    //       {text: 'OK', onPress: () => navigation.replace('Dashboard')},
    //     ]);
    //   } else {
    //     Alert.alert('Error', 'Invalid credentials. Please try again.');
    //   }
    // } catch (error) {
    //   console.error('Login Error:', error.response?.data || error.message);

    //   Alert.alert(
    //     'Login Failed',
    //     error.response?.data?.message ||
    //       'Something went wrong. Please try again.',
    //   );
    // } finally {
    //   setLoading(false);
    // }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'windows' ? 'padding' : 'height'}
        keyboardVerticalOffset={50}
        style={{flex: 1}}>
        <View style={styles.content}>
          {/* Logo with shadow */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Access Account</Text>
          <Text style={styles.subtitle}>Sign in to continue managing your visits efficiently.</Text>

          <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor="#B0B6C3"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={text => {
                  setEmail(text);
                  validateEmail(text);
                }}
              />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#B0B6C3"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Image
                  source={
                    showPassword
                      ? require('../assets/eye_closed.png')
                      : require('../assets/eye_open.png')
                  }
                  style={styles.eyeIcon}></Image>
              </TouchableOpacity>
            </View>
          </View>

          

          <TouchableOpacity
            style={[
              styles.loginButton,
              (emailError || !email || !password) && {opacity: 0.6},
            ]}
            onPress={handleLogin}
            disabled={emailError !== '' || !email || !password || loading}>
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Log In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.forgotPasswordContainer}>
            
            <Text style={styles.forgotPasswordText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.forgotPassword}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    backgroundColor: '#F7F7FF'},
    content: {
    flex: 1,
    paddingHorizontal: 25,
    paddingTop: 40,
    justifyContent: 'center',
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#635BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  logo: {
    width: 110,
    height: 110,
    borderRadius: 24,
    backgroundColor: '#fff',
  },
  inputWrapper: {
    marginBottom: 18
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,

    paddingHorizontal: 18,
    height: 54,
    borderLeftWidth: 3,
    // borderRightWidth: 2,
    borderColor: COLORS.primaryDark,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    // elevation: 1,
  },
  input: {
    flex: 1,
    height: 54,
    color: '#222',
    fontSize: 16,
    backgroundColor:'transparent',
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
  forgotPasswordContainer: {
    justifyContent: 'center',
    flexDirection: 'row',
  },
  forgotPasswordText: {
    color: '#666',
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'AvenirNext-Regular' : 'Roboto',
    fontStyle:'italic',
    marginRight: 4,
  },
  forgotPassword: {
    color: '#5151F0',
    fontWeight:'bold' ,
    fontSize: 14
  },
  loginButton: {
    backgroundColor: '#5151F0',
    height: 50,
    width:'95%',
    borderRadius: 10,
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop:15,
    marginBottom:10
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    alignSelf:'center',
    fontFamily: Platform.OS === 'ios' ? 'AvenirNext-Bold' : 'Roboto',
    letterSpacing: 0.5,
  },
});

export default LoginScreen;
