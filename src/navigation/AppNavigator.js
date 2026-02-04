import React, { useContext } from 'react';
// import { View, ActivityIndicator } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
// import { AuthContext } from '../context/AuthContext';
// import AuthStack from './AuthStack';
import MainTabNavigator from './MainTabNavigator';

const Stack = createStackNavigator();

// const SplashScreen = () => (
//   <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
//     <ActivityIndicator />
//   </View>
// );

   const AppNavigator = () => {
//   const { isAuthenticated, loading } = useContext(AuthContext);

  // if (loading) {
  //   return <SplashScreen />;
  // }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainApp" component={MainTabNavigator} />
    </Stack.Navigator>
  );
  // return (
  //   <Stack.Navigator screenOptions={{ headerShown: false }}>
  //     {isAuthenticated ? (
  //       <Stack.Screen name="MainApp" component={MainTabNavigator} />
  //     ) : (
  //       <Stack.Screen name="Auth" component={AuthStack} />
  //     )}
  //   </Stack.Navigator>
  // );
};
export default AppNavigator;
