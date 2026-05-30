import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useStore } from '../store/useStore';
import { X } from 'lucide-react-native';

export default function ExtensionsScreen() {
  const { extensions, addExtension } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  
  const [name, setName] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [timeout, setTimeoutVal] = useState('300');
  const [desc, setDesc] = useState('');

  const handleAdd = () => {
    if (name && endpoint) {
      addExtension({ name, endpoint, timeout, desc });
      setName(''); setEndpoint(''); setDesc(''); setIsAdding(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>MCP Servers (Extensions)</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setIsAdding(true)}>
            <Text style={styles.addBtnText}>+ Add Extension</Text>
          </TouchableOpacity>
        </View>

        {extensions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No MCP extensions installed yet.</Text>
          </View>
        ) : (
          extensions.map((ext, i) => (
            <View key={i} style={styles.extCard}>
              <View>
                <Text style={styles.extName}>{ext.name}</Text>
                <Text style={styles.extDesc}>{ext.desc || ext.endpoint}</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>HTTP</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal Overlay for Adding Extension */}
      {isAdding && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>+ Add custom extension</Text>
              <TouchableOpacity onPress={() => setIsAdding(false)}>
                <X color="#666" size={20} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formRow}>
              <View style={styles.formGroupHalf}>
                <Text style={styles.label}>Extension Name</Text>
                <TextInput style={styles.input} placeholder="Enter extension name..." value={name} onChangeText={setName} />
              </View>
              <View style={styles.formGroupHalf}>
                <Text style={styles.label}>Type</Text>
                <TextInput style={[styles.input, { backgroundColor: '#f3f4f6', color: '#6b7280' }]} value="HTTP" editable={false} />
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput style={styles.input} placeholder="Optional description..." value={desc} onChangeText={setDesc} />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Endpoint</Text>
              <TextInput style={styles.input} placeholder="Enter endpoint URL..." value={endpoint} onChangeText={setEndpoint} />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Timeout</Text>
              <TextInput style={styles.input} placeholder="300" value={timeout} onChangeText={setTimeoutVal} keyboardType="numeric" />
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: '#111827' },
  addBtn: { backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  addBtnText: { color: '#fff', fontWeight: '500' },
  emptyState: { padding: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', borderStyle: 'dashed' },
  emptyText: { color: '#6b7280', fontSize: 15 },
  extCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, marginBottom: 12 },
  extName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  extDesc: { color: '#6b7280', marginTop: 4, fontSize: 14 },
  badge: { backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 12, color: '#4b5563', fontWeight: '500' },
  
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', width: 500, borderRadius: 12, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  formRow: { flexDirection: 'row', gap: 16 },
  formGroupHalf: { flex: 1, marginBottom: 16 },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, padding: 10, fontSize: 14, backgroundColor: '#fff', outlineStyle: 'none' },
  saveBtn: { backgroundColor: '#111827', padding: 12, borderRadius: 6, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '500' }
});