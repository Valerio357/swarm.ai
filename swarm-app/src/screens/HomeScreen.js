import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Send, Square, Cpu, Network, Zap, CheckCircle2 } from 'lucide-react-native';
import { useStore } from '../store/useStore';
import Markdown from 'react-native-markdown-display';

export default function HomeScreen() {
  const { apiKeys, selectedProvider, selectedModel, chatHistory, activeChatId, addMessageToActiveChat, updateLastMessageInActiveChat, extensions, agents } = useStore();
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const abortControllerRef = useRef(null);
  const scrollViewRef = useRef();

  const activeChat = chatHistory.find(c => c.id === activeChatId) || { messages: [{ role: 'system', content: 'Swarm Orchestrator ready.' }] };

  const buildOrchestratorPrompt = () => {
    const agentList = agents.map(a => `- **${a.name}** (${a.role}): ${a.desc}`).join('\n');
    const extList = extensions.map(e => `${e.name} (${e.endpoint})`).join(', ');
    
    return `You are Swarm AI, an intelligent multi-agent orchestrator.
Your job is to analyze the user's request and decide whether you can answer it directly OR if it requires specialized agents.

Available Agents:
${agentList || 'None available.'}

Available MCP Servers: ${extList || 'None.'}

If you can answer directly, just write your response in Markdown.
If you need to assign tasks to agents, you MUST delegate by writing XML tags like this (and you can write multiple if needed):
<delegate agent="Agent Name">Specific instructions for this agent to complete their part of the task.</delegate>

IMPORTANT: If you delegate, ONLY output the <delegate> tags. Do not write anything else.`;
  };

  const buildAgentPrompt = (agentName, instructions, previousOutputs) => {
    const agent = agents.find(a => a.name === agentName) || { role: 'Specialist', desc: 'Expert' };
    let context = previousOutputs ? `\n\nContext from other agents:\n${previousOutputs}` : '';
    
    return `You are the "${agentName}" agent. Your role is: ${agent.role}.
Description: ${agent.desc}.

The Orchestrator has assigned you the following specific task:
${instructions}
${context}

Provide your output directly in Markdown format. Be highly professional and detailed.`;
  };

  const streamFromAPI = async (systemPrompt, userPrompt, history, onChunk) => {
    const key = apiKeys[selectedProvider];
    const model = selectedModel || (selectedProvider === 'openai' ? 'gpt-4o' : selectedProvider === 'gemini' ? 'gemini-1.5-pro' : 'claude-3-5-sonnet-20240620');
    
    if (!key) {
      onChunk(`Error: No API key found for ${selectedProvider}. Please add it in Settings.`);
      return '';
    }

    let fullText = '';
    
    try {
      if (selectedProvider === 'openai') {
        const openaiMessages = history.filter(m => m.role !== 'system' || m === history[0]).map(m => ({
          role: m.role === 'system' ? 'assistant' : m.role,
          content: m.content
        }));
        
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
          signal: abortControllerRef.current.signal,
          body: JSON.stringify({
            model: model,
            stream: true,
            messages: [{ role: 'system', content: systemPrompt }, ...openaiMessages, { role: 'user', content: userPrompt }]
          })
        });

        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim() !== '');
          for (const line of lines) {
            if (line === 'data: [DONE]') break;
            if (line.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(line.slice(6));
                const text = parsed.choices[0]?.delta?.content || '';
                if (text) { fullText += text; onChunk(text); }
              } catch (e) {}
            }
          }
        }
      } else if (selectedProvider === 'gemini') {
        const geminiHistory = history.filter(m => m.role !== 'system').map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content || ' ' }]
        }));

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: abortControllerRef.current.signal,
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [...geminiHistory, { role: 'user', parts: [{ text: userPrompt }] }]
          })
        });
        
        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim() !== '');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(line.slice(6));
                const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
                if (text) { fullText += text; onChunk(text); }
              } catch (e) {}
            }
          }
        }
      } else {
        const text = `[Anthropic Mock] Running on ${model}. Request received.`;
        for (let i = 0; i < text.length; i++) {
           fullText += text[i];
           onChunk(text[i]);
           await new Promise(r => setTimeout(r, 20));
           if (abortControllerRef.current?.signal.aborted) break;
        }
      }
    } catch (e) {
      if (e.name !== 'AbortError') onChunk(`\n\nAPI Error: ${e.message}`);
    }
    return fullText;
  };

  const handleSend = async () => {
    if (!prompt) return;
    const currentPrompt = prompt;
    
    addMessageToActiveChat({ role: 'user', content: currentPrompt });
    setPrompt('');
    setIsProcessing(true);
    
    const historyToPass = [...activeChat.messages, { role: 'user', content: currentPrompt }];
    abortControllerRef.current = new AbortController();
    
    // 1. Initialize message with empty delegations
    addMessageToActiveChat({ role: 'system', content: '', delegations: [], currentAgent: 'Orchestrator' });
    
    // 2. Call Orchestrator
    const orchestratorOutput = await streamFromAPI(buildOrchestratorPrompt(), currentPrompt, historyToPass, (chunk) => {
       // We stream into memory first, won't show it as direct output if it contains XML, but for simplicity we stream it anyway.
       // However, to prevent showing raw XML, we only append it if it doesn't look like delegation yet.
    });

    const delegates = [];
    const regex = /<delegate\s+agent=["']([^"']+)["']>([\s\S]*?)<\/delegate>/g;
    let match;
    while ((match = regex.exec(orchestratorOutput)) !== null) {
      delegates.push({ agent: match[1], task: match[2].trim(), status: 'pending' });
    }

    if (delegates.length > 0) {
      // It decided to delegate! Update UI to show Orchestration Plan.
      updateLastMessageInActiveChat({ content: '', delegations: delegates, currentAgent: 'Orchestrating' });

      let previousOutputs = '';
      
      // 3. Execute each agent sequentially
      for (let i = 0; i < delegates.length; i++) {
         if (abortControllerRef.current?.signal.aborted) break;
         
         const del = delegates[i];
         // Mark current agent as running
         const updatedDelegates = [...delegates];
         updatedDelegates[i].status = 'running';
         updateLastMessageInActiveChat({ delegations: updatedDelegates, currentAgent: del.agent });

         // Add a visual separator if not the first agent
         if (i > 0) {
            updateLastMessageInActiveChat('\n\n---\n\n');
         }

         const agentSystemPrompt = buildAgentPrompt(del.agent, del.task, previousOutputs);
         const agentOutput = await streamFromAPI(agentSystemPrompt, currentPrompt, historyToPass, (chunk) => {
            updateLastMessageInActiveChat(chunk);
         });

         previousOutputs += `\nOutput from ${del.agent}:\n${agentOutput}`;
         
         // Mark agent as done
         updatedDelegates[i].status = 'done';
         updateLastMessageInActiveChat({ delegations: updatedDelegates });
      }
      
      updateLastMessageInActiveChat({ currentAgent: null });
    } else {
      // Direct answer, just show it
      updateLastMessageInActiveChat({ content: orchestratorOutput, currentAgent: null });
    }
    
    setIsProcessing(false);
    abortControllerRef.current = null;
  };

  const handleStop = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setIsProcessing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.chatArea}>
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messages} 
          contentContainerStyle={{ padding: 16 }}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {activeChat.messages.map((msg, i) => {
            if (msg.role === 'user') {
              return (
                <View key={i} style={[styles.messageBubble, styles.userBubble]}>
                  <Text style={styles.userText}>{msg.content}</Text>
                </View>
              );
            }

            return (
              <View key={i} style={{ marginBottom: 12 }}>
                {msg.delegations && msg.delegations.length > 0 && (
                  <View style={styles.orchestratorCard}>
                    <View style={styles.orchestratorHeader}>
                      <Network size={16} color="#6366f1" />
                      <Text style={styles.orchestratorTitle}>Swarm Active</Text>
                    </View>
                    <View style={styles.orchestratorSteps}>
                      {msg.delegations.map((del, idx) => (
                        <View key={idx} style={styles.agentStep}>
                          {del.status === 'done' ? (
                            <CheckCircle2 size={16} color="#10b981" />
                          ) : del.status === 'running' ? (
                            <Zap size={16} color="#eab308" />
                          ) : (
                            <View style={styles.pendingDot} />
                          )}
                          <View style={{ marginLeft: 10, flex: 1 }}>
                            <Text style={[styles.agentName, del.status === 'running' && { color: '#eab308' }]}>
                              {del.agent}
                            </Text>
                            <Text style={styles.agentTask}>{del.task}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                
                {msg.content ? (
                  <View style={[styles.messageBubble, styles.systemBubble]}>
                    <Markdown style={markdownStyles}>{msg.content}</Markdown>
                  </View>
                ) : null}

                {msg.currentAgent === 'Orchestrating' && (
                  <View style={styles.typingIndicatorContainer}>
                    <Text style={styles.typingText}>Orchestrator planning tasks...</Text>
                  </View>
                )}
                
                {msg.currentAgent && msg.currentAgent !== 'Orchestrating' && (
                  <View style={styles.typingIndicatorContainer}>
                    <Text style={styles.typingText}>{msg.currentAgent} is typing...</Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="E.g., Make a presentation about carbonara..."
              placeholderTextColor="#9ca3af"
              value={prompt}
              onChangeText={setPrompt}
              onSubmitEditing={handleSend}
            />
            {isProcessing ? (
              <TouchableOpacity style={[styles.sendBtn, { backgroundColor: '#ef4444' }]} onPress={handleStop}>
                <Square size={16} color="#fff" fill="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.sendBtn, !prompt && { opacity: 0.5 }]} onPress={handleSend} disabled={!prompt}>
                <Send size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const markdownStyles = {
  body: { color: '#1e293b', fontSize: 15, lineHeight: 24 },
  heading1: { fontSize: 22, fontWeight: 'bold', marginTop: 10, marginBottom: 5 },
  heading2: { fontSize: 20, fontWeight: 'bold', marginTop: 10, marginBottom: 5 },
  heading3: { fontSize: 18, fontWeight: 'bold', marginTop: 10, marginBottom: 5 },
  paragraph: { marginTop: 0, marginBottom: 10 },
  strong: { fontWeight: 'bold' },
  em: { fontStyle: 'italic' },
  code_inline: { backgroundColor: '#e2e8f0', padding: 3, borderRadius: 4, fontFamily: 'monospace', color: '#ef4444' },
  code_block: { backgroundColor: '#0f172a', color: '#f8fafc', padding: 12, borderRadius: 8, fontFamily: 'monospace', marginBottom: 10 },
  fence: { backgroundColor: '#0f172a', color: '#f8fafc', padding: 12, borderRadius: 8, fontFamily: 'monospace', marginBottom: 10 },
  bullet_list: { marginBottom: 10 },
  ordered_list: { marginBottom: 10 },
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  chatArea: { flex: 1, backgroundColor: '#fff' },
  messages: { flex: 1 },
  messageBubble: { padding: 14, borderRadius: 12, marginBottom: 12, maxWidth: '85%' },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#2563eb', borderBottomRightRadius: 4 },
  systemBubble: { alignSelf: 'flex-start', backgroundColor: '#f8fafc', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' },
  userText: { color: '#fff', fontSize: 15, lineHeight: 22 },
  inputContainer: { padding: 16, borderTopWidth: 1, borderColor: '#f3f4f6' },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 24, paddingLeft: 16, paddingRight: 6, paddingVertical: 6 },
  input: { flex: 1, height: 40, fontSize: 15, color: '#111827', outlineStyle: 'none' },
  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  
  orchestratorCard: { backgroundColor: '#faf5ff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e9d5ff', alignSelf: 'flex-start', minWidth: 280, maxWidth: '85%', marginBottom: 12, shadowColor: '#c084fc', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  orchestratorHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderColor: '#e9d5ff', paddingBottom: 8 },
  orchestratorTitle: { fontSize: 13, fontWeight: '800', color: '#7e22ce', marginLeft: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  orchestratorSteps: { gap: 12 },
  agentStep: { flexDirection: 'row', alignItems: 'flex-start' },
  pendingDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#cbd5e1', backgroundColor: '#f1f5f9' },
  agentName: { fontSize: 14, fontWeight: '700', color: '#334155', marginBottom: 2 },
  agentTask: { fontSize: 13, color: '#64748b', lineHeight: 18 },
  
  typingIndicatorContainer: { alignSelf: 'flex-start', marginLeft: 4, marginTop: 4, marginBottom: 12 },
  typingText: { fontSize: 13, color: '#94a3b8', fontStyle: 'italic', fontWeight: '500' }
});