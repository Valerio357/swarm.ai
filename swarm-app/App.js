import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Sidebar from './src/components/Sidebar';
import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ExtensionsScreen from './src/screens/ExtensionsScreen';
import SkillsScreen from './src/screens/SkillsScreen';
import WorkflowsScreen from './src/screens/WorkflowsScreen';
import ScheduledTasksScreen from './src/screens/ScheduledTasksScreen';
import AgentsScreen from './src/screens/AgentsScreen';
import { useStore } from './src/store/useStore';

export default function App() {
  const activeTab = useStore((state) => state.activeTab);

  const renderContent = () => {
    switch (activeTab) {
      case 'Home':
        return <HomeScreen />;
      case 'Agents':
        return <AgentsScreen />;
      case 'Settings':
        return <SettingsScreen />;
      case 'MCP':
        return <ExtensionsScreen />;
      case 'Skills':
        return <SkillsScreen />;
      case 'Workflows':
        return <WorkflowsScreen />;
      case 'Tasks':
        return <ScheduledTasksScreen />;
      default:
        return (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderTitle}>{activeTab}</Text>
            <Text style={styles.placeholderText}>This section is coming soon.</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <Sidebar />
      <View style={styles.main}>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#fff', overflow: 'hidden' },
  main: { flex: 1 },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' },
  placeholderTitle: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 8 },
  placeholderText: { fontSize: 15, color: '#6b7280' }
});