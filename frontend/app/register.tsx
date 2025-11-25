import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Keyboard, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../src/services/api';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'customer' | 'seller'>('customer');
  const allowedQuestions = [
    'Qual é o nome da sua mãe?',
    'Qual é o nome do seu primeiro animal de estimação?',
    'Qual é a cidade onde você nasceu?'
  ];
  const [selectedQuestion, setSelectedQuestion] = useState<string>(allowedQuestions[0]);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const passwordValid = password.length >= 6;
  const passwordsMatch = password === confirmPassword;
  const emailStr = String(email).toLowerCase();
  const emailBaseRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const emailBaseOk = emailBaseRegex.test(emailStr);
  const isGmail = emailStr.endsWith('@gmail.com');
  const gmailLocal = emailStr.split('@')[0];
  const gmailLocalBasicOk = !gmailLocal.startsWith('.') && !gmailLocal.endsWith('.') && !gmailLocal.includes('..');
  const gmailLocalRegexOk = /^[A-Za-z0-9.]+(\+[A-Za-z0-9]+)?$/.test(gmailLocal);
  const emailValid = emailBaseOk && (!isGmail || (gmailLocalBasicOk && gmailLocalRegexOk));
  const nameTrim = String(name).trim();
  const nameValid = nameTrim.length >= 3 && nameTrim.length <= 60 && /^[A-Za-zÀ-ÖØ-öø-ÿ' ]+$/.test(nameTrim);

  function validateName(n: string) {
    const t = String(n).trim();
    if (t.length < 3 || t.length > 60) return false;
    return /^[A-Za-zÀ-ÖØ-öø-ÿ' ]+$/.test(t);
  }

  function validateEmail(e: string) {
    const s = String(e).toLowerCase();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!re.test(s)) return false;
    if (s.endsWith('@gmail.com')) {
      const local = s.split('@')[0];
      if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
      if (!/^[A-Za-z0-9.]+(\+[A-Za-z0-9]+)?$/.test(local)) return false;
    }
    return true;
  }

  async function handleRegister() {
    if (!name || !email || !password || !confirmPassword) {
      return Alert.alert('Atenção', 'Preencha todos os campos.');
    }
    if (!validateName(name)) {
      return Alert.alert('Atenção', 'Nome inválido. Use apenas letras e espaços.');
    }
    if (!validateEmail(email)) {
      return Alert.alert('Atenção', 'Email inválido.');
    }
    if (password !== confirmPassword) {
      return Alert.alert('Atenção', 'As senhas não conferem.');
    }
    if (password.length < 6) {
      return Alert.alert('Atenção', 'Senha deve ter ao menos 6 caracteres.');
    }
    setLoading(true);
    try {
      await api.post('/auth/register', { name, email, password, role, security_question: selectedQuestion, security_answer: securityAnswer });
      Alert.alert('Sucesso', 'Conta criada! Faça login.');
      router.replace('/');
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Falha ao criar conta.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#1A1D2C' }}
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20, paddingBottom: 80 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <Text style={styles.title}>Criar Conta</Text>

        <Text style={styles.label}>Nome</Text>
        <TextInput style={[styles.input, (!nameValid) && styles.inputError]} value={name} onChangeText={setName} placeholder="Seu nome" placeholderTextColor="#666" blurOnSubmit returnKeyType="done" onSubmitEditing={() => Keyboard.dismiss()} />
        {!nameValid && <Text style={[styles.helperText, styles.helperError]}>Use um nome com letras e espaços, 3–60 caracteres.</Text>}

        <Text style={styles.label}>Email</Text>
        <TextInput style={[styles.input, (!emailValid) && styles.inputError]} value={email} onChangeText={setEmail} placeholder="email@exemplo.com" placeholderTextColor="#666" keyboardType="email-address" autoCapitalize="none" blurOnSubmit returnKeyType="done" onSubmitEditing={() => Keyboard.dismiss()} />
        {!emailValid && (
          <Text style={[styles.helperText, styles.helperError]}>
            {(!emailBaseOk) ? 'Email inválido.' : (isGmail ? 'Email Gmail inválido.' : 'Email inválido.')}
          </Text>
        )}

        <Text style={styles.label}>Senha</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="******" placeholderTextColor="#666" secureTextEntry blurOnSubmit returnKeyType="done" onSubmitEditing={() => Keyboard.dismiss()} />
        <Text style={[styles.helperText, !passwordValid && styles.helperError]}>A senha deve ter pelo menos 6 caracteres.</Text>

        <Text style={styles.label}>Confirmar Senha</Text>
        <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="******" placeholderTextColor="#666" secureTextEntry blurOnSubmit returnKeyType="done" onSubmitEditing={() => Keyboard.dismiss()} />
        {!passwordsMatch && <Text style={[styles.helperText, styles.helperError]}>As senhas devem ser iguais.</Text>}

        <View style={styles.roleRow}>
          <TouchableOpacity style={[styles.roleButton, role === 'customer' && styles.roleActive]} onPress={() => setRole('customer')}>
            <Text style={styles.roleText}>Cliente</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.roleButton, role === 'seller' && styles.roleActive]} onPress={() => setRole('seller')}>
            <Text style={styles.roleText}>Vendedor</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Pergunta de segurança</Text>
        <View style={styles.questionsRow}>
          {allowedQuestions.map((q) => (
            <TouchableOpacity key={q} style={[styles.questionOption, selectedQuestion === q && styles.questionOptionActive]} onPress={() => setSelectedQuestion(q)}>
              <Text style={[styles.questionText, selectedQuestion === q && styles.questionTextActive]}>{q}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Resposta de segurança</Text>
        <TextInput style={styles.input} value={securityAnswer} onChangeText={setSecurityAnswer} placeholder="Sua resposta" placeholderTextColor="#666" autoCapitalize="none" blurOnSubmit returnKeyType="done" onSubmitEditing={() => Keyboard.dismiss()} />

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading || !passwordValid || !passwordsMatch || !nameValid || !emailValid}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>CADASTRAR</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton} onPress={() => { Keyboard.dismiss(); if (Platform.OS === 'web') { try { (document.activeElement as any)?.blur(); } catch(e){} } router.replace('/'); } }>
          <Text style={styles.linkText}>Já tenho conta. Voltar.</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  linkText: { color: '#FFF' }
  ,roleRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  roleButton: { flex: 1, backgroundColor: '#1A1D2C', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#333', alignItems: 'center' },
  roleActive: { backgroundColor: '#2A2E40', borderColor: '#AF8EFA' },
  roleText: { color: '#FFF', fontWeight: '600' },
  helperText: { color: '#AAA', fontSize: 12, marginTop: -10, marginBottom: 10 },
  helperError: { color: '#FF6666' }
  ,questionsRow: { gap: 8, marginTop: 10 },
  questionOption: { backgroundColor: '#1A1D2C', borderWidth: 1, borderColor: '#333', borderRadius: 8, padding: 10, marginBottom: 8 },
  questionOptionActive: { borderColor: '#AF8EFA' },
  questionText: { color: '#AAA' },
  questionTextActive: { color: '#E0E0E0' }
});
