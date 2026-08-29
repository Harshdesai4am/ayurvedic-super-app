import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { store } from './src/app/store/store';
import { ThemeProvider } from './src/app/theme/ThemeProvider';
import { ToastProvider } from './src/shared/components/ui/Toast';
import { ErrorBoundary } from './src/core/errors/ErrorBoundary';
import { RootNavigator } from './src/app/navigation/RootNavigator';

const App = () => {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <ThemeProvider>
          <ToastProvider>
            <SafeAreaProvider>
              <StatusBar barStyle="dark-content" />
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
            </SafeAreaProvider>
          </ToastProvider>
        </ThemeProvider>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;
