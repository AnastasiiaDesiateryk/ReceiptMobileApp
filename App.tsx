// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';

import { AuthProvider } from './src/context/AuthContext';
import { ReceiptProvider } from './src/context/ReceiptContext';
import AppNavigator from './src/navigation/AppNavigator';


// Игнорируем специфичные ворнинги
LogBox.ignoreLogs([
  'new NativeEventEmitter',
  'Require cycle:',
]);

const App = () => {
  console.log('APP_TSX_RENDER');

  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = !!state.isConnected && !!state.isInternetReachable;
      setIsConnected(connected);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthProvider>
      <ReceiptProvider>
        <NavigationContainer>
          <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
          <AppNavigator />
       
        </NavigationContainer>
      </ReceiptProvider>
    </AuthProvider>
  );
};

export default App;
