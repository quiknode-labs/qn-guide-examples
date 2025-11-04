import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
import { styles } from '../styles';
import { transferSol } from '../services/transferService';
import { formatSolAmount } from '../utils/addressUtils';
import { rpc } from '../services/rpcClient';
import { LAMPORTS_PER_SOL } from '../constants';

interface SendSolFormProps {
  currentBalance: number;
  walletAddress: string;
  onBack: () => void;
  onSuccess: (amount: string, recipientAddress: string) => void;
  refreshBalance: () => Promise<void>;
}

export const SendSolForm: React.FC<SendSolFormProps> = ({
  currentBalance,
  walletAddress,
  onBack,
  onSuccess,
  refreshBalance
}) => {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Convert lamports to SOL for display and validation
  const balanceSol = currentBalance / LAMPORTS_PER_SOL;

  const amountNum = parseFloat(amount) || 0;
  const hasInsufficientFunds = amountNum > balanceSol;
  const isValidAmount = amountNum > 0 && amountNum <= balanceSol;
  const isValidAddress = recipientAddress.length > 0;
  const isOwnAddress = recipientAddress.toLowerCase() === walletAddress.toLowerCase();

  const handleSend = async () => {
    if (!isValidAmount || !isValidAddress || isOwnAddress) {
      return;
    }

    try {
      setIsSending(true);
      
      // Call the actual transfer service
      const signature = await transferSol(walletAddress, recipientAddress, amountNum, rpc);
      
      // Refresh the balance after successful transfer
      await refreshBalance();
      
      // Call onSuccess immediately to close the form and show confirmation
      onSuccess(amount, recipientAddress);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert('Transfer Failed', errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={styles.sendFormContainer}>
      <Text style={styles.sendFormTitle}>Send SOL</Text>
      
      <View style={styles.formField}>
        <Text style={styles.formLabel}>Recipient Address</Text>
        <TextInput
          style={[styles.formInput, styles.recipientInput, isSending && styles.formInputDisabled]}
          value={recipientAddress}
          onChangeText={setRecipientAddress}
          placeholder="Enter Solana wallet address"
          placeholderTextColor="#999"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isSending}
        />
      </View>

      <View style={styles.formField}>
        <Text style={styles.formLabel}>Amount (SOL)</Text>
        <TextInput
          style={[styles.formInput, isSending && styles.formInputDisabled]}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.0"
          placeholderTextColor="#999"
          keyboardType="numeric"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isSending}
        />
        {hasInsufficientFunds && (
          <Text style={styles.insufficientFundsText}>Insufficient funds</Text>
        )}
        {isOwnAddress && recipientAddress.length > 0 && (
          <Text style={styles.insufficientFundsText}>Cannot send to your own address</Text>
        )}
        <Text style={styles.balanceText}>
          Available: {formatSolAmount(balanceSol)} SOL
        </Text>
      </View>

      <View style={styles.sendFormButtons}>
        <TouchableOpacity
          style={[styles.backButton, isSending && styles.buttonDisabled]}
          onPress={onBack}
          disabled={isSending}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sendFormSendButton,
            (!isValidAmount || !isValidAddress || isOwnAddress || isSending) && styles.buttonDisabled
          ]}
          onPress={handleSend}
          disabled={!isValidAmount || !isValidAddress || isOwnAddress || isSending}
        >
          <Text style={styles.sendFormSendButtonText}>
            {isSending ? 'Sending...' : 'Send'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loading Modal */}
      <Modal
        visible={isSending}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#9945FF" />
            <Text style={styles.loadingText}>Processing Transaction...</Text>
            <Text style={styles.loadingSubtext}>Please confirm in your wallet</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};
