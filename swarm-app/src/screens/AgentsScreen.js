import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Search, Bot, Plus, X, Trash2 } from 'lucide-react-native';
import { useStore } from '../store/useStore';

export default function AgentsScreen() {
  const { agents, addAgent, deleteAgent } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [role, setRole] = useState('Assistant');

  const handleAdd = () => {
    if (name && desc) {
      addAgent({ name, desc, role });
      setName(''); setDesc(''); setRole('Assistant');
      setIsAdding(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Agents</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setIsAdding(true)}>
            <Plus size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.addBtnText}>Create Agent</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Manage specialized agents for your Swarm.</Text>

        <View style={styles.searchBar}>
          <Search size={18} color="#9ca3af" />
          <TextInput style={styles.searchInput} placeholder="Search agents..." />
        </View>

        <View style={styles.grid}>
          {agents.map((agent) => (
            <View key={agent.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.iconWrapper}>
                  <Bot size={20} color="#4f46e5" />
                </View>
                <View style={[styles.badge, agent.isDefault ? styles.badgeSystem : styles.badgeCustom]}>
                  <Text style={[styles.badgeText, agent.isDefault ? styles.badgeTextSystem : styles.badgeTextCustom]}>
                    {agent.isDefault ? 'System' : 'Custom'}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardTitle}>{agent.name}</Text>
              <Text style={styles.cardRole}>{agent.role}</Text>
              <Text style={styles.cardDesc}>{agent.desc}</Text>
              
              {!agent.isDefault && (
                <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteAgent(agent.id)}>
                  <Trash2 size={16} color="#ef4444" style={{ marginRight: 4 }}/>
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {isAdding && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>+ Create Custom Agent</Text>
              <TouchableOpacity onPress={() => setIsAdding(false)}>
                <X color="#666" size={20} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Agent Name</Text>
              <TextInput style={styles.input} placeholder="e.g. Data Scientist" value={name} onChangeText={setName} />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Role</Text>
              <TextInput style={styles.input} placeholder="e.g. Analyst" value={role} onChangeText={setRole} />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>System Instructions / Description</Text>
              <TextInput 
                style={[styles.input, { height: 80 }]} 
                placeholder="What is this agent's purpose?" 
                value={desc} 
                onChangeText={setDesc} 
                multiline 
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
              <Text style={styles.saveBtnText}>Create Agent</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scrollContent: { padding: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 15, color: '#6b7280', marginBottom: 24 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 24 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, outlineStyle: 'none' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: { width: 'calc(33.333% - 11px)', minWidth: 260, backgroundColor: '#fff', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  iconWrapper: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeSystem: { backgroundColor: '#f3f4f6' },
  badgeCustom: { backgroundColor: '#dcfce7' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  badgeTextSystem: { color: '#4b5563' },
  badgeTextCustom: { color: '#166534' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 },
  cardRole: { fontSize: 12, color: '#6b7280', fontWeight: '500', marginBottom: 8 },
  cardDesc: { fontSize: 14, color: '#4b5563', marginBottom: 16, minHeight: 40 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 6, backgroundColor: '#fee2e2' },
  deleteBtnText: { color: '#ef4444', fontSize: 13, fontWeight: '500' },
  
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', width: 450, borderRadius: 12, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, padding: 10, fontSize: 14, backgroundColor: '#fff', outlineStyle: 'none' },
  saveBtn: { backgroundColor: '#111827', padding: 12, borderRadius: 6, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '500' }
});