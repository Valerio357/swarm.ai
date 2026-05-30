import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Send, Square, Network, Zap, CheckCircle2, ChevronDown, ChevronUp, Cpu } from 'lucide-react-native';
import { useStore } from '../store/useStore';
import Markdown from 'react-native-markdown-display';

// Sub-component for each sequential delegation step
const DelegationStep = ({ del, idx, isProcessing }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={styles.agentStepContainer}>
      <TouchableOpacity 
        style={[
          styles.agentStepHeader, 
          del.status === 'running' && styles.agentStepHeaderRunning,
          isOpen && styles.agentStepHeaderOpen
        ]} 
        onPress={() => del.output && setIsOpen(!isOpen)}
        activeOpacity={0.7}
        disabled={!del.output}
      >
        <View style={styles.stepStatusRow}>
          {del.status === 'done' ? (
            <CheckCircle2 size={16} color="#10b981" />
          ) : del.status === 'running' ? (
            <Zap size={16} color="#eab308" />
          ) : (
            <View style={styles.pendingDot} />
          )}
          <Text style={[styles.agentName, del.status === 'running' && { color: '#eab308' }]}>
            {del.agent}
          </Text>
        </View>
        
        <View style={styles.stepRightSide}>
          <Text style={styles.stepStatusText}>
            {del.status === 'done' ? 'Completed' : del.status === 'running' ? 'Active...' : 'Scheduled'}
          </Text>
          {del.output && (
            isOpen ? <ChevronUp size={16} color="#475569" /> : <ChevronDown size={16} color="#475569" />
          )}
        </View>
      </TouchableOpacity>

      {/* Accordion content: Agent output */}
      {isOpen && del.output && (
        <View style={styles.agentOutputArea}>
          <Text style={styles.subTaskLabel}>ASSIGNED TASK:</Text>
          <Text style={styles.subTaskText}>{del.task}</Text>
          
          <Text style={styles.agentContributionLabel}>AGENT CONTRIBUTION:</Text>
          <View style={styles.agentMarkdownContainer}>
            <Markdown style={agentMarkdownStyles}>{del.output}</Markdown>
          </View>
        </View>
      )}
    </View>
  );
};

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
Your job is to analyze the user's request and decide whether you can answer it directly OR if it requires a sequence of specialized agents.

Available Agents:
${agentList || 'None available.'}

Available MCP Servers: ${extList || 'None.'}

If you can answer directly, just write your response in Markdown.
If you need to assign tasks to agents, you MUST plan the sequence and write XML tags like this:
<delegate agent="Agent Name">Specific instructions for this agent to complete their part of the task.</delegate>

IMPORTANT: If you delegate, ONLY output the <delegate> tags. Do not write anything else. Plan sequentially in logical order.`;
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

  const buildSynthesisPrompt = (userPrompt, previousOutputs) => {
    return `You are Swarm AI, the lead Orchestrator. 
Your specialized agents have successfully run sequentially and produced the following contributions to solve the user's prompt:

---
${previousOutputs}
---

