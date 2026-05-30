import React, { useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useStore } from '../store/useStore';

export default function SettingsScreen() {
  const { 
    apiKeys, setApiKey, 
    selectedProvider, setSelectedProvider, 
    selectedModel, setSelectedModel, 
    availableModels, fetchModelsForProvider 
  } = useStore();

  const providers = [
    { id: 'openai', name: 'OpenAI' },
    { id: 'claude', name: 'Anthropic Claude' },
    { id: 'gemini', name: 'Google Gemini' }
  ];

  useEffect(() => {
    fetchModelsForProvider(selectedProvider);
  }, [selectedProvider, fetchModelsForProvider]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Configure your AI Providers to use the Swarm features.</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Provider</Text>
        <View style={styles.providerRow}>
          {providers.map(p => (
            <TouchableOpacity 
              key={p.id} 
              style={[styles.providerBtn, selectedProvider === p.id && styles.providerBtnActive]}
              onPress={() => setSelectedProvider(p.id)}
            >
              <Text style={[styles.providerBtnText, selectedProvider === p.id && styles.providerBtnTextActive]}>
                {p.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Select Model for {providers.find(p => p.id === selectedProvider)?.name}</Text>
          <View style={styles.modelGrid}>
            {(availableModels[selectedProvider] || []).map(model => (
              <TouchableOpacity 
                key={model} 
                style={[styles.modelBtn, selectedModel === model && styles.modelBtnActive]}
                onPress={() => setSelectedModel(model)}
              >
                <Text style={[styles.modelBtnText, selectedModel === model && styles.modelBtnTextActive]}>
                  {model}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Keys</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>OpenAI API Key</Text>
          <TextInput 
            style={styles.input} 
            secureTextEntry
            placeholder="sk-..." 
            value={apiKeys.openai} 
            onChangeText={(v) => setApiKey('openai', v)} 
            onBlur={() => fetchModelsForProvider('openai')}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Anthropic (Claude) API Key</Text>
          <TextInput 
            style={styles.input} 
            secureTextEntry
            placeholder="sk-ant-..." 
            value={apiKeys.claude} 
            onChangeText={(v) => setApiKey('claude', v)} 
            onBlur={() => fetchModelsForProvider('claude')}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Google Gemini API Key</Text>
          <TextInput 
            style={styles.input} 
            secureTextEntry
            placeholder="AIzaSy..." 
            value={apiKeys.gemini} 
            onChangeText={(v) => setApiKey('gemini', v)} 
            onBlur={() => fetchModelsForProvider('gemini')}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 32, backgroundColor: '#f9fafb' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8, color: '#111827' },
  subtitle: { fontSize: 15, color: '#6b7280', marginBottom: 32 },
  section: { backgroundColor: '#fff', padding: 24, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#111827' },
  providerRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  providerBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center' },
  providerBtnActive: { backgroundColor: '#eff6ff', borderColor: '#2563eb' },
  providerBtnText: { fontSize: 14, fontWeight: '500', color: '#4b5563' },
  providerBtnTextActive: { color: '#1d4ed8', fontWeight: '600' },
  modelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modelBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  modelBtnActive: { backgroundColor: '#111827', borderColor: '#111827' },
  modelBtnText: { fontSize: 13, color: '#4b5563' },
  modelBtnTextActive: { color: '#fff', fontWeight: '500' },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 15, backgroundColor: '#fff', outlineStyle: 'none' }
});