import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Settings, Play, Plus, X } from 'lucide-react-native';
import { useStore } from '../store/useStore';

export default function WorkflowsScreen() {
  const { workflows, addWorkflow, toggleWorkflow } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const handleAdd = () => {
    if (name && desc) {
      addWorkflow({ name, desc, active: false });
      setName(''); setDesc(''); setIsAdding(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Workflows</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setIsAdding(true)}>
            <Plus size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.addBtnText}>Create Workflow</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Define complex, multi-agent instructions to complete large tasks autonomously.</Text>

        {workflows.map((wf) => (
          <View key={wf.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{wf.name}</Text>
                <Text style={styles.cardDesc}>{wf.desc}</Text>
              </View>
              <TouchableOpacity style={styles.playBtn} onPress={() => toggleWorkflow(wf.id)}>
                <Play size={16} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.cardFooter}>
              <View style={[styles.statusBadge, wf.active ? styles.statusActive : styles.statusInactive]}>
                <Text style={[styles.statusText, wf.active ? styles.statusTextActive : styles.statusTextInactive]}>
                  {wf.active ? 'Active' : 'Draft'}
                </Text>
              </View>
              <TouchableOpacity>
                <Settings size={18} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {isAdding && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>+ Create Workflow</Text>
              <TouchableOpacity onPress={() => setIsAdding(false)}>
                <X color="#666" size={20} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Workflow Name</Text>
              <TextInput style={styles.input} placeholder="e.g. Content Publisher" value={name} onChangeText={setName} />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Instructions</Text>
              <TextInput 
                style={[styles.input, { height: 80 }]} 
                placeholder="Describe the steps agents should take..." 
                value={desc} 
                onChangeText={setDesc} 
                multiline 
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
              <Text style={styles.saveBtnText}>Save</Text>
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
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  cardDesc: { fontSize: 14, color: '#6b7280', paddingRight: 16 },
  playBtn: { backgroundColor: '#2563eb', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderColor: '#f3f4f6' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusActive: { backgroundColor: '#dcfce7' },
  statusInactive: { backgroundColor: '#f3f4f6' },
  statusText: { fontSize: 12, fontWeight: '600' },
  statusTextActive: { color: '#166534' },
  statusTextInactive: { color: '#4b5563' },

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