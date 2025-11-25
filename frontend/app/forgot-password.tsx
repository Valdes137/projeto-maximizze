import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Keyboard, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../src/services/api';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loadingSend, setLoadingSend] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);
  const emailStr = String(email).toLowerCase().trim();
  const emailBaseRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const emailBaseOk = emailBaseRegex.test(emailStr);
  const isGmail = emailStr.endsWith('@gmail.com');
  const gmailLocal = emailStr.split('@')[0];
  const gmailLocalBasicOk = !gmailLocal.startsWith('.') && !gmailLocal.endsWith('.') && !gmailLocal.includes('..');
  const gmailLocalRegexOk = /^[A-Za-z0-9.]+(\+[A-Za-z0-9]+)?$/.test(gmailLocal);
  const emailValid = emailBaseOk && (!isGmail || (gmailLocalBasicOk && gmailLocalRegexOk));

  async function handleSend() {
    if (!emailStr || !emailValid) return Alert.alert('Atenção', 'Informe um email válido.');
    setLoadingSend(true);
    try {
      const r = await api.post('/auth/forgot', { email: emailStr });
      setQuestion(r.data?.question || '');
      if (!r.data?.question) {
        Alert.alert('Erro', 'Pergunta não encontrada.');
      }
    } catch (error: any) {
      const status = error?.response?.status;
      let msg = error?.response?.data?.message || 'Falha ao buscar pergunta.';
      if (status === 404) msg = 'Email não encontrado.';
      Alert.alert('Erro', msg);
    } finally {
      setLoadingSend(false);
    }
  }

  async function handleReset() {
    if (!answer || !newPassword) return Alert.alert('Atenção', 'Informe a resposta e a nova senha.');
    if (newPassword.length < 6) return Alert.alert('Atenção', 'Senha deve ter ao menos 6 caracteres.');
    setLoadingReset(true);
    try {
      await api.post('/auth/reset', { email: emailStr, answer, new_password: newPassword });
      Alert.alert('Sucesso', 'Senha atualizada. Faça login.');
      router.replace('/');
    } catch (error: any) {
      const status = error?.response?.status;
      let msg = error?.response?.data?.message || 'Falha ao atualizar senha.';
      if (status === 401) msg = 'Resposta incorreta.';
      if (status === 404) msg = 'Usuário não encontrado.';
      Alert.alert('Erro', msg);
    } finally {
      setLoadingReset(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Recuperar Senha</Text>

      <Text style={styles.label}>Email</Text>
        <TextInput style={[styles.input, (!emailValid) && styles.inputError]} value={email} onChangeText={setEmail} placeholder="email@exemplo.com" placeholderTextColor="#666" keyboardType="email-address" autoCapitalize="none" blurOnSubmit />
        {!emailValid && (
          <Text style={[styles.helperText, styles.helperError]}>
            {(!emailBaseOk) ? 'Email inválido.' : (isGmail ? 'Email Gmail inválido.' : 'Email inválido.')}
          </Text>
        )}

        <TouchableOpacity style={styles.button} onPress={handleSend} disabled={loadingSend || !emailValid}>
          {loadingSend ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>BUSCAR PERGUNTA</Text>}
        </TouchableOpacity>

        {question ? (
          <View>
            <Text style={styles.label}>Pergunta</Text>
            <Text style={styles.linkText}>{question}</Text>
            <Text style={styles.label}>Resposta</Text>
            <TextInput style={styles.input} value={answer} onChangeText={setAnswer} placeholder="Digite sua resposta" placeholderTextColor="#666" autoCapitalize="none" blurOnSubmit returnKeyType="done" onSubmitEditing={() => Keyboard.dismiss()} />
          </View>
        ) : null}

        <Text style={styles.label}>Nova Senha</Text>
        <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} placeholder="******" placeholderTextColor="#666" secureTextEntry blurOnSubmit returnKeyType="done" onSubmitEditing={() => Keyboard.dismiss()} />
        <Text style={styles.helperText}>A senha deve ter pelo menos 6 caracteres.</Text>

        <TouchableOpacity style={styles.button} onPress={handleReset} disabled={loadingReset || newPassword.length < 6 || !question || !answer}>
          {loadingReset ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>ATUALIZAR SENHA</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton} onPress={() => { Keyboard.dismiss(); if (Platform.OS === 'web') { try { (document.activeElement as any)?.blur(); } catch(e){} } router.replace('/'); } }>
          <Text style={styles.linkText}>Voltar ao login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1D2C', justifyContent: 'center', padding: 20 },
  card: { maxWidth: 400, width: '100%', backgroundColor: '#25293A', borderRadius: 10, padding: 30, alignSelf: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#AF8EFA', textAlign: 'center', marginBottom: 20 },
  label: { color: '#E0E0E0', marginBottom: 5, fontWeight: '600' },
  input: { backgroundColor: '#1A1D2C', color: '#FFF', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  inputError: { borderColor: '#FF6666' },
  button: { backgroundColor: '#AF8EFA', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  linkButton: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#FFF' },
  helperText: { color: '#AAA', fontSize: 12, marginTop: -10, marginBottom: 10 },
  helperError: { color: '#FF6666' }
});
