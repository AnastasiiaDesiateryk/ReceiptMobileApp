import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { AuthContext } from '../../context/AuthContext';


const ProfileScreen = () => {
  const { user, logout, loading } = useContext(AuthContext);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{user?.email || 'Unknown'}</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogout}
        disabled={loading}
        accessibilityLabel="Logout button"
      >
        <Text style={styles.buttonText}>{loading ? 'Logging out...' : 'Logout'}</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Receipt Vault v1.0.0
        </Text>
        <Text style={styles.footerText}>For support, contact support@receiptvault.example.com</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f5f5f5' },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 32,
    color: '#222',
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 32,
  },
  label: { fontSize: 14, fontWeight: '600', color: '#444' },
  value: { fontSize: 18, fontWeight: '700', color: '#000', marginTop: 4 },
  button: {
    backgroundColor: '#4a90e2',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#a0c4f4',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    marginTop: 48,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});

export default ProfileScreen;
