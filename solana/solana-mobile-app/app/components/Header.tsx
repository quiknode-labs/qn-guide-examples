import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { styles } from '../styles';
import { shortenAddress } from '../utils/addressUtils';

interface HeaderProps {
  connectedAddress: string | null;
  isConnecting: boolean;
  onAddressPress: () => void;
  onConnect: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  connectedAddress, 
  isConnecting, 
  onAddressPress, 
  onConnect 
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    if (connectedAddress) {
      try {
        await Clipboard.setStringAsync(connectedAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch (error) {
        console.error('Failed to copy address:', error);
      }
    }
  };
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Solana Mobile App</Text>
      {connectedAddress ? (
        <View style={styles.addressContainer}>
          <TouchableOpacity
            style={styles.addressButton}
            onPress={onAddressPress}
          >
            <Text style={styles.addressButtonText}>{shortenAddress(connectedAddress)}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.copyButton, copied && styles.copyButtonCopied]}
            onPress={handleCopyAddress}
          >
            <Text style={styles.copyButtonText}>
              {copied ? '✓' : '⧉'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.connectButton, isConnecting && styles.buttonDisabled]}
          onPress={onConnect}
          disabled={isConnecting}
        >
          <Text style={styles.connectButtonText}>
            {isConnecting ? 'Connecting...' : 'Connect'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

