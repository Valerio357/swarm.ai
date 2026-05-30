import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Search, Wrench, Plus, X } from 'lucide-react-native';
import { useStore } from '../store/useStore';

export default function SkillsScreen() {
  const { skills, toggleSkill, addSkill } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const handleAdd = () => {
    if (name && desc) {
      addSkill({ name, desc, installed: true });
      setName(''); setDesc(''); setIsAdding(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Skills</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setIsAdding(true)}>
            <Plus size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.addBtnText}>Add Skill</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Equip your Swarm agents with specialized tools to perform tasks.</Text>

        <View style={styles.searchBar}>
          <Search size={18} color="#9ca3af" />
          <TextInput style={styles.searchInput} placeholder="Search available skills..." />
        </View>

        <View style={styles.grid}>
          {skills.map((skill) => (
            <View key={skill.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Wrench size={20} color="#374151" />
                <View style={[styles.badge, skill.installed ? styles.badgeInstalled : styles.badgeAvailable]}>
                  <Text style={[styles.badgeText, skill.installed ? styles.badgeTextInstalled : styles.badgeTextAvailable]}>
                    {skill.installed ? 'Installed' : 'Available'}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardTitle}>{skill.name}</Text>
              <Text style={styles.cardDesc}>{skill.desc}</Text>
              
              <TouchableOpacity 
                style={[styles.actionBtn, skill.installed ? styles.uninstallBtn : styles.installBtn]}
                onPress={() => toggleSkill(skill.id)}
              >
                <Text style={[styles.actionBtnText, skill.installed ? styles.uninstallBtnText : styles.installBtnText]}>
                  {skill.installed ? 'Configure' : 'Install'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {isAdding && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>+ Add Custom Skill</Text>
              <TouchableOpacity onPress={() => setIsAdding(false)}>
                <X color="#666" size={20} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Skill Name</Text>
              <TextInput style={styles.input} placeholder="e.g. Database Connector" value={name} onChangeText={setName} />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput 
                style={[styles.input, { height: 80 }]} 
                placeholder="What does this skill do?" 
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
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 24 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, outlineStyle: 'none' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: { width: 'calc(50% - 8px)', minWidth: 280, backgroundColor: '#fff', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeInstalled: { backgroundColor: '#dcfce7' },
  badgeAvailable: { backgroundColor: '#f3f4f6' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  badgeTextInstalled: { color: '#166534' },
  badgeTextAvailable: { color: '#4b5563' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 6 },
  cardDesc: { fontSize: 14, color: '#6b7280', marginBottom: 20, minHeight: 40 },
  actionBtn: { paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  installBtn: { backgroundColor: '#111827' },
  uninstallBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db' },
  actionBtnText: { fontSize: 14, fontWeight: '500' },
  installBtnText: { color: '#fff' },
  uninstallBtnText: { color: '#374151' },
  
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