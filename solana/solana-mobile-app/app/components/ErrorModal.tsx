import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles';

interface ErrorModalProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({ 
  visible, 
  title, 
  message, 
  onClose 
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.errorMessage}>{message}</Text>
          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={onClose}
          >
            <Text style={styles.modalCancelButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
