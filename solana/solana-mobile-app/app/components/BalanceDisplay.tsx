import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { styles } from '../styles';
import { useAirdrop } from '../hooks/useAirdrop';
import { ErrorModal } from './ErrorModal';
import { SendSolForm } from './SendSolForm';
import { formatSolAmount } from '../utils/addressUtils';
import { LAMPORTS_PER_SOL } from '../constants';

interface BalanceDisplayProps {
  balance: number | null;
  loading: boolean;
  error: string | null;
  walletAddress: string;
  refreshBalance: () => Promise<void>;
}

export const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ 
  balance, 
  loading, 
  error, 
  walletAddress,
  refreshBalance
}) => {
  const { requestAirdrop, isRequesting, error: airdropError } = useAirdrop();
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalData, setErrorModalData] = useState({ title: '', message: '' });
  const [showSendForm, setShowSendForm] = useState(false);
  const [sendConfirmation, setSendConfirmation] = useState<{amount: string, address: string} | null>(null);

  const handleAirdrop = async () => {
    try {
      const signature = await requestAirdrop(walletAddress);
      if (signature) {
        Alert.alert('Success', `Airdrop successful! Transaction: ${signature.slice(0, 8)}...`);
        // Refresh the balance after successful airdrop
        await refreshBalance();
      } else {
        setErrorModalData({
          title: 'Airdrop Failed',
          message: 'Failed to request airdrop. Please try again later.'
        });
        setShowErrorModal(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      // Check for specific error types and show user-friendly messages
      let displayMessage: string;
      if (errorMessage.includes('HTTP error (429)') || errorMessage.includes('429')) {
        displayMessage = 'Airdrops are rate limited. Please try again later.';
      } else if (errorMessage.includes('RPC server error')) {
        displayMessage = 'Server error occurred. Please try again later.';
      } else {
        displayMessage = `Error: ${errorMessage}`;
      }
      
      setErrorModalData({
        title: 'Airdrop Error',
        message: displayMessage
      });
      setShowErrorModal(true);
    }
  };

  if (showSendForm && balance !== null) {
    return (
      <SendSolForm
        currentBalance={balance}
        walletAddress={walletAddress}
        onBack={() => setShowSendForm(false)}
        onSuccess={(amount: string, recipientAddress: string) => {
          // Set confirmation first
          setSendConfirmation({ amount, address: recipientAddress });
          // Close the form
          setShowSendForm(false);
        }}
        refreshBalance={refreshBalance}
      />
    );
  }

  return (
    <View style={styles.balanceContainer}>
      <View style={styles.balanceTitleRow}>
        <Text style={styles.balanceTitle}>SOL Balance</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={refreshBalance}
          disabled={loading}
        >
          <Text style={styles.refreshIcon}>↻</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.balanceDisplayContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#9945FF" />
        ) : error ? (
          <Text style={styles.balanceError}>Error loading balance</Text>
        ) : (
          <Text style={styles.balanceAmount}>
            {formatSolAmount((balance || 0) / LAMPORTS_PER_SOL)} SOL
          </Text>
        )}
      </View>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.airdropButton, isRequesting && styles.buttonDisabled]}
          onPress={handleAirdrop}
          disabled={isRequesting}
        >
          <Text style={styles.airdropButtonText}>
            {isRequesting ? 'Requesting...' : 'Airdrop'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.sendButton}
          onPress={() => setShowSendForm(true)}
        >
          <Text style={styles.sendButtonText}>Send SOL</Text>
        </TouchableOpacity>
      </View>
      
      {airdropError && (
        <Text style={styles.airdropError}>{airdropError}</Text>
      )}
      
      {sendConfirmation && (
        <Text style={styles.sendConfirmation}>
          Sent {sendConfirmation.amount} SOL to {sendConfirmation.address.slice(0, 4)}...{sendConfirmation.address.slice(-4)}
        </Text>
      )}
      
      <ErrorModal
        visible={showErrorModal}
        title={errorModalData.title}
        message={errorModalData.message}
        onClose={() => setShowErrorModal(false)}
      />
    </View>
  );
};
