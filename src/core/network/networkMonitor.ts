import { useState, useEffect } from 'react';
import { Logger } from '../logger/logger';

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
}

type NetworkListener = (state: NetworkState) => void;

class NetworkMonitorService {
  private listeners: Set<NetworkListener> = new Set();
  private currentState: NetworkState = { isConnected: true, isInternetReachable: true };
  private netInfoUnsubscribe: (() => void) | null = null;

  constructor() {
    this.initNetInfo();
  }

  private initNetInfo() {
    try {
      const NetInfo = require('@react-native-community/netinfo');
      this.netInfoUnsubscribe = NetInfo.addEventListener((state: any) => {
        const newState: NetworkState = {
          isConnected: !!state.isConnected,
          isInternetReachable: state.isInternetReachable,
        };
        this.currentState = newState;
        this.notifyListeners(newState);
      });
    } catch (e) {
      Logger.warn('NetInfo native listener unavailable. Defaulting network status to online.');
    }
  }

  private notifyListeners(state: NetworkState) {
    this.listeners.forEach((listener) => listener(state));
  }

  public subscribe(listener: NetworkListener): () => void {
    this.listeners.add(listener);
    listener(this.currentState);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getStatus(): NetworkState {
    return this.currentState;
  }
}

export const NetworkMonitor = new NetworkMonitorService();

export const useNetworkStatus = (): NetworkState => {
  const [networkState, setNetworkState] = useState<NetworkState>(NetworkMonitor.getStatus());

  useEffect(() => {
    const unsubscribe = NetworkMonitor.subscribe((state) => {
      setNetworkState(state);
    });
    return () => unsubscribe();
  }, []);

  return networkState;
};
