import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles';

interface ConnectScreenProps {
  isConnecting: boolean;
  onConnect: () => void;
  onCancel: () => void;
}

export const ConnectScreen: React.FC<ConnectScreenProps> = ({ 
  isConnecting, 
  onConnect, 
  onCancel 
}) => {
  return (
    <>
      <Text style={styles.title}>gm!</Text>
      <Text style={styles.subtitle}>Welcome to your Solana Mobile App</Text>
      <View style={styles.connectContainer}>
        <TouchableOpacity
          style={[styles.mainConnectButton, isConnecting && styles.buttonDisabled]}
          onPress={onConnect}
          disabled={isConnecting}
        >
          <Text style={styles.mainConnectButtonText}>
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </Text>
        </TouchableOpacity>
        {isConnecting && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel Connection</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );
};