Now, your task is to synthesize all of their work into one beautiful, complete, unified response that solves the user's request: "${userPrompt}". 
Remove duplicates, ensure flawless cohesive style, format beautifully in Markdown, and present the final outcome to the user.`;
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
        const text = `[Anthropic Mock] Running on ${model}.\n<thinking>Delegating to Researcher...</thinking>\nHere is your response.`;
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
    
    // Initialize message
    addMessageToActiveChat({ role: 'system', content: '', delegations: [], currentAgent: 'Orchestrator' });
    
    // 1. Ask Orchestrator for decomposition
    const orchestratorOutput = await streamFromAPI(buildOrchestratorPrompt(), currentPrompt, historyToPass, () => {});

    const delegates = [];
    const regex = /<delegate\s+agent=["']([^"']+)["']>([\s\S]*?)<\/delegate>/g;
    let match;
    while ((match = regex.exec(orchestratorOutput)) !== null) {
      delegates.push({ agent: match[1], task: match[2].trim(), status: 'pending', output: '' });
    }

    if (delegates.length > 0) {
      // Setup the sequential plan in UI
      updateLastMessageInActiveChat({ delegations: delegates, currentAgent: 'Orchestrator' });

      let previousOutputs = '';
      
      // 2. Loop and run each agent sequentially
      for (let i = 0; i < delegates.length; i++) {
         if (abortControllerRef.current?.signal.aborted) break;
         
         const del = delegates[i];
         const updatedDelegates = [...delegates];
         updatedDelegates[i].status = 'running';
         updateLastMessageInActiveChat({ delegations: updatedDelegates, currentAgent: del.agent });

         let currentAgentOutput = '';
         const agentSystemPrompt = buildAgentPrompt(del.agent, del.task, previousOutputs);
         
         // Stream agent output inside its isolated sub-task
         await streamFromAPI(agentSystemPrompt, currentPrompt, historyToPass, (chunk) => {
            currentAgentOutput += chunk;
            updatedDelegates[i].output = currentAgentOutput;
            updateLastMessageInActiveChat({ delegations: [...updatedDelegates] });
         });

         previousOutputs += `\n\n### Contribution from ${del.agent}:\n${currentAgentOutput}`;
         
         updatedDelegates[i].status = 'done';
         updateLastMessageInActiveChat({ delegations: updatedDelegates });
      }

      // 3. Final synthesis call
      if (!abortControllerRef.current?.signal.aborted) {
         updateLastMessageInActiveChat({ currentAgent: 'Synthesizing Response' });
         await streamFromAPI(buildSynthesisPrompt(currentPrompt, previousOutputs), currentPrompt, historyToPass, (chunk) => {
            updateLastMessageInActiveChat(chunk); // Stream directly into main chat box
         });
      }
      
      updateLastMessageInActiveChat({ currentAgent: null });
    } else {
      // Direct response, stream to user
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
                {/* Visualizer for Swarm Sequential Plan */}
                {msg.delegations && msg.delegations.length > 0 && (
                  <View style={styles.orchestratorCard}>
                    <View style={styles.orchestratorHeader}>
                      <Network size={16} color="#6366f1" />
                      <Text style={styles.orchestratorTitle}>Swarm Active</Text>
                    </View>
                    <View style={styles.orchestratorSteps}>
                      {msg.delegations.map((del, idx) => (
                        <DelegationStep key={idx} del={del} idx={idx} isProcessing={isProcessing} />
                      ))}
                    </View>
                  </View>
                )}
                
                {/* Main Final Output Bubble */}
                {msg.content ? (
                  <View style={[styles.messageBubble, styles.systemBubble]}>
                    <Markdown style={markdownStyles}>{msg.content}</Markdown>
                  </View>
                ) : null}

                {/* Subtitle Telemetry/Typing text */}
                {msg.currentAgent && (
                  <View style={styles.typingIndicatorContainer}>
                    <Zap size={14} color="#a855f7" style={{ marginRight: 6 }} />
                    <Text style={styles.typingText}>
                      {msg.currentAgent === 'Orchestrator' 
                        ? 'Orchestrator planning sequential sub-tasks...' 
                        : msg.currentAgent === 'Synthesizing Response' 
                        ? 'Synthesizing final response based on agent outputs...'
                        : `${msg.currentAgent} is actively executing task...`}
                    </Text>
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

const agentMarkdownStyles = {
  body: { color: '#475569', fontSize: 13, lineHeight: 20 },
  heading1: { fontSize: 16, fontWeight: 'bold', marginTop: 6, marginBottom: 4, color: '#1e293b' },
  heading2: { fontSize: 14, fontWeight: 'bold', marginTop: 6, marginBottom: 4, color: '#1e293b' },
  paragraph: { marginTop: 0, marginBottom: 6 },
  code_inline: { backgroundColor: '#f1f5f9', padding: 2, borderRadius: 4, fontFamily: 'monospace', color: '#ef4444', fontSize: 12 },
  code_block: { backgroundColor: '#0f172a', color: '#f8fafc', padding: 8, borderRadius: 6, fontFamily: 'monospace', marginBottom: 6 },
  fence: { backgroundColor: '#0f172a', color: '#f8fafc', padding: 8, borderRadius: 6, fontFamily: 'monospace', marginBottom: 6 },
};

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
  
  orchestratorCard: { backgroundColor: '#faf5ff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e9d5ff', alignSelf: 'flex-start', minWidth: 320, width: '100%', maxWidth: '85%', marginBottom: 12, shadowColor: '#c084fc', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  orchestratorHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderColor: '#e9d5ff', paddingBottom: 8 },
  orchestratorTitle: { fontSize: 13, fontWeight: '800', color: '#7e22ce', marginLeft: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  orchestratorSteps: { gap: 8 },
  
  agentStepContainer: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#f3e8ff', borderRadius: 8, overflow: 'hidden', marginBottom: 6 },
  agentStepHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#fdfbfd' },
  agentStepHeaderRunning: { backgroundColor: '#fefcf3', borderColor: '#fef08a' },
  agentStepHeaderOpen: { borderBottomWidth: 1, borderColor: '#f3e8ff' },
  stepStatusRow: { flexDirection: 'row', alignItems: 'center' },
  stepRightSide: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepStatusText: { fontSize: 11, color: '#64748b', fontWeight: '600', textTransform: 'uppercase' },
  
  pendingDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#cbd5e1', backgroundColor: '#f1f5f9' },
  agentName: { fontSize: 14, fontWeight: '700', color: '#334155', marginLeft: 10 },
  agentOutputArea: { padding: 12, backgroundColor: '#faf9fe' },
  subTaskLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 0.5, marginBottom: 4 },
  subTaskText: { fontSize: 13, color: '#475569', lineHeight: 18, marginBottom: 12, fontStyle: 'italic' },
  agentContributionLabel: { fontSize: 10, fontWeight: '800', color: '#6366f1', letterSpacing: 0.5, marginBottom: 4 },
  agentMarkdownContainer: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eef2ff', borderRadius: 6, padding: 10 },
  
  typingIndicatorContainer: { alignSelf: 'flex-start', marginLeft: 4, marginTop: 4, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  typingText: { fontSize: 13, color: '#94a3b8', fontStyle: 'italic', fontWeight: '500' }
});