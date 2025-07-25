//launch screen
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useState, useEffect, useRef} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
  StyleSheet,
  BackHandler,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

const LaunchScreen = ({navigation}) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const startAnimation = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500, // Smooth fade-in effect
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    // Handle back button press
    const backAction = () => {
      BackHandler.exitApp(); // Close the app
      return true; // Prevent default behavior
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    // Check login status
    const checkLoginStatus = async () => {
      const accessToken = await AsyncStorage.getItem('accessToken');
      setIsLoggedIn(!!accessToken);
    };
    checkLoginStatus();

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      startAnimation(); // Restart animation when screen is focused
    });

    return unsubscribe;
  }, [navigation]);

  const handleGetStarted = () => {
    navigation.navigate(isLoggedIn ? 'Dashboard' : 'Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <Animated.Image
          source={require('../assets/logo.png')}
          style={[styles.logo, {opacity: fadeAnim}]}></Animated.Image>

        {/* <Text style={styles.title}>Visit Manager</Text>

        <Text style={styles.subtitle}>
          Introducing the Visit Manager app for{'\n'}seamless travel planning
        </Text> */}

        <TouchableOpacity style={styles.startButton} onPress={handleGetStarted}>
          <Text style={styles.startButtonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // paddingHorizontal: 30,
    paddingTop: hp(25),
  },
  logo: {
    width: 220,
    height: 220,
    marginBottom: hp(10),
    // tintColor: '#635BFF',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'system',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 20,
    height: 200,
  },
  startButton: {
    backgroundColor: '#635BFF',
    paddingVertical: 15,
    borderRadius: 10,
    width: wp(90),
    alignItems: 'center',
    marginTop: hp(20),
  },
  startButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '800',
  },
});

export default LaunchScreen;
