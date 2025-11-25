import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Switch, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../services/api';

export default function RegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const allowedQuestions = [
    'Qual é o nome da sua mãe?',
    'Qual é o nome do seu primeiro animal de estimação?',
    'Qual é a cidade onde você nasceu?'
  ];
  const [selectedQuestion, setSelectedQuestion] = useState(allowedQuestions[0]);
  const [securityAnswer, setSecurityAnswer] = useState('');
  
  // A "Chavinha": false = Cliente, true = Vendedor
  const [isSeller, setIsSeller] = useState(false);

  async function handleRegister() {
    if (!email || !password || !confirmPassword) {
      return Alert.alert("Erro", "Preencha todos os campos.");
    }

    if (password !== confirmPassword) {
      return Alert.alert("Erro", "As senhas não coincidem.");
    }

    if (!selectedQuestion || !securityAnswer) {
      return Alert.alert("Erro", "Selecione a pergunta e informe a resposta.");
    }

    setLoading(true);
    try {
      // Envia para o backend definindo o ROLE baseado na chavinha
      await api.post('/auth/register', {
        email,
        password,
        role: isSeller ? 'seller' : 'customer',
        security_question: selectedQuestion,
        security_answer: securityAnswer
      });

      Alert.alert("Sucesso", "Conta criada! Faça login para continuar.");
      router.back(); // Volta para a tela de Login

    } catch (error) {
      const msg = error.response?.data?.message || "Falha ao criar conta.";
      Alert.alert("Erro", msg);
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
        <Text style={styles.title}>Crie sua Conta</Text>

        {/* --- CHAVINHA DE SELEÇÃO (TOGGLE) --- */}
        <View style={styles.switchContainer}>
          <Text style={[styles.switchLabel, !isSeller && styles.activeLabel]}>Cliente</Text>
          <Switch
            trackColor={{ false: "#767577", true: "#AF8EFA" }}
            thumbColor={isSeller ? "#FFF" : "#f4f3f4"}
            onValueChange={() => setIsSeller(previousState => !previousState)}
            value={isSeller}
          />
          <Text style={[styles.switchLabel, isSeller && styles.activeLabel]}>Vendedor</Text>
        </View>
        {/* ------------------------------------ */}

        <Text style={styles.label}>Email</Text>
        <TextInput 
          style={styles.input}
          placeholder="seu@email.com"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="none"
          autoComplete="off"
        />

        <Text style={styles.label}>Senha</Text>
        <TextInput 
          style={styles.input}
          placeholder="******"
          placeholderTextColor="#666"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          // --- CONFIGURAÇÕES ANTI-AUTOFILL DO IOS ---
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="none"
          autoComplete="off"
          // ------------------------------------------
        />

        <Text style={styles.label}>Confirmar Senha</Text>
        <TextInput 
          style={styles.input}
          placeholder="******"
          placeholderTextColor="#666"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          // --- CONFIGURAÇÕES ANTI-AUTOFILL DO IOS ---
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="none"
          autoComplete="off"
          // ------------------------------------------
        />

        <Text style={styles.label}>Pergunta de segurança</Text>
        <View style={styles.questionsRow}>
          {allowedQuestions.map(q => (
            <TouchableOpacity key={q} style={[styles.questionOption, selectedQuestion === q && styles.questionOptionActive]} onPress={() => setSelectedQuestion(q)}>
              <Text style={[styles.questionText, selectedQuestion === q && styles.questionTextActive]}>{q}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Resposta de segurança</Text>
        <TextInput 
          style={styles.input}
          placeholder="Sua resposta"
          placeholderTextColor="#666"
          value={securityAnswer}
          onChangeText={setSecurityAnswer}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="none"
          autoComplete="off"
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>CADASTRAR</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton} onPress={() => router.back()}>
          <Text style={styles.linkText}>Já tenho conta. Voltar.</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1D2C', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#25293A', padding: 25, borderRadius: 10 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#AF8EFA', textAlign: 'center', marginBottom: 20 },
  
  // Estilos da Chavinha
  switchContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  switchLabel: { color: '#666', fontWeight: 'bold', marginHorizontal: 10 },
  activeLabel: { color: '#AF8EFA' },

  label: { color: '#E0E0E0', marginBottom: 5, fontWeight: '600' },
  input: { backgroundColor: '#1A1D2C', color: '#FFF', padding: 12, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  button: { backgroundColor: '#AF8EFA', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#FFF', fontWeight: 'bold' },
  linkButton: { marginTop: 15, alignItems: 'center' },
  linkText: { color: '#AAA' }
});
