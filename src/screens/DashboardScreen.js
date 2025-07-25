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
  BackHandler,
} from 'react-native';
import {sendSchedule, sendScheduleWhatsApp} from '../redux/scheduleSlice';
import {deleteSchedule} from '../redux/scheduleSlice';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {NavigationContainer} from '@react-navigation/native';
import Contacts from 'react-native-contacts';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment-timezone';
import api from '../api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, CommonActions, useFocusEffect} from '@react-navigation/native';
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
import Ionicons from 'react-native-vector-icons/Ionicons';

const LoadingOverlay = () => (
  <View
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
    <ActivityIndicator size="large" color={COLORS.primary} />
  </View>
);

const CustomAlertModal = ({visible, title, message, onClose, actions = []}) => {
  const isSuccessSingleAction = title === 'Success' && actions.length === 1;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.25)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <View
          style={{
            backgroundColor: '#fff',
            width: '90%',
            borderRadius: 18,
            paddingVertical: 28,
            paddingHorizontal: 14,
            minWidth: 300,
            maxWidth: 340,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 6},
            shadowOpacity: 0.15,
            shadowRadius: 18,
            elevation: 8,
          }}>
          <Text
            style={{
              fontSize: 21,
              fontWeight: 'bold',
              color: '#222',
              marginBottom: 12,
              textAlign: 'center',
              letterSpacing: 0.2,
            }}>
            {title}
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#444',
              marginBottom: 28,
              textAlign: 'center',
              lineHeight: 22,
            }}>
            {message}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: isSuccessSingleAction ? 'center' : 'center',
              alignItems: 'center',
              width: '100%',
            }}>
            {actions.length > 0 ? (
              actions.map((action, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={{
                    flex: isSuccessSingleAction ? 0 : 1,
                    backgroundColor:
                      action.style === 'destructive'
                        ? '#F56565'
                        : action.style === 'cancel'
                        ? '#E0E3EB'
                        : '#635BFF',
                    paddingVertical: 13,
                    borderRadius: 10,
                    marginHorizontal: isSuccessSingleAction
                      ? 0
                      : idx === 0 && actions.length === 2
                      ? 6
                      : 0,
                    marginLeft: isSuccessSingleAction ? 0 : idx > 0 ? 8 : 0,
                    marginRight: isSuccessSingleAction
                      ? 0
                      : idx < actions.length - 1
                      ? 8
                      : 0,
                    alignItems: 'center',
                    minWidth: isSuccessSingleAction ? 110 : 120,
                    maxWidth: isSuccessSingleAction ? 180 : undefined,
                    width: isSuccessSingleAction ? '60%' : undefined,
                    shadowColor: '#000',
                    shadowOffset: {width: 0, height: 2},
                    shadowOpacity: 0.06,
                    shadowRadius: 2,
                  }}
                  onPress={action.onPress}
                  activeOpacity={0.85}>
                  <Text
                    style={{
                      color:
                        action.style === 'destructive'
                          ? '#fff'
                          : action.style === 'cancel'
                          ? '#333'
                          : '#fff',
                      fontWeight: 'bold',
                      fontSize: 16,
                      letterSpacing: 0.2,
                    }}>
                    {action.text}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <TouchableOpacity
                style={{
                  backgroundColor: '#635BFF',
                  paddingVertical: 13,
                  borderRadius: 10,
                  minWidth: 110,
                  maxWidth: 180,
                  width: '60%',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: {width: 0, height: 2},
                  shadowOpacity: 0.06,
                  shadowRadius: 2,
                }}
                onPress={onClose}
                activeOpacity={0.85}>
                <Text
                  style={{
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: 16,
                    letterSpacing: 0.2,
                  }}>
                  OK
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

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
  const [expandedSlotIndex, setExpandedSlotIndex] = useState(null);
  const [alertModal, setAlertModal] = useState({
    visible: false,
    title: '',
    message: '',
    actions: [],
  });
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
          showAlertModal('Session expired', 'Please log in again.', [
            {
              text: 'OK',
              onPress: () => {
                closeAlertModal();
                navigation.replace('Login');
              },
            },
          ]);
          return;
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        navigation.replace('Login');
      }
    };
    checkAuth();
    dispatch(fetchAllSchedules());
  }, []);

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

      showAlertModal('Logout Complete', 'You have been signed out.', [
        {
          text: 'OK',
          onPress: () => {
            closeAlertModal();
            navigation.navigate('Launch');
          },
        },
      ]);
    }
  };

  const confirmLogout = () => {
    showAlertModal('Confirm Logout', 'Are you sure you want to log out?', [
      {text: 'Cancel', style: 'cancel', onPress: closeAlertModal},
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          closeAlertModal();
          handleLogout();
        },
      },
    ]);
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(false);

    if (dateTimeMode === 'date') {
      setDate(currentDate);
      setDateTimeMode('time');
      setShowDatePicker(true);
    } else {
      setDate(currentDate);
      setDateTimeText(moment(currentDate).format('YYYY-MM-DD HH:mm'));
      setDateTimeMode('date');
    }
  };

  const addVisit = async () => {
    if (!dateTimeText || !location || !message) {
      showAlertModal('Error', 'All fields are required.');
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
        showAlertModal('Error', 'User not logged in. Please log in again.', [
          {
            text: 'OK',
            onPress: () => {
              closeAlertModal();
              navigation.dispatch(
                CommonActions.reset({index: 0, routes: [{name: 'Launch'}]}),
              );
            },
          },
        ]);
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

        // If it doesn't exist, fall back to creating a new object from visitData.
        let newVisit = resultAction.payload?.newVisit
          ? {...resultAction.payload.newVisit} // mutable copy
          : {
              ...visitData,
              id: Date.now().toString(),
            };

        if (
          typeof newVisit.dateTime === 'object' &&
          newVisit.dateTime !== null
        ) {
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

        setModalVisible(false);
        setMenuModalVisible(false);
        setDateTimeText('Select Date & Time');
        setLocation('');
        setMessage('');

        showAlertModal('Success', 'Visit created successfully!');
      } else {
        showAlertModal(
          'Error',
          resultAction.payload || 'Failed to create visit',
        );
      }
    } catch (error) {
      console.error('Visit Creation Error:', error?.message || error);
      showAlertModal(
        'Visit Creation Failed',
        'Something went wrong. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteVisit = async visitId => {
    showAlertModal(
      'Confirm Deletion',
      'Are you sure you want to delete this visit?',
      [
        {text: 'Cancel', style: 'cancel', onPress: closeAlertModal},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            closeAlertModal();
            handleDeleteVisit(visitId);
          },
        },
      ],
    );
  };

  const handleDeleteVisit = async visitId => {
    // setLoading(true);
    try {
      const resultAction = dispatch(deleteVisitThunk(visitId));
      console.log('resultAction:', resultAction);

      const updatedVisits = visitList.filter(visit => visit.id !== visitId);
      console.log('updatedVisits:', updatedVisits);

      setVisitList(updatedVisits);
      await AsyncStorage.setItem(
        'upcomingVisits',
        JSON.stringify(updatedVisits),
      );

      showAlertModal('Success', 'Visit deleted successfully.');
    } catch (error) {
      console.error('Visit deletion failed', error?.message || error);
      showAlertModal(
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

  const sendVisit = async visit => {
    showAlertModal(
      'Confirm to send the message',
      'Are you sure you want to send this message?',
      [
        {text: 'Cancel', style: 'cancel', onPress: closeAlertModal},
        {
          text: 'Send',
          onPress: async () => {
            try {
              const resultAction = await dispatch(
                sendVisitThunk({
                     visitId: visit.id, 
                  message: visit.message,
                  dateTime: visit.dateTime,
                  location: visit.location,

                }),
              );
              if (sendVisitThunk.fulfilled.match(resultAction)) {
                // Remove setVisitList, rely on Redux state for UI update
                showAlertModal('Success', 'Visit details sent successfully!');
              } else {
                throw new Error(
                  resultAction.payload || 'Failed to send visit details.',
                );
              }
            } catch (error) {
              showAlertModal(
                'Error',
                error.message || 'Failed to send visit details.',
              );
            }
          },
          style: 'default',
        },
      ],
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
        showAlertModal('Permission Denied', 'Cannot access contacts.');
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
      showAlertModal('Error', 'Failed to load contacts.');
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
      showAlertModal('No Selection', 'Please select at least one contact.');
      return;
    }
    const addText =
      selectedContacts.length === 1
        ? 'Add 1 worker'
        : `Add ${selectedContacts.length} workers?`;
    showAlertModal('Confirm', addText, [
      {text: 'Cancel', style: 'cancel', onPress: closeAlertModal},
      {
        text: selectedContacts.length === 1 ? 'Add Worker' : `Add Workers`,
        onPress: () => {
          closeAlertModal();
          handleAddWorkers();
        },
      },
    ]);
  };

  const handleAddWorkers = async () => {
    if (selectedContacts.length === 0) {
      showAlertModal('Error', 'Please select at least one contact.');
      return;
    }
    const existingPhoneNumbers = new Set(
      (workers || []).map(w => w.phoneNumber),
    );
    const newContacts = selectedContacts.filter(
      contact =>
        !existingPhoneNumbers.has(contact.phoneNumber.replace(/[^0-9]/g, '')),
    );

    if (newContacts.length === 0) {
      showAlertModal('Info', 'All selected workers are already added.');
      return;
    }

    setLoading(true);

    try {
      console.log('Selected Contacts:', selectedContacts);

      const workersData = newContacts.map(contact => ({
        name: contact.name,
        phoneNumber: contact.phoneNumber.replace(/[^0-9]/g, ''),
      }));

      const response = await api.post('/workers/add', {
        workersData: workersData,
      });

      console.log('API Response:', response.data);

      if (response.data && response.data.addedWorkers > 0) {
        const addedCount = response.data.addedWorkers;
        showAlertModal(
          'Success',
          `${addedCount} worker${addedCount === 1 ? '' : 's'} added!`,
          [
            {
              text: 'OK',
              onPress: () => {
                closeAlertModal();
                setMenuModalVisible(false);
                setSelectedContacts([]);
                setModalContactVisible(false);
              },
            },
          ],
        );
      } else {
        showAlertModal('Info', 'No new workers were added.');
      }
    } catch (error) {
      console.error(
        'Add Workers Error:',
        error.response?.data || error.message,
      );

      showAlertModal(
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
      showAlertModal('No Selection', 'Please select at least one contact.');
      return;
    }

    showAlertModal('Confirm', `Removed ${selectedContacts.length} workers?`, [
      {text: 'Cancel', style: 'cancel', onPress: closeAlertModal},
      {
        text: 'Removed',
        onPress: () => {
          closeAlertModal();
          handleRemovedWorkers();
        },
      },
    ]);

    setWorkersModalVisible(false);
    setMenuModalVisible(false);
  };

  const handleRemovedWorkers = async () => {
    if (selectedContacts.length === 0) {
      showAlertModal('Error', 'Please select at least one contact.');
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
        showAlertModal(
          'Success',
          `${selectedContacts.length} workers removed!`,
          [
            {
              text: 'OK',
              onPress: () => {
                closeAlertModal();
                setSelectedContacts([]);
                setWorkersModalVisible(false);
              },
            },
          ],
        );
      } else {
        throw new Error(response.data?.message || 'Failed to add workers');
      }
    } catch (error) {
      console.error(
        'Add Workers Error:',
        error.response?.data || error.message,
      );

      showAlertModal(
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

  const openScheduleModal = () => {
    setScheduleModalVisible(true);
    setDate(new Date());
    setLocation('');
    setStartTime('');
    setMessage('');
    setMenuModalVisible(false);
  };

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
      showAlertModal('Oops!', 'Please fill all fields to add a time slot.');
      return;
    }

    const newSlot = {
      startTime: formatTime(startTime),
      location,
      message,
    };

    setSlots(prevSlots => [...prevSlots, newSlot]);

    // Reset
    setStartTime(null);
    setLocation('');
    setMessage('');
  };

  const handleSchedule = async () => {
    if (!scheduleDate || slots.length === 0) {
      showAlertModal(
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
        showAlertModal('Success', 'Schedule saved successfully!');
        setScheduleDate(null);
        setSlots([]);
        closeScheduleModal();
      })
      .catch(error => {
        console.error('Schedule error:', error);
        showAlertModal('Error', error?.message || 'Something went wrong.');
      });
  };

  const handleScheduleDelete = async scheduleId => {
    try {
      console.log('scheduleId:', scheduleId);
      const resultAction = dispatch(deleteSchedule(scheduleId));
      console.log('resultAction:', resultAction);

      // const updatedSchedules = schedules.filter(
      //   schedule => schedule.id !== scheduleId,
      // );

      // setSchedules(updatedSchedules);
      // await AsyncStorage.setItem('schedules', JSON.stringify(updatedSchedules));
      showAlertModal('Success', 'Schedule deleted successfully.');
    } catch (error) {
      console.error('Schedule deletion failed', error?.message || error);
      showAlertModal(
        'Schedule Deletion Failed',
        'Something went wrong. Please try again.',
      );
    }
  };

  const handleScheduleSend = schedule => {
   
    dispatch(
      sendScheduleWhatsApp({
        scheduleId: schedule.id,
        date: schedule.date,
        slots: schedule.slots, 
      }),
    )
      .unwrap()
      .then(() => {
      
        showAlertModal('Success', 'Schedule sent via WhatsApp!');
      })
      .catch(error => {
       
        showAlertModal('Error', error?.message || 'Failed to send schedule.');
      });
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
              <Text
                style={styles.slotMessage}
                numberOfLines={3}
                ellipsizeMode="tail">
                {slot.message}
              </Text>
              {slot.location ? (
                <Text style={styles.slotLocation}>{slot.location}</Text>
              ) : null}
            </View>
          </View>
        ))}
        {slots.length > 4 && (
          <TouchableOpacity onPress={() => setExpanded(!expanded)}>
            <Text style={styles.moreLessText}>
              {expanded ? 'View less' : '...View More'}
            </Text>
          </TouchableOpacity>
        )}

        {schedule.isSent ? (
          <Text style={styles.sentText}>Message already sent!</Text>
        ) : (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => {
                showAlertModal(
                  'Delete Schedule',
                  'Are you sure you want to delete this schedule?',
                  [
                    {text: 'Cancel', style: 'cancel', onPress: closeAlertModal},
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => {
                        closeAlertModal();
                        handleScheduleDelete(schedule.id);
                      },
                    },
                  ],
                );
              }}>
              <Text style={styles.buttonText}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sendButton}
              onPress={() => {
                console.log('Send Schedule Button Pressed. Payload:', {
                  id: schedule.id,
                  date: schedule.date,
                  slots: schedule.slots,
                  messages: schedule.slots.map(slot => slot.message),
                  isSent: schedule.isSent,
                });
                showAlertModal(
                  'Send Schedule',
                  'Are you sure you want to send this schedule via WhatsApp?',
                  [
                    {text: 'Cancel', style: 'cancel', onPress: closeAlertModal},
                    {
                      text: 'Send',
                      onPress: () => {
                        closeAlertModal();
                        handleScheduleSend(schedule);
                        setTimeout(() => {
                          const updated = schedules.find(s => s.id === schedule.id);
                          console.log('After send, schedule.isSent:', updated?.isSent, updated);
                        }, 1500);
                      },
                    },
                  ],
                );
              }}>
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
        showsVerticalScrollIndicator={false}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <View
            style={[
              styles.emptyStateContainer,
              {
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
              },
            ]}>
            <Ionicons
              name="people-outline"
              size={32}
              color="#A0AEC0"
              style={{marginRight: 8}}
            />
            <Text style={styles.emptyStateText}>No visits created yet..</Text>
          </View>
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
                  onPress={() => {
                    console.log('Send Visit Button Pressed. Payload:', {
                      id: item.id,
                      dateTime: item.dateTime,
                      location: item.location,
                      message: item.message,
                      isSent: item.isSent,
                    });
                    sendVisit(item);
                    setTimeout(() => {
                      const updated = visitsFetched.find(v => v.id === item.id);
                      console.log('After send, visit.isSent:', updated?.isSent, updated);
                    }, 1500);
                  }}>
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
        showsVerticalScrollIndicator={false}
        keyExtractor={(item, index) => `${item.date}-${index}`}
        ListEmptyComponent={
          <View
            style={[
              styles.emptyStateContainer,
              {
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
              },
            ]}>
            <Ionicons
              name="calendar-outline"
              size={32}
              color="#A0AEC0"
              style={{marginRight: 8}}
            />
            <Text style={styles.emptyStateText}>
              No schedules created yet..
            </Text>
          </View>
        }
        renderItem={({item}) => (
          <ScheduleCard
            schedule={item}
            handleScheduleSend={() => handleScheduleSend(item)}
            handleScheduleDelete={handleScheduleDelete}
          />
        )}
      />
    );
  };

  const showAlertModal = (title, message, actions) => {
    setAlertModal({visible: true, title, message, actions: actions || []});
  };

  const closeAlertModal = () => setAlertModal({...alertModal, visible: false});

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <Image
          source={require('../assets/header.png')}
          style={styles.headerLogo}></Image>

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
            tabBarLabelStyle: {fontSize: 18, fontWeight: 'bold'},
            tabBarIndicatorStyle: {
              backgroundColor: COLORS.primary,
              height: 3,
              width: '50%',
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
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{
                  width: '100%',
                  alignItems: 'center',
                  flex: 1,
                  justifyContent: 'center',
                }}
                keyboardVerticalOffset={60}>
                <View style={styles.modalContainerm}>
                  <ScrollView
                    contentContainerStyle={{paddingBottom: 10}}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}>
                    <Text style={styles.modalTitlem}>Create Visit</Text>

                    <View
                      style={[
                        styles.dateTimeInputContainerm,
                        {
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginBottom: 10,
                        },
                      ]}>
                      <Ionicons
                        name="calendar-outline"
                        size={25}
                        color={COLORS.primaryDark}
                        style={{
                          marginRight: 8,
                          marginBottom: 12,
                          alignSelf: 'center',
                        }}
                      />
                      <TouchableOpacity
                        onPress={showMode}
                        style={styles.datePickerButtonm}>
                        <Text style={styles.dateTimeTextm}>{dateTimeText}</Text>
                      </TouchableOpacity>
                    </View>

                    {showDatePicker && (
                      <DateTimePicker
                        value={
                          date instanceof Date && !isNaN(date)
                            ? date
                            : new Date()
                        }
                        mode={dateTimeMode}
                        is24Hour={false}
                        display="default"
                        onChange={handleDateChange}
                        minimumDate={new Date()}
                      />
                    )}
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <Ionicons
                        name="location-outline"
                        size={26}
                        color={COLORS.primaryDark}
                        style={{
                          marginRight: 8,
                          marginBottom: 12,
                          alignSelf: 'center',
                        }}
                      />
                      <TextInput
                        placeholder="Location"
                        placeholderTextColor="grey"
                        value={location}
                        onChangeText={setLocation}
                        style={styles.inputm}
                      />
                    </View>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <Ionicons
                        name="chatbubble-ellipses-outline"
                        size={24}
                        color={COLORS.primaryDark}
                        style={{
                          marginRight: 8,
                          marginBottom: 12,
                          alignSelf: 'center',
                        }}
                      />
                      <TextInput
                        placeholder="Message"
                        placeholderTextColor="grey"
                        value={message}
                        onChangeText={setMessage}
                        multiline={true}
                        returnKeyType="default"
                        style={[styles.inputm, styles.messageInputm]}
                      />
                    </View>

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
                  </ScrollView>
                </View>
              </KeyboardAvoidingView>
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
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 10,
                paddingBottom: 22,
                paddingTop: 12,
                paddingHorizontal: 20,
                backgroundColor: '#fff',
                borderTopLeftRadius: 18,
                borderTopRightRadius: 18,
                position: 'relative',
              }}>
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  left: 8,
                  top: 10,
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  // backgroundColor: '#F0F1F5',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: {width: 0, height: 1},
                  shadowOpacity: 0.08,
                  shadowRadius: 2,
                  zIndex: 2,
                }}
                onPress={closeContactsModal}
                hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
                activeOpacity={0.7}>
                <Ionicons name="arrow-back" size={28} color={COLORS.primary} />
              </TouchableOpacity>

              <Text
                style={{
                  fontSize: 23,
                  fontWeight: 'bold',
                  color: COLORS.primary,
                  flex: 1,
                  textAlign: 'center',
                  letterSpacing: 0.2,
                }}>
                Select Workers
              </Text>
            </View>
            <View
              style={{
                height: 1,
                backgroundColor: '#E0E3EB',
                marginHorizontal: 16,
                marginBottom: 8,
              }}
            />
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
                <TouchableOpacity
                  style={{
                    position: 'absolute',
                    left: 2,
                    top: 1,
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    // backgroundColor: '#F0F1F5',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#000',
                    shadowOffset: {width: 0, height: 1},
                    shadowOpacity: 0.08,
                    shadowRadius: 2,
                    zIndex: 2,
                  }}
                  onPress={closeWorkersModal}
                  hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
                  activeOpacity={0.7}>
                  <Ionicons
                    name="arrow-back"
                    size={28}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
                <Text style={styles.workerListModalTitle}>Workers List</Text>
              </View>
              <View style={{paddingBottom: 8, backgroundColor: '#fff'}}>
                <View style={{position: 'relative', justifyContent: 'center'}}>
                  <Ionicons
                    name="search"
                    size={20}
                    color="#A0AEC0"
                    style={{
                      position: 'absolute',
                      left: 16,
                      top: '50%',
                      zIndex: 2,
                      marginTop: -16,
                    }}
                  />
                  <TextInput
                    placeholder="Search Workers..."
                    placeholderTextColor="#555"
                    value={searchText}
                    onChangeText={text => dispatch(setSearchText(text))}
                    style={{
                      ...styles.workerListModalSearch,
                      paddingLeft: 40,
                    }}
                    returnKeyType="search"
                    clearButtonMode="while-editing"
                  />
                </View>
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
              <ScrollView
                contentContainerStyle={{paddingBottom: 120}}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}>
                <Text style={styles.heading}>Create a Schedule</Text>

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 18,
                  }}>
                  <Ionicons
                    name="calendar-outline"
                    size={25}
                    color={COLORS.primary}
                    style={{
                      marginRight: 8,
                      marginBottom: 12,
                      alignSelf: 'center',
                    }}
                  />
                  <TouchableOpacity
                    disabled={slots.length > 0}
                    style={[
                      styles.scheduleDateTimeInput,
                      {
                        flex: 1,
                        borderRadius: 12,
                        paddingVertical: 16,
                        backgroundColor: '#F6F8FB',
                        borderColor: '#C7D3E3',
                        borderWidth: 1.2,
                        paddingHorizontal: 18,
                        fontSize: 17,
                        color: '#222',
                      },
                    ]}
                    onPress={() => setShowDatePicker(true)}>
                    <Text
                      style={{
                        fontSize: 17,
                        color: scheduleDate ? '#222' : '#999',
                      }}>
                      {scheduleDate
                        ? `Date: ${formatDate(scheduleDate)}`
                        : 'Enter Date'}
                    </Text>
                  </TouchableOpacity>
                </View>
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
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}>
                  <Ionicons
                    name="time-outline"
                    size={25}
                    color={COLORS.primary}
                    style={{
                      marginRight: 8,
                      marginBottom: 12,
                      alignSelf: 'center',
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowTimePicker(true)}
                    style={[
                      styles.scheduleDateTimeInput,
                      {
                        flex: 1,
                        borderRadius: 12,
                        paddingVertical: 16,
                        backgroundColor: '#F6F8FB',
                        borderColor: '#C7D3E3',
                        borderWidth: 1.2,
                        paddingHorizontal: 18,
                        fontSize: 17,
                        color: '#222',
                      },
                    ]}>
                    <Text
                      style={{
                        fontSize: 17,
                        color: startTime ? '#222' : '#999',
                      }}>
                      {startTime
                        ? `${formatTime(startTime)}`
                        : 'Enter Start Time'}
                    </Text>
                  </TouchableOpacity>
                </View>
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
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}>
                  <Ionicons
                    name="location-outline"
                    size={25}
                    color={COLORS.primary}
                    style={{
                      marginRight: 8,
                      marginBottom: 12,
                      alignSelf: 'center',
                    }}
                  />
                  <TextInput
                    style={[
                      styles.scheduleInput,
                      {
                        flex: 1,
                        backgroundColor: '#F6F8FB',
                        borderColor: '#C7D3E3',
                        borderWidth: 1.2,
                        borderRadius: 12,
                        paddingVertical: 16,
                        paddingHorizontal: 18,
                        fontSize: 17,
                        color: '#222',
                      },
                    ]}
                    placeholder="Location"
                    placeholderTextColor={'#999'}
                    value={location}
                    onChangeText={setLocation}
                  />
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 18,
                  }}>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={25}
                    color={COLORS.primary}
                    style={{marginRight: 8, alignSelf: 'center'}}
                  />
                  <TextInput
                    style={[
                      styles.scheduleInput,
                      {
                        flex: 1,
                        backgroundColor: '#F6F8FB',
                        borderColor: '#C7D3E3',
                        borderWidth: 1.2,
                        borderRadius: 12,
                        paddingVertical: 16,
                        paddingHorizontal: 18,
                        fontSize: 17,
                        color: '#222',
                        minHeight: 48,
                      },
                    ]}
                    placeholder="Message"
                    placeholderTextColor={'#999'}
                    value={message}
                    onChangeText={setMessage}
                    multiline
                  />
                </View>

                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    alignSelf: 'flex-end',
                    backgroundColor: COLORS.primary,
                    borderRadius: 10,
                    paddingVertical: 10,
                    paddingHorizontal: 15,
                    marginBottom: 18,
                  }}
                  onPress={handleAddSlot}>
                  <Ionicons
                    name="add"
                    size={20}
                    fontWeight="bold"
                    color="#fff"
                    style={{marginRight: 8}}
                  />
                  <Text
                    style={{color: '#fff', fontWeight: 'bold', fontSize: 15}}>
                    Add Slot
                  </Text>
                </TouchableOpacity>

                {slots.length === 0 ? (
                  <View style={styles.timeSlotsNotCreated}>
                    <Text style={styles.timeSlotsNotCreatedText}>
                      You haven't added any slots yet.
                    </Text>
                  </View>
                ) : (
                  <View style={{gap: 10, marginBottom: 18}}>
                    {slots
                      .sort((a, b) => {
                        const parseTime = timeStr =>
                          new Date(`1970-01-01T${convertTo24Hour(timeStr)}`);
                        return parseTime(a.startTime) - parseTime(b.startTime);
                      })
                      .map((slot, index) => (
                        <View
                          key={index}
                          style={{
                            backgroundColor: '#fff',
                            borderRadius: 10,
                            borderColor: '#E0E3EB',
                            borderWidth: 1,
                            paddingVertical: 12,
                            paddingHorizontal: 14,
                            shadowColor: '#A0AEC0',
                            shadowOffset: {width: 0, height: 1},
                            shadowOpacity: 0.06,
                            shadowRadius: 2,
                            marginBottom: 2,
                          }}>
                          <Text
                            style={{
                              color: COLORS.primary,
                              fontWeight: 'bold',
                              fontSize: 16,
                              marginBottom: 2,
                            }}>
                            {slot.startTime}
                          </Text>
                          <Text
                            style={{
                              fontSize: 15,
                              color: '#333',
                              marginBottom: 1,
                            }}>
                            <Text style={{fontWeight: '600'}}>Location:</Text>{' '}
                            {slot.location}
                          </Text>
                          <Text
                            style={{fontSize: 15, color: '#555'}}
                            numberOfLines={
                              expandedSlotIndex === index ? undefined : 2
                            }
                            ellipsizeMode="tail">
                            <Text style={{fontWeight: '600'}}>Message:</Text>{' '}
                            {slot.message}
                          </Text>
                          {slot.message &&
                            slot.message.length > 60 &&
                            expandedSlotIndex !== index && (
                              <TouchableOpacity
                                onPress={() => setExpandedSlotIndex(index)}>
                                <Text
                                  style={{
                                    color: COLORS.primary,
                                    fontWeight: 'bold',
                                    fontSize: 14,
                                    marginTop: 2,
                                  }}>
                                  More
                                </Text>
                              </TouchableOpacity>
                            )}
                          {expandedSlotIndex === index && (
                            <TouchableOpacity
                              onPress={() => setExpandedSlotIndex(null)}>
                              <Text
                                style={{
                                  color: COLORS.primary,
                                  fontWeight: 'bold',
                                  fontSize: 14,
                                  marginTop: 2,
                                }}>
                                Less
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                  </View>
                )}
              </ScrollView>

              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: '#F7F7FF',
                  paddingVertical: 16,
                  paddingHorizontal: 24,
                  shadowColor: '#000',
                  shadowOffset: {width: 0, height: -2},
                  shadowOpacity: 0.06,
                  shadowRadius: 4,
                  zIndex: 10,
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}>
                  <TouchableOpacity
                    style={{
                      backgroundColor: COLORS.primaryLight,
                      borderRadius: 10,
                      paddingVertical: 12,
                      paddingHorizontal: 18,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderColor: '#E0E3EB',
                      borderWidth: 1,
                      flex: 1,
                    }}
                    onPress={closeScheduleModal}
                    activeOpacity={0.7}>
                    <Text
                      style={{
                        color: COLORS.text,
                        fontWeight: 'bold',
                        fontSize: 16,
                        letterSpacing: 0.2,
                      }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      backgroundColor: COLORS.primary,
                      paddingVertical: 12,
                      paddingHorizontal: 28,
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: COLORS.primary,
                      shadowOffset: {width: 0, height: 2},
                      shadowOpacity: 0.1,
                      shadowRadius: 3,
                      flex: 1,
                    }}
                    onPress={handleSchedule}
                    activeOpacity={0.7}>
                    <Text
                      style={{
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: 16,
                        letterSpacing: 0.2,
                      }}>
                      {loading ? 'Saving...' : 'Save Schedule'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
      {loading && <LoadingOverlay />}
      <CustomAlertModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        onClose={closeAlertModal}
        actions={alertModal.actions}
      />
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
    backgroundColor: '#F9FAFC',
    // elevation: 3,
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
    borderRadius: 12,
  },

  modalContactsItem: {
    padding: 16,
    backgroundColor: COLORS.background,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 0.1,
    // borderColor:COLORS.primaryDark,
    // elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },

  modalContactsSelectedItem: {
    backgroundColor: '#F5F2FF',
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primaryDark,
    // borderRightWidth: 5,
    // borderRightColor: '#635BFF',
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
    fontSize: 17,
    color: COLORS.primary,
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
    // justifyContent: 'center',
    // alignItems: 'center',
    backgroundColor: '#F7F7FF',
  },
  workerListModalContent: {
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 10,
    // borderRadius: 10,
    // alignItems: 'center',
  },
  workerListModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 24,
    // marginTop: 5,
  },
  workerListModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.2,
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
    borderRadius: 16,
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
    padding: 20,
    marginVertical: 10,
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
    gap: 8,
  },
  deleteButton: {
    backgroundColor: '#F56565',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 10,
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
    // marginTop: 100,
  },
  modalContainerm: {
    width: '95%',
    // minHeight: '39%',
    height: 'auto',
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  dateTimeInputContainerm: {
    marginBottom: 20,
    // width:2
  },
  datePickerButtonm: {
    width: '90%',
    padding: 12,
    marginBottom: 10,
    // borderRightWidth: 3,
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
    width: '90%',
    borderWidth: 1,
    borderColor: '#ddd',
    // borderRightWidth:3,
    // borderLeftWidth:3,
    // borderColor: COLORS.primaryDark,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  messageInputm: {
    maxHeight: 100,
    width: '90%',
    textAlignVertical: 'top',
  },
  modalButtonsm: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  modalButtonm: {
    width: '48%',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 0.1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonm: {
    backgroundColor: '#f2f2f2',
    marginRight: 10,
  },
  createButtonm: {
    backgroundColor: COLORS.primary,
    marginLeft: 10,
  },
  disabledButtonm: {
    backgroundColor: '#a0c2e8',
  },
  cancelButtonTextm: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  createButtonTextm: {
    color: 'white',
    fontSize: 16,
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
    paddingTop: 100,
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
    paddingVertical: 12,
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
    backgroundColor: '#E0E3EB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    // marginTop: 8,
    width: '46%',
    alignSelf: 'flex-start',
  },
  cancelButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 300,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#A0AEC0',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalCloseButton: {position: 'absolute', top: 12, right: 12, zIndex: 10},
});
