import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Keyboard, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext'; // Importe o contexto

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth(); // Pegue a função signIn do contexto
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const passwordValid = password.length >= 6;
  const validateEmail = (e) => {
    const s = String(e).toLowerCase();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!re.test(s)) return { ok: false, gmailIssue: false };
    const isGmail = s.endsWith('@gmail.com');
    if (!isGmail) return { ok: true, gmailIssue: false };
    const local = s.split('@')[0];
    if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return { ok: false, gmailIssue: true };
    const gmailLocalOk = /^[A-Za-z0-9.]+(\+[A-Za-z0-9]+)?$/.test(local);
    return { ok: gmailLocalOk, gmailIssue: !gmailLocalOk };
  };
  const emailCheck = validateEmail(email);

  async function handleLogin() {
    if(!email || !password) return Alert.alert("Atenção", "Preencha email e senha!");

    setLoading(true);
    try {
      const adminEmail = 'pablo@good.com';
      if (String(email).toLowerCase() === adminEmail) {
        const r = await api.post('/auth/good-login', { email, password });
        const { token } = r.data;
        await signIn(token, 'admin');
        router.replace('/good');
        return;
      }

      const response = await api.post('/auth/login', { email, password });
      
      const { token, user } = response.data;

      // --- MUDANÇA AQUI: Passamos o Token E o Role (Papel) ---
      await signIn(token, user.role);
      // -------------------------------------------------------

      // O AuthContext fará o redirecionamento automático agora!

    } catch (error) {
      const status = error?.response?.status;
      const isGmail = String(email).toLowerCase().endsWith('@gmail.com');
      let msg = 'Falha no login.';
      if (status === 404) {
        msg = isGmail ? 'Gmail inválido ou não existe.' : 'Email não encontrado.';
      } else if (status === 401) {
        msg = 'Senha incorreta.';
      } else if (status === 403) {
        msg = 'Conta desativada.';
      } else {
        msg = error?.response?.data?.message || 'Erro no servidor.';
      }
      Alert.alert('Erro', msg);
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>MAXIMIZZE</Text>
        
        <Text style={styles.label}>Email</Text>
        <TextInput 
          style={[styles.input, (!emailCheck.ok) && styles.inputError]}
          placeholder="Digite seu email"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="none"
          autoComplete="off"
          keyboardType="email-address"
          blurOnSubmit
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
        />
        {!emailCheck.ok && (
          <Text style={[styles.helperText, styles.helperError]}>
            {emailCheck.gmailIssue ? 'Email Gmail inválido.' : 'Email inválido.'}
          </Text>
        )}

        <Text style={styles.label}>Senha</Text>
        <TextInput 
          style={styles.input}
          placeholder="******"
          placeholderTextColor="#666"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="none"
          autoComplete="off"
          blurOnSubmit
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
        />
        <Text style={styles.helperText}>Use sua senha com 6 ou mais caracteres.</Text>

        <TouchableOpacity onPress={() => { Keyboard.dismiss(); if (Platform.OS === 'web') { try { (document.activeElement)?.blur(); } catch(e){} } router.push('/forgot-password'); }}>
          <Text style={styles.forgotText}>Esqueci minha senha</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading || !emailCheck.ok || !passwordValid}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>ENTRAR</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.createAccountButton} onPress={() => { Keyboard.dismiss(); if (Platform.OS === 'web') { try { (document.activeElement)?.blur(); } catch(e){} } router.push('/register'); }}>
          <Text style={styles.createAccountText}>Não tem conta? <Text style={{color: '#AF8EFA'}}>Crie agora</Text></Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1D2C', justifyContent: 'center', padding: 20 },
  card: { maxWidth: 400, width: '100%', backgroundColor: '#25293A', borderRadius: 10, padding: 30, alignSelf: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#AF8EFA', textAlign: 'center', marginBottom: 30 },
  label: { color: '#E0E0E0', marginBottom: 5, fontWeight: '600' },
  input: { backgroundColor: '#1A1D2C', color: '#FFF', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  inputError: { borderColor: '#FF6666' },
  button: { backgroundColor: '#AF8EFA', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  forgotText: { color: '#AAA', textAlign: 'right', marginBottom: 20, fontSize: 12 },
  createAccountButton: { marginTop: 20, alignItems: 'center' },
  createAccountText: { color: '#FFF' },
  helperText: { color: '#AAA', fontSize: 12, marginTop: -10, marginBottom: 10 },
  helperError: { color: '#FF6666' }
});
