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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LoginScreen = ({ navigation }) => {
  const { login, loading } = useContext(AuthContext);

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [password, setPassword] = useState('');

  const validateEmailLive = (value) => {
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    setEmailError(null);
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(normalized)) {
    setEmailError('Enter a valid email');
  } else {
    setEmailError(null);
  }
};

  const validateInputs = () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      Alert.alert('Validation', 'Please enter your email.');
      return false;
    }

    if (!emailRegex.test(normalizedEmail)) {
      Alert.alert('Validation', 'Please enter a valid email.');
      return false;
    }

    if (!password) {
      Alert.alert('Validation', 'Please enter your password.');
      return false;
    }

    // На login экране не нужно проверять длину пароль — сервер знает лучше.
    // Здесь просто проверяем, что он введён.

    return true;
  };

  const handleLogin = async () => {
    if (!validateInputs()) return;

    try {
      const normalizedEmail = email.trim().toLowerCase();
      await login(normalizedEmail, password);
    } catch (e) {
      Alert.alert('Login Failed', e.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Receipt Vault</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            validateEmailLive(text);
          }}
          editable={!loading}
        />

        {/* Email error message */}
        {emailError && (
          <Text style={styles.errorText}>{emailError}</Text>
        )}

        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          textContentType="password"
          value={password}
          onChangeText={setPassword}
          editable={!loading}
        />

        {loading ? (
          <ActivityIndicator size="large" color="#4a90e2" style={styles.loading} />
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Log In</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => navigation.navigate('Signup')}
          disabled={loading}
        >
          <Text style={styles.signupText}>Don't have an account? Sign up</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  inner: { padding: 24, flex: 1, justifyContent: 'center' },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 32,
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
  signupText: {
    color: '#4a90e2',
    textAlign: 'center',
    fontSize: 14,
    marginTop: 8,
  },
  loading: { marginVertical: 16 },
});

export default LoginScreen;
