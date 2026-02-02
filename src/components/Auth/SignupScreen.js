import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';

const SignupScreen = ({ navigation }) => {
  const { signup, loading } = useContext(AuthContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const validateInputs = () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      Alert.alert('Validation', 'Please enter your email.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      Alert.alert('Validation', 'Please enter a valid email.');
      return false;
    }

    if (!password) {
      Alert.alert('Validation', 'Please enter a password.');
      return false;
    }

    if (password.length < 12) {
      Alert.alert('Validation', 'Password must be at least 12 characters long.');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Validation', 'Passwords do not match.');
      return false;
    }

    return true;
  };

  const handleSignup = async () => {
    if (!validateInputs()) return;

    try {
      const normalizedEmail = email.trim().toLowerCase();
      await signup(normalizedEmail, password);
    } catch (e) {
      Alert.alert('Signup Failed', e.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Create Account</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          textContentType="newPassword"
          value={password}
          onChangeText={setPassword}
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          secureTextEntry
          textContentType="password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          editable={!loading}
        />

        {loading ? (
          <ActivityIndicator size="large" color="#4a90e2" style={styles.loading} />
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleSignup}>
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.loginText}>Already have an account? Log in</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  inner: { padding: 24, flex: 1, justifyContent: 'center' },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 28,
    color: '#222',
    textAlign: 'center',
  },
  input: {
    height: 48,
    backgroundColor: 'white',
    borderRadius: 6,
    marginBottom: 16,
    paddingHorizontal: 12,
    fontSize: 16,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  button: {
    height: 48,
    backgroundColor: '#4a90e2',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: { color: 'white', fontSize: 18, fontWeight: '600' },
  loginText: {
    color: '#4a90e2',
    textAlign: 'center',
    fontSize: 14,
    marginTop: 8,
  },
  loading: { marginVertical: 16 },
});

export default SignupScreen;
