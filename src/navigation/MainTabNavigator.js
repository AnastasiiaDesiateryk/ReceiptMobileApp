import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ReceiptsStack from './ReceiptsStack';
import ProfileScreen from '../components/Profile/ProfileScreen';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: '#4a90e2',
      tabBarInactiveTintColor: '#999',
      tabBarLabelStyle: { fontSize: 12 },
      tabBarIcon: ({ color, size }) => {
        let iconName = 'receipt';
        if (route.name === 'Receipts') iconName = 'receipt';
        else if (route.name === 'Profile') iconName = 'person';

        return <MaterialIcons name={iconName} size={size} color={color} />;
      },
    })}>
    <Tab.Screen
      name="Receipts"
      component={ReceiptsStack}
      options={{ tabBarAccessibilityLabel: 'Receipts Tab' }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ tabBarAccessibilityLabel: 'Profile Tab' }}
    />
  </Tab.Navigator>
);

export default MainTabNavigator;
