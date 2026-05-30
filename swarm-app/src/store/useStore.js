import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useStore = create(
  persist(
    (set, get) => ({
  activeTab: 'Home',
  setActiveTab: (tab) => set({ activeTab: tab }),

  apiKeys: {
    gemini: '',
    openai: '',
    claude: '',
  },
  setApiKey: (provider, key) =>
    set((state) => ({ apiKeys: { ...state.apiKeys, [provider]: key } })),

  selectedProvider: 'openai',
  setSelectedProvider: (provider) => set({ selectedProvider: provider }),

  selectedModel: '',
  setSelectedModel: (model) => set({ selectedModel: model }),

  availableModels: {
    openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    claude: ['claude-3-5-sonnet-20240620', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
    gemini: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
  },
  
  fetchModelsForProvider: async (provider) => {
    const state = get();
    const key = state.apiKeys[provider];
    if (!key) return; // Need key to fetch models

    try {
      if (provider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${key}` }
        });
        const data = await res.json();
        if (data.data) {
          const models = data.data.map(m => m.id).filter(id => id.includes('gpt'));
          set((s) => ({ availableModels: { ...s.availableModels, openai: models } }));
        }
      } else if (provider === 'gemini') {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await res.json();
        if (data.models) {
          const models = data.models.map(m => m.name.replace('models/', ''));
          set((s) => ({ availableModels: { ...s.availableModels, gemini: models } }));
        }
      }
      // Claude standard models endpoint usually requires backend, so we fallback to defaults.
    } catch (error) {
      console.warn("Failed to fetch models for", provider, error);
    }
  },

  extensions: [],
  addExtension: (ext) => set((state) => ({ extensions: [...state.extensions, ext] })),

  skills: [
    { id: '1', name: 'File System (FS)', desc: 'Read, write, and list files in your local directory.', installed: true },
    { id: '2', name: 'Web Browser', desc: 'Allows agents to search the web and scrape pages.', installed: true },
    { id: '3', name: 'Github Integration', desc: 'Create PRs, read issues, and commit code.', installed: false },
    { id: '4', name: 'PowerPoint Generator', desc: 'Build .pptx files programmatically.', installed: false },
  ],
  toggleSkill: (id) => set((state) => ({
    skills: state.skills.map(s => s.id === id ? { ...s, installed: !s.installed } : s)
  })),
  addSkill: (skill) => set((state) => ({ skills: [...state.skills, { ...skill, id: Date.now().toString() }] })),

  workflows: [
    { id: '1', name: 'Research Paper Generator', desc: 'Spawns Researcher, Writer, and Reviewer to draft a paper.', active: true },
    { id: '2', name: 'Code Review & Refactor', desc: 'Analyzes a repository, identifies bugs, and opens a PR.', active: false },
    { id: '3', name: 'Social Media Manager', desc: 'Creates 5 weekly posts and schedules them.', active: true },
  ],
  toggleWorkflow: (id) => set((state) => ({
    workflows: state.workflows.map(w => w.id === id ? { ...w, active: !w.active } : w)
  })),
  addWorkflow: (workflow) => set((state) => ({ workflows: [...state.workflows, { ...workflow, id: Date.now().toString() }] })),

  scheduledTasks: [
    { id: '1', name: 'Morning Briefing', schedule: 'Every day at 08:00 AM', nextRun: 'Tomorrow 08:00 AM' },
    { id: '2', name: 'Weekly System Audit', schedule: 'Every Sunday at 02:00 AM', nextRun: 'Sun 02:00 AM' },
  ],
  addTask: (task) => set((state) => ({ scheduledTasks: [...state.scheduledTasks, { ...task, id: Date.now().toString() }] })),

  chatHistory: [],
  activeChatId: null,
  startNewChat: () => set((state) => {
    const newId = Date.now().toString();
    return {
      activeTab: 'Home',
      activeChatId: newId,
      chatHistory: [{ id: newId, title: 'New Chat', messages: [{ role: 'system', content: 'Swarm Orchestrator ready.' }] }, ...state.chatHistory]
    }
  }),
  setActiveChat: (id) => set((state) => ({ activeChatId: id, activeTab: id ? 'Home' : state.activeTab })),
  deleteChat: (id) => set((state) => ({ 
    chatHistory: state.chatHistory.filter(c => c.id !== id),
    activeChatId: state.activeChatId === id ? null : state.activeChatId
  })),
  addMessageToActiveChat: (message) => set((state) => {
    if (!state.activeChatId) {
       const newId = Date.now().toString();
       const title = message.content.substring(0, 20) + (message.content.length > 20 ? '...' : '');
       return {
         activeChatId: newId,
         chatHistory: [{ id: newId, title, messages: [{ role: 'system', content: 'Swarm Orchestrator ready.' }, message] }, ...state.chatHistory]
       }
    }
    return {
      chatHistory: state.chatHistory.map(chat => {
        if (chat.id === state.activeChatId) {
          // Update title if it's the first user message
          let newTitle = chat.title;
          if (chat.messages.length === 1 && message.role === 'user') {
            newTitle = message.content.substring(0, 20) + (message.content.length > 20 ? '...' : '');
          }
          return { ...chat, title: newTitle, messages: [...chat.messages, message] };
        }
        return chat;
      })
    }
  }),
  updateLastMessageInActiveChat: (updates) => set((state) => {
    if (!state.activeChatId) return state;
    return {
      chatHistory: state.chatHistory.map(chat => {
        if (chat.id === state.activeChatId && chat.messages.length > 0) {
          const newMessages = [...chat.messages];
          const lastIndex = newMessages.length - 1;
          
          if (typeof updates === 'string') {
            newMessages[lastIndex] = { ...newMessages[lastIndex], content: (newMessages[lastIndex].content || '') + updates };
          } else {
            newMessages[lastIndex] = { ...newMessages[lastIndex], ...updates };
          }
          return { ...chat, messages: newMessages };
        }
        return chat;
      })
    };
  }),

  agents: [
    { id: 'default-1', name: 'Researcher', desc: 'Gathers data and browses the web.', role: 'System', isDefault: true },
    { id: 'default-2', name: 'Writer', desc: 'Formats and writes content based on data.', role: 'System', isDefault: true },
    { id: 'default-3', name: 'Reviewer', desc: 'Validates outputs and checks for errors.', role: 'System', isDefault: true },
    { id: 'default-4', name: 'Tools Engine', desc: 'Executes scripts and file operations.', role: 'System', isDefault: true },
  ],
  addAgent: (agent) => set((state) => ({ agents: [...state.agents, { ...agent, id: Date.now().toString(), isDefault: false }] })),
  deleteAgent: (id) => set((state) => ({ agents: state.agents.filter(a => a.id !== id || a.isDefault) })),

  swarm: {
    orchestrator: { id: 'orch', name: 'Orchestrator', status: 'idle' },
    agents: [],
    tasks: [],
    particles: []
  },
  updateSwarm: (newState) => set((state) => ({ swarm: { ...state.swarm, ...newState } })),
}),
    {
      name: 'swarm-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        apiKeys: state.apiKeys, 
        selectedProvider: state.selectedProvider, 
        selectedModel: state.selectedModel,
        extensions: state.extensions,
        skills: state.skills,
        workflows: state.workflows,
        scheduledTasks: state.scheduledTasks,
        chatHistory: state.chatHistory,
        agents: state.agents
      }),
    }
  )
);