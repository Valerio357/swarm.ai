import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Calendar, Clock, Plus, X } from 'lucide-react-native';
import { useStore } from '../store/useStore';

export default function ScheduledTasksScreen() {
  const { scheduledTasks, addTask } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [schedule, setSchedule] = useState('');

  const handleAdd = () => {
    if (name && schedule) {
      addTask({ name, schedule, nextRun: 'Pending' });
      setName(''); setSchedule(''); setIsAdding(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Scheduled Tasks</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setIsAdding(true)}>
            <Plus size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.addBtnText}>Schedule Task</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Automate your agents to run tasks periodically (Cron jobs).</Text>

        {scheduledTasks.map((task) => (
          <View key={task.id} style={styles.card}>
            <View style={styles.cardIcon}>
              <Calendar size={24} color="#4f46e5" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{task.name}</Text>
              <View style={styles.row}>
                <Clock size={14} color="#6b7280" style={{ marginRight: 6 }} />
                <Text style={styles.cardDesc}>{task.schedule}</Text>
              </View>
            </View>
            <View style={styles.nextRunBadge}>
              <Text style={styles.nextRunText}>Next: {task.nextRun}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {isAdding && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>+ Schedule Task</Text>
              <TouchableOpacity onPress={() => setIsAdding(false)}>
                <X color="#666" size={20} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Task Name</Text>
              <TextInput style={styles.input} placeholder="e.g. Daily Report" value={name} onChangeText={setName} />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Schedule (Cron or Text)</Text>
              <TextInput style={styles.input} placeholder="e.g. Every day at 08:00 AM" value={schedule} onChangeText={setSchedule} />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
              <Text style={styles.saveBtnText}>Schedule</Text>
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
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12 },
  cardIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center' },
  cardDesc: { fontSize: 13, color: '#6b7280' },
  nextRunBadge: { backgroundColor: '#f3f4f6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  nextRunText: { fontSize: 12, fontWeight: '500', color: '#4b5563' },

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