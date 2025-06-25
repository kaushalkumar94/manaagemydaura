import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  FlatList,
  Alert,
  Modal,
  TextInput,
  StyleSheet,
  Platform,
  PermissionsAndroid,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import {sendSchedule} from '../redux/scheduleSlice';
import {deleteSchedule} from '../redux/scheduleSlice';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {NavigationContainer} from '@react-navigation/native';
import Contacts from 'react-native-contacts';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment-timezone';
import api from '../api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, CommonActions} from '@react-navigation/native';
import {logoutUser} from '../redux/authSlice';
import * as Keychain from 'react-native-keychain';
import {useDispatch, useSelector} from 'react-redux';
import {
  addVisitThunk,
  deleteVisitThunk,
  sendVisitThunk,
  setVisits,
} from '../redux/visitSlice';
import {
  fetchWorkersThunk,
  setSearchText,
  selectFilteredWorkers,
} from '../redux/workerSlice';
import {createSchedule, fetchAllSchedules} from '../redux/scheduleSlice';

const DashboardScreen = () => {
  const [visits, setVisits] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [menuModalVisible, setMenuModalVisible] = useState(false);
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [dateTimeMode, setDateTimeMode] = useState('date');
  const [dateTimeText, setDateTimeText] = useState('Select Date & Time');
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalContactVisible, setModalContactVisible] = useState(false);
  const [visitList, setVisitList] = useState([]);
  const [scheduleDate, setScheduleDate] = useState('');
  // const [workers, setWorkers] = useState([]);
  const [workersModalVisible, setWorkersModalVisible] = useState(false);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [scheduleList, setScheduleList] = useState([]);

  const [slots, setSlots] = useState([]);
  const [startTime, setStartTime] = useState('');
  const navigation = useNavigation();

  const dispatch = useDispatch();
  const visitsFetched = useSelector(state => state.visit.visits);
  const workers = useSelector(state => state.worker.workers);
  const searchText = useSelector(state => state.worker.searchText);
  const filteredWorkers = useSelector(selectFilteredWorkers);
  const isReduxLoading = useSelector(state => state.worker.loading);
  const error = useSelector(state => state.worker.error);
  const {
    schedules,
    loading: schedulesLoading,
    error: schedulesError,
  } = useSelector(state => state.schedule);
  const Tab = createMaterialTopTabNavigator();

  const formatDate = date => moment(date).format('DD-MM-YY') || '';
  const formatTime = time => moment(time).format('hh:mm A') || '';

  useEffect(() => {
    // const checkLogin = async () => {
    //   try {
    //     const credentials = await Keychain.getGenericPassword();

    //     if (!credentials) {
    //       console.log('No credentials found in Keychain');
    //       navigation.replace('Login');
    //       return;
    //     }
    //     const email = await AsyncStorage.getItem('email');

    //     const accessToken = credentials.username;
    //     const refreshToken = credentials.password;

    //     console.log('checking login detail at dashboard screen');

    //     if (accessToken && refreshToken && email) {
    //       console.log('user is logged in:', {accessToken, refreshToken, email});
    //       setLoading(false);
    //       // navigation.navigate('Dashboard');
    //     } else {
    //       console.log('No credentials found');
    //       navigation.replace('Login');
    //     }
    //   } catch (error) {
    //     console.error('Error', 'Authentication Failed');
    //     navigation.replace('Login');
    //   }
    // };

    const checkAuth = async () => {
      try {
        const accessToken = await AsyncStorage.getItem('accessToken');
        const email = await AsyncStorage.getItem('email');
        if (!accessToken || !email) {
          Alert.alert('Session expired', 'Please log in again.');
          navigation.replace('Login');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        navigation.replace('Login');
      }
    };
    checkAuth();
    dispatch(fetchAllSchedules());
  }, []);

  const showMode = () => {
    setDateTimeMode('date');
    setShowDatePicker(true);
  };

  const handleLogout = async () => {
    setLoading(true);
    console.log('Logout initiated');

    try {
      const [email, credentials] = await Promise.all([
        AsyncStorage.getItem('email'),
        Keychain.getGenericPassword(),
      ]);

      if (!credentials) {
        console.log('credentials not found!');
        return;
      }

      const accessToken = credentials.username;
      const refreshToken = credentials.password;
      console.log('User data retrieved:', [email, accessToken, refreshToken]);
      try {
        await dispatch(logoutUser()).unwrap();

        await AsyncStorage.multiRemove(['email', 'upcomingVisits']);
        console.log('Local storage cleared');

        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: 'Launch'}],
          }),
        );
        console.log('Backend logout successful');
      } catch (apiError) {
        console.warn('Backend logout failed:', apiError);
      }
    } catch (error) {
      console.error('Logout error:', error);
      setLoading(false);

      Alert.alert('Logout Complete', 'You have been signed out.', [
        {text: 'OK', onPress: () => navigation.navigate('Launch')},
      ]);
    }
  };

  const confirmLogout = () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to sign out?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: handleLogout,
      },
    ]);
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(false);

    if (dateTimeMode === 'date') {
      setDate(currentDate);
      setDateTimeMode('time');
      setShowDatePicker(true); // Show time picker next
    } else {
      setDate(currentDate);
      setDateTimeText(moment(currentDate).format('YYYY-MM-DD HH:mm'));
      setDateTimeMode('date'); // Reset mode for next use
    }
  };

  // const addVisit = async () => {
  //   if (!dateTimeText || !location || !message) {
  //     Alert.alert('Error', 'All fields are required.');
  //     return;
  //   }

  //   try {
  //     const userEmail = await AsyncStorage.getItem('email');
  //     if (!userEmail) {
  //       Alert.alert('Error', 'User not logged in. Please log in again.');
  //       return;
  //     }

  //     const visitData = {
  //       createdBy: userEmail,
  //       dateTime: dateTimeText,
  //       location,
  //       message,
  //       isSent: false,
  //     };

  //     setLoading(true);

  //     // 1. First add to server
  //     const response = await api.post('/visits/add', visitData);
  //     const newVisit = response.data.newVisit || {
  //       ...visitData,
  //       id: Date.now().toString(), // fallback ID if server doesn't provide
  //     };

  //     // 2. Get current visits from AsyncStorage
  //     const storedVisits = await AsyncStorage.getItem('upcomingVisits');
  //     let existingVisits = [];

  //     try {
  //       existingVisits = storedVisits ? JSON.parse(storedVisits) : [];
  //       if (!Array.isArray(existingVisits)) {
  //         existingVisits = []; // Ensure we always work with an array
  //       }
  //     } catch (e) {
  //       console.error('Error parsing stored visits:', e);
  //     }

  //     // 3. Create updated visits array
  //     const updatedVisits = [newVisit, ...existingVisits];

  //     // 4. Update both state and AsyncStorage
  //     setVisitList(updatedVisits);
  //     await AsyncStorage.setItem(
  //       'upcomingVisits',
  //       JSON.stringify(updatedVisits),
  //     ); // Fixed key

  //     // 5. Reset form
  //     setModalVisible(false);
  //     setMenuModalVisible(false);
  //     setDateTimeText('Select Date & Time');
  //     setLocation('');
  //     setMessage('');

  //     Alert.alert('Success', 'Visit created successfully!');
  //   } catch (error) {
  //     console.error(
  //       'Visit Creation Error:',
  //       error.response?.data || error.message,
  //     );

  //     Alert.alert(
  //       'Visit Creation Failed',
  //       error.response?.data?.message ||
  //         'Something went wrong. Please try again.',
  //     );

  //     // Optional: Revert optimistic update if you added one
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const addVisit = async () => {
    if (!dateTimeText || !location || !message) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }

    // visitsFetched = [...(visitsFetched || [])].sort((a, b) => {
    //   const dateA = new Date(`${a.dateTime.date}T${a.dateTime.time}`);
    //   const dateB = new Date(`${b.dateTime.date}T${b.dateTime.time}`);
    //   return dateA - dateB; // Ascending order
    // });

    try {
      const userEmail = await AsyncStorage.getItem('email');
      if (!userEmail) {
        Alert.alert('Error', 'User not logged in. Please log in again.');
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: 'Launch'}],
          }),
        );
        return;
      }

      const visitData = {
        createdBy: userEmail,
        dateTime: dateTimeText,
        location,
        message,
        isSent: false,
      };

      setLoading(true);

      const resultAction = await dispatch(addVisitThunk(visitData));

      console.log('Was success?', addVisitThunk.fulfilled.match(resultAction));

      if (addVisitThunk.fulfilled.match(resultAction)) {
        console.log('resultAction:', resultAction);

        // --- START OF MODIFICATION ---
        // Get the newVisit object. If it exists, create a *mutable copy* of it.
        // If it doesn't exist, fall back to creating a new object from visitData.
        let newVisit = resultAction.payload?.newVisit
          ? {...resultAction.payload.newVisit} // Create a mutable copy here
          : {
              ...visitData,
              id: Date.now().toString(),
            };

        // Ensure dateTime is a simple string for storage if it's an object from the backend
        if (
          typeof newVisit.dateTime === 'object' &&
          newVisit.dateTime !== null
        ) {
          // Assuming your backend sends { date: 'YYYY-MM-DD', time: 'HH:MM' }
          if (newVisit.dateTime.date && newVisit.dateTime.time) {
            newVisit.dateTime = `${newVisit.dateTime.date} ${newVisit.dateTime.time}`;
          } else {
            console.warn(
              'Unexpected dateTime object structure:',
              newVisit.dateTime,
            );
            newVisit.dateTime = ''; // Fallback
          }
        }
        // --- END OF MODIFICATION ---

        const storedVisits = await AsyncStorage.getItem('upcomingVisits');

        console.log('storedVisits:', storedVisits);

        let existingVisits = [];
        try {
          existingVisits = storedVisits ? JSON.parse(storedVisits) : [];
          if (!Array.isArray(existingVisits)) existingVisits = [];
        } catch (err) {
          console.error('Error parsing stored visits:', err);
        }

        const updatedVisits = [newVisit, ...existingVisits];

        setVisitList(updatedVisits);
        await AsyncStorage.setItem(
          'upcomingVisits',
          JSON.stringify(updatedVisits),
        );

        // 4. Clear UI state
        setModalVisible(false);
        setMenuModalVisible(false);
        setDateTimeText('Select Date & Time');
        setLocation('');
        setMessage('');

        Alert.alert('Success', 'Visit created successfully!');
      } else {
        Alert.alert('Error', resultAction.payload || 'Failed to create visit');
      }
    } catch (error) {
      console.error('Visit Creation Error:', error?.message || error);
      Alert.alert(
        'Visit Creation Failed',
        'Something went wrong. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteVisit = async visitId => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this visit?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeleteVisit(visitId),
        },
      ],
    );
  };

  const handleDeleteVisit = async visitId => {
    // setLoading(true);
    try {
      const resultAction = await dispatch(deleteVisitThunk(visitId));
      console.log('resultAction:', resultAction);

      const updatedVisits = visitList.filter(visit => visit.id !== visitId);
      console.log('updatedVisits:', updatedVisits);

      setVisitList(updatedVisits);
      await AsyncStorage.setItem(
        'upcomingVisits',
        JSON.stringify(updatedVisits),
      );

      Alert.alert('Success', 'Visit deleted successfully.');
    } catch (error) {
      console.error('Visit deletion failed', error?.message || error);
      Alert.alert(
        'Visit Deletion Failed',
        'Something went wrong. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const cancelVisit = async => {
    setLoading(true);
    try {
      setModalVisible(false);
      setDateTimeText('Select Date & Time');
      setLocation('');
      setMessage('');
    } catch (error) {
      console.error(
        'Error:',
        error.response?.data?.message ||
          'Could not cancel the visit. Try again later.',
      );
    } finally {
      setLoading(false);
    }
  };

  // const sendVisit = async visitId => {
  //   setLoading(true);
  //   console.log('Sending Visit:', visitId);

  //   try {
  //     const resultAction = await dispatch(sendVisitThunk({visitId}));

  //     if (sendVisitThunk.fulfilled.match(resultAction)) {
  //       console.log('Dispatched result:', resultAction.payload);
  //       Alert.alert('Success', 'Visit details sent successfully!');
  //     } else {
  //       throw new Error(
  //         resultAction.payload || 'Failed to send visit details.',
  //       );
  //     }
  //   } catch (error) {
  //     console.error('Send Visit Error:', error.message || error);
  //     Alert.alert('Error', error.message || 'Failed to send visit details.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const sendVisit = async () => {
    Alert.alert(
      'Confirm to send the message', // Title
      'Are you sure you want to send this message?', // Message
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Send message cancelled'), // Optional: action when Cancel is pressed
          style: 'cancel', // Correct property and value for 'Cancel' button
        },
        {
          text: 'Send',
          onPress: async () => {
            console.log('Sending message confirmed for visitId:', visitId);
            try {
              const resultAction = await dispatch(sendVisitThunk({visitId}));

              if (sendVisitThunk.fulfilled.match(resultAction)) {
                console.log('Dispatched result:', resultAction.payload);
                Alert.alert('Success', 'Visit details sent successfully!');
              } else {
                throw new Error(
                  resultAction.payload || 'Failed to send visit details.',
                );
              }
            } catch (error) {
              console.error('Send Visit Error:', error.message || error);
              Alert.alert(
                'Error',
                error.message || 'Failed to send visit details.',
              );
            } finally {
              setLoading(false);
            }

            // If you're using the direct fetch function from earlier:
            // await sendWhatsAppMessagesForVisit(visitId);
            // Make sure to handle loading states / errors around this call
          },
          style: 'default', // Correct property and common style for a primary action
        },
      ],
      // Optional: options object (e.g., { cancelable: false } to prevent dismissing by tapping outside)
      {cancelable: true},
    );
  };

  const requestContactsPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
          {
            title: 'Contacts Permission',
            message: 'This app needs access to your contacts.',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (error) {
        console.error('Permission error:', error);
        return false;
      }
    }
    return true;
  };

  const loadContacts = async () => {
    try {
      console.log('[1] Starting contact loading process');
      setLoading(true);

      const hasPermission = await requestContactsPermission();
      console.log('[2] Permission result:', hasPermission);

      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Cannot access contacts.');
        return;
      }

      console.log('[3] Fetching contacts from device...');
      const contactList = await Contacts.getAll();
      console.log('[4] Raw contacts received:', contactList.length, 'contacts');

      const formattedContacts = contactList
        // .slice(0, 500)
        .map(contact => {
          const formatted = {
            id: contact.recordID,
            name:
              contact.displayName ||
              `${contact.givenName} ${contact.familyName}`.trim() ||
              'Unknown',
            phoneNumber: contact.phoneNumbers?.[0]?.number || 'N/A',
          };
          console.log('[5] Formatted contact:', formatted);
          return formatted;
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      console.log('[6] Final formatted contacts:', formattedContacts);
      setContacts(formattedContacts);
    } catch (error) {
      console.error('[ERROR] Load contacts error:', error);
      Alert.alert('Error', 'Failed to load contacts.');
    } finally {
      console.log('[7] Loading complete');
      setLoading(false);
    }
  };

  const toggleContactSelection = contact => {
    setSelectedContacts(prev =>
      prev.some(c => c.id === contact.id)
        ? prev.filter(c => c.id !== contact.id)
        : [...prev, contact],
    );
  };

  const confirmAddWorkers = () => {
    if (selectedContacts.length === 0) {
      Alert.alert('No Selection', 'Please select at least one contact.');
      return;
    }

    Alert.alert('Confirm', `Add ${selectedContacts.length} workers?`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Add', onPress: () => handleAddWorkers()},
    ]);
  };

  const handleAddWorkers = async () => {
    if (selectedContacts.length === 0) {
      Alert.alert('Error', 'Please select at least one contact.');
      return;
    }

    setLoading(true);

    try {
      console.log('Selected Contacts:', selectedContacts);

      const workersData = selectedContacts.map(contact => ({
        name: contact.name,
        phoneNumber: contact.phoneNumber.replace(/[^0-9]/g, ''),
      }));

      const response = await api.post('/workers/add', {
        workersData: workersData,
      });

      console.log('API Response:', response.data);

      if (response.data && response.data.addedWorkers > 0) {
        Alert.alert('Success', `${selectedContacts.length} workers added!`, [
          {
            text: 'OK',
            onPress: () => {
              setMenuModalVisible(false);
              setSelectedContacts([]);
              setModalContactVisible(false);
            },
          },
        ]);
      } else {
        throw new Error(response.data?.message || 'Failed to add workers');
      }
    } catch (error) {
      console.error(
        'Add Workers Error:',
        error.response?.data || error.message,
      );

      Alert.alert(
        'Add Workers Failed',
        error.response?.data?.message ||
          'Something went wrong. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const openContactsModal = () => {
    setModalContactVisible(true);
    loadContacts();
    setMenuModalVisible(false);
  };

  const closeContactsModal = () => {
    setModalContactVisible(false);
    setSelectedContacts([]);
    setMenuModalVisible(false);
  };

  const createVisit = async () => {
    setModalVisible(true);
    setMenuModalVisible(false);
  };

  const workersList = async () => {
    setLoading(true);
    try {
      const workers = await dispatch(fetchWorkersThunk()).unwrap();

      console.log('Fetched workers:', workers);
      setWorkersModalVisible(true);
    } catch (error) {
      console.error('Error fetching workers:', error.message);
      Alert.alert(
        'Error',
        error.message || 'Failed to load workers list. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const closeWorkersModal = () => {
    setWorkersModalVisible(false);
    setMenuModalVisible(false);
  };

  const confirmRemovedWorkers = () => {
    if (selectedContacts.length === 0) {
      Alert.alert('No Selection', 'Please select at least one contact.');
      return;
    }

    Alert.alert('Confirm', `Removed ${selectedContacts.length} workers?`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Removed', onPress: () => handleRemovedWorkers()},
    ]);

    setWorkersModalVisible(false);
    setMenuModalVisible(false);
  };

  const handleRemovedWorkers = async () => {
    if (selectedContacts.length === 0) {
      Alert.alert('Error', 'Please select at least one contact.');
      return;
    }

    setLoading(true);

    try {
      console.log('Selected Contacts:', selectedContacts);

      const removedWorkersData = selectedContacts.map(contact => ({
        name: contact.name,
        phoneNumber: contact.phoneNumber.replace(/[^0-9]/g, ''),
      }));

      const response = await api.post('/workers/remove', {
        removedWorkersData: removedWorkersData,
      });

      console.log('API Response:', response.data);

      if (response.data && response.data.success) {
        Alert.alert('Success', `${selectedContacts.length} workers removed!`, [
          {
            text: 'OK',
            onPress: () => {
              setSelectedContacts([]);
              setWorkersModalVisible(false);
            },
          },
        ]);
      } else {
        throw new Error(response.data?.message || 'Failed to add workers');
      }
    } catch (error) {
      console.error(
        'Add Workers Error:',
        error.response?.data || error.message,
      );

      Alert.alert(
        'Add Workers Failed',
        error.response?.data?.message ||
          'Something went wrong. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const convertTo24Hour = timeStr => {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');

    hours = parseInt(hours, 10);

    if (modifier === 'PM' && hours !== 12) {
      hours += 12;
    }
    if (modifier === 'AM' && hours === 12) {
      hours = 0;
    }

    return `${String(hours).padStart(2, '0')}:${minutes}:00`;
  };

  // const handleSchedule = () => {
  //   if (!date || slots.length === 0) {
  //     Alert.alert(
  //       'Missing Information',
  //       'Please select a date and add at least one time slot.',
  //     );
  //     return;
  //   }

  //   // Format date as dd-mm-yy
  //   const formattedDate = `${String(date.getDate()).padStart(2, '0')}-${String(
  //     date.getMonth() + 1,
  //   ).padStart(2, '0')}-${String(date.getFullYear()).slice(-2)}`;

  //   const schedulePayload = {
  //     date: formattedDate, // Format: dd-mm-yy
  //     slots: slots.map(slot => ({
  //       time: slot.startTime, // Only start time
  //       message: slot.message,
  //       location: slot.location,
  //     })),
  //   };

  //   dispatch(addSchedule(schedulePayload));
  //   Alert.alert('Success', 'Schedule added successfully!');
  //   setScheduleModalVisible(false); // Close modal
  // };

  const openScheduleModal = () => {
    setScheduleModalVisible(true);
    setDate('');
    setLocation('');
    setStartTime('');
    setMessage('');
    setMenuModalVisible(false);
  };

  // Function to close modal
  const closeScheduleModal = () => {
    setScheduleModalVisible(false);
    setScheduleDate('');
    setLocation('');
    setMessage('');
    setStartTime('');
    setSlots('');
  };
  const handleAddSlot = () => {
    if (!startTime || !location || !message) {
      Alert.alert('Oops!', 'Please fill all fields to add a time slot.');
      return;
    }

    const newSlot = {
      startTime: formatTime(startTime),
      location,
      message,
    };

    setSlots(prevSlots => [...prevSlots, newSlot]);

    // Reset fields
    setStartTime(null);
    setLocation('');
    setMessage('');
  };

  // const handleSchedule = () => {
  //   if (!scheduleDate || slots.length === 0) {
  //     Alert.alert(
  //       'Missing Information',
  //       'Please enter a date and add at least one slot.',
  //     );
  //     return;
  //   }

  //   const payload = {
  //     date, // already a string
  //     slots, // already contains string values
  //   };

  //   dispatch(createSchedule(payload));
  //   Alert.alert('Success', 'Schedule saved successfully!');
  //   setDate('');
  //   setSlots([]);
  //   closeScheduleModal;
  //   setScheduleModalVisible(false);
  // };

  const handleSchedule = async () => {
    if (!scheduleDate || slots.length === 0) {
      Alert.alert(
        'Missing Information',
        'Please enter a date and add at least one slot.',
      );
      return;
    }

    const formattedDate = formatDate(scheduleDate);
    const stringifiedSlots = slots.map(slot => ({
      time: String(slot.startTime),
      message: String(slot.message),
      location: String(slot.location),
    }));

    const payload = {
      date: String(formattedDate),
      slots: stringifiedSlots,
    };

    console.log('Payload:', payload);

    dispatch(createSchedule(payload))
      .unwrap()
      .then(() => {
        Alert.alert('Success', 'Schedule saved successfully!');
        setScheduleDate(null);
        setSlots([]);
        closeScheduleModal();
      })
      .catch(error => {
        console.error('Schedule error:', error);
        Alert.alert('Error', error?.message || 'Something went wrong.');
      });
  };

  const handleScheduleDelete = async scheduleId => {
    try {
      console.log('scheduleId:', scheduleId);
      const resultAction = await dispatch(deleteSchedule(scheduleId));
      console.log('resultAction:', resultAction);

      const updatedSchedules = scheduleList.filter(
        schedule => schedule.id !== scheduleId,
      );

      setScheduleList(updatedSchedules);
      await AsyncStorage.setItem('schedules', JSON.stringify(updatedSchedules));
      Alert.alert('Success', 'Schedule deleted successfully.');
    } catch (error) {
      console.error('Schedule deletion failed', error?.message || error);
      Alert.alert(
        'Schedule Deletion Failed',
        'Something went wrong. Please try again.',
      );
    }
  };

  const handleScheduleSend = () => {
    Alert.alert(
      "Can't share schedule",
      'Messaging service is down, message will be sent automatically once the service is up again.',
    );
  };

  const ScheduleCard = ({
    schedule,
    handleScheduleDelete,
    handleScheduleSend,
  }) => {
    const [expanded, setExpanded] = useState(false);
    const slots = Array.isArray(schedule.slots) ? schedule.slots : [];
    const slotsToDisplay = expanded ? slots : slots.slice(0, 4);

    return (
      <View style={styles.card}>
        <Text style={styles.dateTitle}>{schedule.date}</Text>
        {slotsToDisplay.map((slot, index) => (
          <View key={index} style={styles.slotRow}>
            <Text style={styles.slotTime}>{slot.time}</Text>
            <View style={styles.slotDetails}>
              <Text style={styles.slotMessage}>{slot.message}</Text>
              {slot.location ? (
                <Text style={styles.slotLocation}>{slot.location}</Text>
              ) : null}
            </View>
          </View>
        ))}
        {slots.length > 4 && (
          <TouchableOpacity onPress={() => setExpanded(!expanded)}>
            <Text style={styles.moreLessText}>
              {expanded ? 'Show less' : '...more'}
            </Text>
          </TouchableOpacity>
        )}

        {schedule.isSent ? (
          <Text style={styles.sentText}>Message already sent!</Text>
        ) : (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleScheduleDelete(schedule.id)}>
              <Text style={styles.buttonText}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleScheduleSend}>
              <Text style={styles.buttonText}>Send</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const VisitsTab = () => {
    const sortedVisits = [...visitsFetched].sort(
      (a, b) => new Date(a.dateTime.date) - new Date(b.dateTime.date),
    );

    return (
      <FlatList
        style={styles.flatList}
        data={sortedVisits}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <Text style={styles.noVisitsText}>No visits created yet..</Text>
        }
        renderItem={({item}) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {item.dateTime.date} at {item.dateTime.time}
            </Text>
            <Text style={styles.cardSubtitle}>{item.location}</Text>
            <Text numberOfLines={2} style={styles.cardMessage}>
              {item.message}
            </Text>
            {item.isSent ? (
              <Text style={styles.sentText}>Message already sent!</Text>
            ) : (
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteVisit(item.id)}>
                  <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={() => sendVisit(item.id)}>
                  <Text style={styles.buttonText}>Send</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />
    );
  };

  const SchedulesTab = () => {
    const sortedSchedules = [...schedules].sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );

    return (
      <FlatList
        style={styles.flatList}
        data={sortedSchedules}
        keyExtractor={(item, index) => `${item.date}-${index}`}
        ListEmptyComponent={
          <Text style={styles.noVisitsText}>No schedules created yet..</Text>
        }
        renderItem={({item}) => (
          <ScheduleCard
            schedule={item}
            handleScheduleSend={handleScheduleSend}
            handleScheduleDelete={handleScheduleDelete}
          />
        )}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <Image
          source={require('../assets/header.png')}
          style={styles.headerLogo}></Image>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Upcoming Events</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.popupMenu}
              onPress={() => setMenuModalVisible(true)}>
              <Image
                // style={styles.popupMenu}
                source={require('../assets/popupMenuIcon.png')}></Image>
            </TouchableOpacity>
          </View>
        </View>

        <Tab.Navigator
          screenOptions={{
            tabBarLabelStyle: {
              fontSize: 16,
              fontWeight: 'bold',
              // color: '#635BFF',
            },
            tabBarIndicatorStyle: {
              backgroundColor: '#635BFF',
              height: '3',
            },
            tabBarStyle: {backgroundColor: '#fff'},
          }}>
          <Tab.Screen name="Visits" component={VisitsTab} />
          <Tab.Screen
            style={styles.tabHeaders}
            name="Schedules"
            component={SchedulesTab}
          />
        </Tab.Navigator>

        <Modal visible={modalVisible} transparent animationType="fade">
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={styles.modalOverlaym}>
              <View style={styles.modalContainerm}>
                <Text style={styles.modalTitlem}>Create Visit</Text>

                <View style={styles.dateTimeInputContainerm}>
                  <TouchableOpacity
                    onPress={showMode}
                    style={styles.datePickerButtonm}>
                    <Text>{dateTimeText}</Text>
                  </TouchableOpacity>
                </View>

                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode={dateTimeMode}
                    is24Hour={false}
                    display="default"
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                  />
                )}
                <TextInput
                  placeholder="Location"
                  placeholderTextColor="grey"
                  value={location}
                  onChangeText={setLocation}
                  style={styles.inputm}
                />
                <TextInput
                  placeholder="Message"
                  placeholderTextColor="grey"
                  value={message}
                  onChangeText={setMessage}
                  multiline={true}
                  returnKeyType="default"
                  style={[styles.inputm]}
                />

                <View style={styles.modalButtonsm}>
                  <TouchableOpacity
                    style={[styles.cancelButtonm, styles.modalButtonm]}
                    onPress={cancelVisit}>
                    <Text style={styles.cancelButtonTextm}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.createButtonm, styles.modalButtonm]}
                    onPress={addVisit}
                    disabled={loading}>
                    <Text style={styles.createButtonTextm}>
                      {loading ? 'Creating...' : 'Create'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
        <Modal
          animationType="fade"
          transparent={true}
          visible={menuModalVisible}
          onRequestClose={() => setMenuModalVisible(false)}>
          <TouchableWithoutFeedback onPress={() => setMenuModalVisible(false)}>
            <View style={styles.menuModalContainer}>
              <View style={styles.menuModalContent}>
                <TouchableOpacity
                  style={[styles.popupButton, styles.createScheduleMenuButton]}
                  onPress={openScheduleModal}>
                  <Text style={styles.createScheduleMenuButtonText}>
                    Create Schedule
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.popupButton, styles.createVisitMenuButton]}
                  onPress={createVisit}>
                  <Text style={styles.createVisitMenuButtonText}>
                    Create Visit
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.popupButton, styles.workerMenuButton]}
                  onPress={openContactsModal}>
                  <Text style={styles.workerMenuButtonText}>Add Workers</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.popupButton, styles.workerListButton]}
                  onPress={workersList}>
                  <Text style={styles.workersListButtonText}>Workers List</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.popupButton, styles.logoutButton]}
                  onPress={confirmLogout}>
                  <Text style={styles.logoutButtonText}>Log Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
        <Modal
          visible={modalContactVisible}
          animationType="fade"
          onRequestClose={closeContactsModal}>
          <View style={styles.modalContactsContainer}>
            <View style={styles.modalContactsHeader}>
              <Text style={styles.modalContactsTitle}>Select Workers</Text>
              <TouchableOpacity onPress={closeContactsModal}>
                <Text style={{color: COLORS.primary, fontSize: 16}}>Close</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.modalContactsLoadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : (
              <>
                <FlatList
                  initialNumToRender={15}
                  windowSize={10}
                  maxToRenderPerBatch={5}
                  updateCellsBatchingPeriod={50}
                  data={contacts}
                  style={styles.modalContactsListContainer}
                  keyExtractor={item => item.id}
                  renderItem={({item}) => (
                    <TouchableOpacity
                      style={[
                        styles.modalContactsItem,
                        selectedContacts.some(c => c.id === item.id) &&
                          styles.modalContactsSelectedItem,
                      ]}
                      onPress={() => toggleContactSelection(item)}>
                      <Text style={styles.modalContactsName}>{item.name}</Text>
                      <Text style={styles.modalContactsPhone}>
                        {item.phoneNumber}
                      </Text>
                    </TouchableOpacity>
                  )}
                />

                <View style={styles.modalContactsFooter}>
                  <Text style={styles.modalContactsSelectionCount}>
                    {selectedContacts.length} selected
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.modalContactsActionButton,
                      selectedContacts.length === 0 &&
                        styles.modalContactsActionButtonDisabled,
                    ]}
                    onPress={confirmAddWorkers}
                    disabled={selectedContacts.length === 0}>
                    <Text style={styles.modalContactsActionButtonText}>
                      Add Workers
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </Modal>
        <Modal
          animationType="fade"
          transparent={true}
          visible={workersModalVisible}
          onRequestClose={closeWorkersModal}>
          <View style={styles.workerListModalContainer}>
            <View style={styles.workerListModalContent}>
              <View style={styles.workerListModalHeader}>
                <Text style={styles.workerListModalTitle}>Workers List</Text>
                <TouchableOpacity
                  style={styles.workerListCloseButton}
                  onPress={closeWorkersModal}>
                  <Text style={styles.workerListCloseButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
              <View>
                <TextInput
                  placeholder="Search Workers..."
                  placeholderTextColor="#555"
                  value={searchText}
                  onChangeText={text => dispatch(setSearchText(text))}
                  style={styles.workerListModalSearch}></TextInput>
              </View>

              {loading || isReduxLoading ? (
                <ActivityIndicator
                  size="large"
                  color="#007AFF"></ActivityIndicator>
              ) : (
                <FlatList
                  data={filteredWorkers}
                  keyExtractor={item => item.id}
                  renderItem={({item}) => (
                    <View style={styles.workerListCard}>
                      <Text style={styles.workerListName}>{item.name}</Text>
                      <Text style={styles.workerListPhoneNum}>
                        {item.phoneNumber || 'N/A'}
                      </Text>
                    </View>
                  )}></FlatList>
              )}
            </View>
          </View>
        </Modal>
        <Modal
          visible={scheduleModalVisible}
          animationType="fade"
          transparent={true}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.scheduleModalOverlay}>
            <View style={styles.scheduleModalContainer}>
              <Text style={styles.heading}>Create a Schedule</Text>

              <TouchableOpacity
                disabled={slots.length > 0}
                style={styles.scheduleDateTimeInputContainer}
                onPress={() => setShowDatePicker(true)}>
                <Text style={styles.scheduleDateTimeInput}>
                  {scheduleDate
                    ? `Date: ${formatDate(scheduleDate)}`
                    : 'Enter Date'}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={scheduleDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setScheduleDate(selectedDate);
                  }}
                />
              )}

              <Text style={styles.subHeading}>Add Time Slot</Text>

              <TouchableOpacity onPress={() => setShowTimePicker(true)}>
                <Text style={styles.scheduleDateTimeInput}>
                  {startTime ? `${formatTime(startTime)}` : 'Enter Start Time'}
                </Text>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={startTime || new Date()}
                  mode="time"
                  is24Hour={false}
                  display="default"
                  onChange={(event, selectedTime) => {
                    setShowTimePicker(false);
                    if (selectedTime) setStartTime(selectedTime);
                  }}
                />
              )}

              <TextInput
                style={styles.scheduleInput}
                placeholder="Location"
                placeholderTextColor={'#555'}
                value={location}
                onChangeText={setLocation}
              />

              <TextInput
                style={styles.scheduleInput}
                placeholder="Message"
                placeholderTextColor={'#555'}
                value={message}
                onChangeText={setMessage}
              />

              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddSlot}>
                <Text style={styles.addButtonText}>+ Add Slot</Text>
              </TouchableOpacity>
              <ScrollView>
                {slots.length == 0 ? (
                  <View style={styles.timeSlotsNotCreated}>
                    <Text style={styles.timeSlotsNotCreatedText}>
                      No time slots created yet..
                    </Text>
                  </View>
                ) : (
                  slots.length > 0 && (
                    <View style={styles.slotList}>
                      {slots
                        .sort((a, b) => {
                          const parseTime = timeStr =>
                            new Date(`1970-01-01T${convertTo24Hour(timeStr)}`);

                          return (
                            parseTime(a.startTime) - parseTime(b.startTime)
                          );
                        })
                        .map((slot, index) => (
                          <View key={index} style={styles.slotItem}>
                            <View>
                              <Text style={styles.slotText}>
                                Time - {slot.startTime}
                              </Text>
                              <Text
                                style={styles.slotText}
                                numberOfLines={2}
                                ellipsizeMode="tail">
                                Location - {slot.location}
                              </Text>
                              <Text
                                style={styles.slotText}
                                numberOfLines={2}
                                ellipsizeMode="tail">
                                Message - {slot.message}
                              </Text>
                            </View>
                            {/* <TouchableOpacity style={styles.removeSlotButton}>
                            <Text style={styles.removeSlotButtonText}>X</Text>
                          </TouchableOpacity> */}
                          </View>
                        ))}
                    </View>
                  )
                )}
              </ScrollView>

              <View style={styles.scheduleModalOptions}>
                <TouchableOpacity
                  style={styles.cancelScheduleButton}
                  onPress={closeScheduleModal}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSchedule}>
                  <Text style={styles.submitButtonText}>
                    {loading ? 'Saving...' : 'Save Schedule'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default DashboardScreen;

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
  dateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F5',
  },
  slotRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8FC',
  },
  slotTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#635BFF',
    width: 110,
    marginRight: 10,
  },
  slotDetails: {
    flex: 1,
  },
  slotMessage: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 4,
  },
  slotLocation: {
    fontSize: 14,
    color: '#888888',
    fontWeight: '400',
  },
  moreLessText: {
    color: '#635BFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'left',
    marginTop: 6,
    // marginBottom: 10,
    paddingVertical: 6,
  },

  scheduleCard: {
    backgroundColor: '#e7f3ff',
    padding: 15,
    borderRadius: 12,
    marginVertical: 8,
    borderLeftWidth: 5,
    borderLeftColor: '#007bff',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    color: 'red',
  },

  modalContactsContainer: {
    flex: 1,
    backgroundColor: '#F9FAFC',
  },

  modalContactsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 24,
    backgroundColor: 'white',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderBottomColor: '#F0F0F5',
    borderBottomWidth: 1,
  },

  modalContactsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#20232A',
  },

  closeButton: {
    color: '#635BFF',
    fontSize: 16,
    fontWeight: '600',
  },

  modalContactsLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7FF',
  },

  modalContactsListContainer: {
    flex: 1,
    backgroundColor: '#F7F7FF',
    paddingHorizontal: 12,
    paddingTop: 8,
  },

  modalContactsItem: {
    padding: 16,
    backgroundColor: 'white',
    marginVertical: 4,
    borderRadius: 12,
    // elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },

  modalContactsSelectedItem: {
    backgroundColor: '#F5F2FF',
    borderLeftWidth: 3,
    borderLeftColor: '#635BFF',
    elevation: 1,
    shadowColor: '#635BFF',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },

  modalContactsName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#20232A',
    letterSpacing: 0.2,
  },

  modalContactsPhone: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 6,
    letterSpacing: 0.3,
  },

  modalContactsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 20,
    backgroundColor: 'white',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -3},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderTopColor: '#F0F0F5',
    borderTopWidth: 1,
  },

  modalContactsSelectionCount: {
    fontSize: 15,
    color: '#4B5563',
    fontWeight: '500',
  },

  modalContactsActionButton: {
    backgroundColor: '#635BFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    elevation: 1,
    shadowColor: '#635BFF',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },

  modalContactsActionButtonDisabled: {
    backgroundColor: 'rgba(99, 91, 255, 0.4)',
    elevation: 0,
    shadowOpacity: 0,
  },

  modalContactsActionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  sentText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'green',
    textAlign: 'left',
    marginTop: 10,
  },

  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 2,
  },
  headerLogo: {
    width: '60%',
    height: '4%',
    marginLeft: 7,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingRight: 15,
    marginVertical: 8,
  },
  title: {
    marginTop: 2,
    fontSize: 20,
    paddingLeft: 10,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Roboto-BoldItalic',
  },

  buttonContactContainer: {
    width: '90%',
    height: '10%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // paddingLeft: 20,
    marginHorizontal: 15,
    marginRight: 10,
  },
  cancelContactButton: {
    flex: 1,
    paddingVertical: 12,
    // marginLeft: 8,
    backgroundColor: '#635BFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelContactButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  flatList: {
    backgroundColor: '#F7F8FF',
  },
  noVisitsText: {
    flex: 1,
    fontSize: 20,
    marginTop: 275,
    alignSelf: 'center',
    fontFamily: 'serif',
  },
  headerButton: {
    paddingVertical: 3,
    paddingHorizontal: 2,
    borderRadius: 8,
    marginLeft: 8,
    borderWidth: 2,
  },
  workerButton: {
    borderColor: '#5151F0',
    marginVertical: 10,
  },
  visitButton: {
    borderColor: '#4CAF50',
    marginVertical: 10,
  },
  createButtonText: {
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  modalContainer: {
    backgroundColor: '#f0f0f4',
    borderRadius: 12,
    width: '80%',
    paddingHorizontal: 30,
    paddingVertical: 20,
    elevation: 10,
  },
  menuModalContainer: {
    flex: 1,
    backgroundColor: ' #E6F2F2',
    alignItems: 'flex-end',
    paddingTop: 50,
    paddingRight: 5,
  },
  menuModalContent: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    width: 200,
    alignItems: 'center',
    elevation: 5, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  popupButton: {
    backgroundColor: '#f0f0f4',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  popupButtonText: {
    fontSize: 14,
    color: ' #2D8A8A ',
    fontWeight: '600',
  },

  logoutButton: {
    backgroundColor: '#FFEBEB', // Light red
    borderWidth: 1,
    borderColor: '#FFD1D1',
  },

  workerMenuButton: {
    backgroundColor: '#FFF8E6', // Light yellow
    borderWidth: 1,
    borderColor: '#FFE8B3',
  },
  workerListButton: {
    backgroundColor: '#EFEDFF',
    borderWidth: 1,
    borderColor: '#D6D1FF',
  },
  createVisitMenuButton: {
    backgroundColor: '#E6F2F2', // Light green
    borderWidth: 1,
    borderColor: '#C5E8E8',
  },
  createScheduleMenuButton: {
    backgroundColor: '#E6EBF2', // soft blue-grey
    borderWidth: 1,
    borderColor: '#C5E8E8',
  },
  logoutButtonText: {
    color: '#C53030', // Light red
    fontWeight: '800',
  },

  workerMenuButtonText: {
    color: '  #946800', // Light yellow
    fontWeight: '800',
  },
  workersListButtonText: {
    color: ' #635BFF',
    fontWeight: '800',
  },
  createVisitMenuButtonText: {
    color: ' #2D8A8A', // Light green
    fontWeight: '800',
  },
  createScheduleMenuButtonText: {
    color: ' #2D8A8A', // Light green
    fontWeight: '800',
  },

  workerListModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7FF',
  },
  workerListModalContent: {
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 10,
    // borderRadius: 10,
    alignItems: 'flex-start',
  },
  workerListModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between', // This spreads items to opposite ends
    alignItems: 'center',
    width: '100%', // Ensure header takes full width
    marginBottom: 8,
    // marginTop: 5,
    paddingRight: 8, // Add some padding on the right
  },
  workerListModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#635BFF',
    alignSelf: 'center',
  },
  workerListCard: {
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 10,
    borderRadius: 8,
    width: '2000',
    // elevation: 2,
    borderLeftWidth: 3,
    borderLeftColor: '#635BFF',
  },
  workerListName: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  workerListPhoneNum: {
    fontSize: 12,
    color: '#555',
  },
  workerListCloseButton: {
    // marginTop: 1,
    paddingVertical: 2,
    paddingHorizontal: 10,
    alignSelf: 'flex-end',
    // borderWidth: 1,
    // borderColor: '#635BFF',
    // backgroundColor: '#635BFF',
    borderRadius: 5,
    marginBottom: 12,
  },
  workerListCloseButtonText: {
    color: COLORS.primary,
    fontSize: 16,
  },
  workerListModalSearch: {
    borderWidth: 1,
    width: '430',
    borderRadius: 20,
    marginBottom: 15,
    borderColor: '#635BFF',
    paddingHorizontal: 10,
    color: '#555',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  datePickerButton: {color: 'red'},
  dateTimeInputContainer: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: 'grey',
    borderRadius: 5,
    padding: 12,
    marginBottom: 12,
    // flexDirection: 'row',
  },

  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: 'grey',
    borderRadius: 5,
    padding: 12,
    marginBottom: 12,
    maxHeight: 200,
  },
  inputMessage: {
    width: '60%',
    maxHeight: 'auto',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  modalButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 8,
    borderWidth: 2,
  },
  cancelButton: {
    borderColor: 'red',
  },
  createButton: {
    borderColor: '#008000',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: 'red',
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#008000',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 18,
    marginVertical: 6,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 1,
    borderLeftWidth: 4,
    borderLeftColor: '#635BFF',
    position: 'relative',
  },
  cardTitle: {fontSize: 16, fontWeight: '800', color: '#333'},
  cardSubtitle: {
    fontSize: 15,
    color: '#2D3748',
    marginVertical: 2,
    fontWeight: '600',
  },
  cardMessage: {fontSize: 14, color: '#6B7280', marginBottom: 10, width: '80%'},
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  deleteButton: {
    backgroundColor: '#F56565',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  sendButton: {
    backgroundColor: '#5151F0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginHorizontal: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  tabHeaders: {
    color: '#635BFF',
  },
  modalOverlaym: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainerm: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitlem: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  dateTimeInputContainerm: {
    marginBottom: 15,
  },
  datePickerButtonm: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  dateTimeTextm: {
    fontSize: 16,
    color: '#333',
  },
  inputm: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  messageInputm: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtonsm: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButtonm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonm: {
    backgroundColor: '#f2f2f2',
    marginRight: 10,
  },
  createButtonm: {
    backgroundColor: '#635BFF',
    marginLeft: 10,
  },
  disabledButtonm: {
    backgroundColor: '#a0c2e8',
  },
  cancelButtonTextm: {
    color: '#666',
    fontWeight: '600',
  },
  createButtonTextm: {
    color: 'white',
    fontWeight: '600',
  },
  workerCard: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  phoneNum: {
    fontSize: 14,
    color: '#555',
  },
  scheduleModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleModalContainer: {
    flex: 1,
    backgroundColor: '#F7F7FF',
    // borderRadius: 15,
    padding: 24,
    width: '100%',
    height: '100%',
  },
  heading: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  scheduleDateTimeInputContainer: {},
  scheduleDateTimeInput: {
    height: 56,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 16,
    paddingTop: 14,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#555',
    backgroundColor: '#FFFFFF',
  },
  subHeading: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginTop: 8,
    marginBottom: 8,
  },
  scheduleInput: {
    height: 56,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#F7F7FF',
    paddingVertical: 8,
    borderRadius: 8,
    // marginTop: 8,
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  addButtonText: {
    color: '#635BFF',
    backgroundColor: '#F7F7FF',
    fontSize: 16,
    fontWeight: '500',
  },
  timeSlotsNotCreated: {},
  timeSlotsNotCreatedText: {
    fontFamily: 'serif',
    fontStyle: 'italic',
    alignSelf: 'center',
    paddingTop: 110,
    fontSize: 16,
  },
  slotList: {
    marginBottom: 16,
  },
  slotItem: {
    backgroundColor: '#F7F7FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
  },
  slotText: {
    fontSize: 14,
    color: '#333',
    flexWrap: true,
  },
  // removeSlotButton: {
  //   justifyContent: 'center',
  // },
  // removeSlotButtonText: {
  //   justifyContent: 'center',
  //   marginLeft: 180,
  // },
  scheduleModalOptions: {
    flexDirection: 'row',
    alignContent: 'space-between',
    justifyContent: 'space-between',
  },
  submitButton: {
    backgroundColor: '#635BFF',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    // marginTop: 8,
    width: '46%',
    alignSelf: 'flex-end',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  cancelScheduleButton: {
    backgroundColor: '#E0E0E0',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    // marginTop: 8,
    width: '46%',
    alignSelf: 'flex-start',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
});
