import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Text } from 'react-native';

const AgentNode = ({ angle, distance, name, color }) => {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000 + Math.random() * 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false, // Changed to false for web compatibility without layout artifacts
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000 + Math.random() * 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        })
      ])
    ).start();
  }, [floatAnim]);

  const x = Math.cos(angle) * distance;
  const y = Math.sin(angle) * distance;

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [y - 15, y + 15]
  });

  return (
    <Animated.View style={[styles.agentContainer, { transform: [{ translateX: x }, { translateY }] }]}>
      <View style={[styles.node, { backgroundColor: color }]} />
      <Text style={styles.nodeText}>{name}</Text>
    </Animated.View>
  );
};

export default function SwarmVisualizer({ swarmState }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 2000, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
      ])
    ).start();
  }, [pulseAnim]);

  const agents = swarmState?.agents || [
    { id: '1', name: 'Researcher', color: '#3b82f6' },
    { id: '2', name: 'Writer', color: '#10b981' },
    { id: '3', name: 'Reviewer', color: '#f59e0b' },
    { id: '4', name: 'Tools', color: '#ef4444' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Swarm Orchestration</Text>
      <View style={styles.canvas}>
        {agents.map((agent, index) => {
          const angle = (index / agents.length) * Math.PI * 2;
          return <AgentNode key={agent.id} name={agent.name} color={agent.color} angle={angle} distance={140} />;
        })}
        
        <Animated.View style={[styles.orchestratorContainer, { transform: [{ scale: pulseAnim }] }]}>
           <View style={[styles.node, styles.orchestrator]} />
           <Text style={styles.orchestratorText}>Orchestrator</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa', padding: 20 },
  title: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 20 },
  canvas: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  orchestratorContainer: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  agentContainer: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  node: { width: 44, height: 44, borderRadius: 22, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 5 },
  orchestrator: { backgroundColor: '#4f46e5', width: 70, height: 70, borderRadius: 35, borderWidth: 4, borderColor: '#c7d2fe' },
  nodeText: { marginTop: 8, fontSize: 13, fontWeight: '600', color: '#4b5563', backgroundColor: 'rgba(255,255,255,0.7)', paddingHorizontal: 6, borderRadius: 4, overflow: 'hidden' },
  orchestratorText: { marginTop: 10, fontSize: 14, fontWeight: '700', color: '#312e81', backgroundColor: 'rgba(255,255,255,0.8)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' }
});