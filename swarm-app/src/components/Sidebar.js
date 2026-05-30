import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { Home, MessageSquarePlus, Server, Settings, Wrench, GitFork, Calendar, Users, MessageCircle, Trash2, Search } from 'lucide-react-native';
import { useStore } from '../store/useStore';

export default function Sidebar() {
  const { activeTab, setActiveTab, chatHistory, setActiveChat, startNewChat, activeChatId, deleteChat } = useStore();
  const [searchQuery, setSearchQuery] = useState('');

  const menuItems = [
    { id: 'Home', icon: Home, label: 'Home' },
    { id: 'Agents', icon: Users, label: 'Agents' },
    { id: 'MCP', icon: Server, label: 'MCP Servers' },
    { id: 'Skills', icon: Wrench, label: 'Skills' },
    { id: 'Workflows', icon: GitFork, label: 'Workflows' },
    { id: 'Tasks', icon: Calendar, label: 'Scheduled Tasks' },
    { id: 'Settings', icon: Settings, label: 'Settings' },
  ];

  const filteredHistory = chatHistory.filter(chat => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    const titleMatch = chat.title?.toLowerCase().includes(lowerQuery);
    const contentMatch = chat.messages?.some(m => m.content?.toLowerCase().includes(lowerQuery));
    return titleMatch || contentMatch;
  });

  return (
    <View style={styles.sidebar}>
      <Text style={styles.logo}>Swarm AI</Text>
      
      <TouchableOpacity style={styles.newChatBtn} onPress={startNewChat}>
        <MessageSquarePlus size={18} color="#fff" />
        <Text style={styles.newChatText}>Start New Chat</Text>
      </TouchableOpacity>

      <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.menuSection}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            // Home is active if activeTab is Home AND we are not deep in an old chat, or if Home is just selected
            const isActive = activeTab === item.id && (item.id !== 'Home' || !activeChatId || chatHistory.length === 0 || activeChatId === chatHistory[0]?.id);
            return (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.menuItem, isActive && styles.activeItem]}
                onPress={() => { setActiveTab(item.id); if (item.id !== 'Home') setActiveChat(null); }}
                activeOpacity={0.7}
              >
                <Icon size={20} color={isActive ? '#000' : '#666'} />
                <Text style={[styles.menuLabel, isActive && styles.activeLabel]}>{item.label}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent Chats</Text>
          
          <View style={styles.searchBar}>
            <Search size={14} color="#9ca3af" />
            <TextInput 
              style={styles.searchInput} 
              placeholder="Search chats..." 
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9ca3af"
            />
          </View>

          {filteredHistory.map((chat) => (
            <View key={chat.id} style={[styles.historyItemWrapper, activeChatId === chat.id && styles.activeHistoryItem]}>
              <TouchableOpacity 
                style={styles.historyItem}
                onPress={() => setActiveChat(chat.id)}
                activeOpacity={0.7}
              >
                <MessageCircle size={16} color={activeChatId === chat.id ? '#2563eb' : '#6b7280'} />
                <Text style={[styles.historyLabel, activeChatId === chat.id && styles.activeHistoryLabel]} numberOfLines={1}>
                  {chat.title}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteChat(chat.id)} style={styles.deleteBtn} activeOpacity={0.7}>
                <Trash2 size={14} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
          {filteredHistory.length === 0 && searchQuery !== '' && (
             <Text style={styles.noResultsText}>No chats found.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: { width: 260, backgroundColor: '#f9fafb', borderRightWidth: 1, borderColor: '#e5e7eb', paddingTop: 40, height: '100%' },
  logo: { fontSize: 24, fontWeight: '800', marginBottom: 20, color: '#111827', paddingHorizontal: 20, letterSpacing: -0.5 },
  newChatBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563eb', marginHorizontal: 16, padding: 12, borderRadius: 8, marginBottom: 20, justifyContent: 'center' },
  newChatText: { color: '#fff', fontWeight: '600', marginLeft: 8 },
  menuScroll: { flex: 1 },
  menuSection: { paddingHorizontal: 12, paddingBottom: 16, borderBottomWidth: 1, borderColor: '#e5e7eb' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginBottom: 4 },
  activeItem: { backgroundColor: '#e5e7eb' },
  menuLabel: { marginLeft: 14, fontSize: 14, color: '#4b5563', fontWeight: '500' },
  activeLabel: { color: '#111827', fontWeight: '600' },
  historySection: { paddingHorizontal: 12, paddingTop: 16, paddingBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 12, paddingHorizontal: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6, marginBottom: 12, marginHorizontal: 4 },
  searchInput: { flex: 1, marginLeft: 6, fontSize: 13, outlineStyle: 'none', color: '#111827' },
  historyItemWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 2 },
  activeHistoryItem: { backgroundColor: '#eff6ff' },
  historyItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  historyLabel: { marginLeft: 10, fontSize: 13, color: '#4b5563', flex: 1 },
  activeHistoryLabel: { color: '#1d4ed8', fontWeight: '500' },
  deleteBtn: { padding: 4 },
  noResultsText: { fontSize: 13, color: '#9ca3af', textAlign: 'center', marginTop: 12 }
});