import React, { useEffect } from 'react'; // Import useEffect
import { NavigationContainer, useNavigation, CommonActions } from '@react-navigation/native'; // Import useNavigation and CommonActions
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MenuProvider } from 'react-native-popup-menu'; // Keep this for your pop-up menu
import { setNavigationHandler } from './src/api/api'; // <--- Import setNavigationHandler from your api.js

// Import your screen components
import DashboardScreen from './src/screens/DashboardScreen';
import LoginScreen from './src/screens/LoginScreen';
import LaunchScreen from './src/screens/LaunchScreen';
import SignupScreen from './src/screens/SignupScreen';

const Stack = createNativeStackNavigator();

// Create a new component to wrap your Stack.Navigator
// This component will have access to the useNavigation hook.
function RootNavigator() {
  const navigation = useNavigation(); // Get the navigation object

  useEffect(() => {
    // This effect runs once when the component mounts.
    // It provides a handler function to api.js that will navigate to LoginScreen.
    setNavigationHandler(() => {
      // CommonActions.reset clears the navigation history and sets a new stack,
      // ensuring the user can't just 'go back' to authenticated screens.
      navigation.dispatch(
        CommonActions.reset({
          index: 0, // Resets to the first route in the 'routes' array
          routes: [{ name: 'Login' }], // Navigates to the 'Login' screen
        })
      );
    });
  }, [navigation]); // Depend on 'navigation' to re-run if it ever changes

  return (
    <Stack.Navigator
      initialRouteName="Launch" // Your initial route from App.js
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Launch" component={LaunchScreen} />
      {/* Ensure your LoginScreen is registered with the name 'Login' */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      {/* Add any other Stack.Screens you have */}
    </Stack.Navigator>
  );
}

const App = () => {
  return (
    <MenuProvider>
      <NavigationContainer>
        {/* Use the new RootNavigator component here */}
        <RootNavigator />
      </NavigationContainer>
    </MenuProvider>
  );
};

export default App;