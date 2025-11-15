import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles';

interface DisconnectModalProps {
  visible: boolean;
  onDisconnect: () => void;
  onCancel: () => void;
}

export const DisconnectModal: React.FC<DisconnectModalProps> = ({ 
  visible, 
  onDisconnect, 
  onCancel 
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Wallet Options</Text>
          <TouchableOpacity
            style={styles.modalDisconnectButton}
            onPress={onDisconnect}
          >
            <Text style={styles.modalDisconnectButtonText}>Disconnect Wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={onCancel}
          >
            <Text style={styles.modalCancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
