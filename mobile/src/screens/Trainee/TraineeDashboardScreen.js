import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getMySessions, getMyProgress, getMyAchievements } from '../../services/api';

export default function TraineeDashboardScreen({ navigation }) {
  const { token, logout } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [progress, setProgress] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const [sessionsData, progressData, achievementsData] = await Promise.all([
        getMySessions(token),
        getMyProgress(token),
        getMyAchievements(token)
      ]);
      setSessions(sessionsData.sessions || []);
      setProgress(progressData);
      setAchievements(achievementsData.achievements || []);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Trainee Dashboard</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Sessions</Text>
          <Text style={styles.statValue}>{sessions.length}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Achievements</Text>
          <Text style={styles.statValue}>{achievements.length}</Text>
        </View>
        <View style={[styles.statCard, { width: '98%' }]}>
          <Text style={styles.statLabel}>Progress Level</Text>
          <Text style={styles.statValue}>{progress?.level || 'Beginner'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
        {sessions.slice(0, 5).map((session, index) => (
          <View key={index} style={styles.listItem}>
            <View>
              <Text style={styles.itemTitle}>{session.title || 'Training Session'}</Text>
              <Text style={styles.itemSubtitle}>{session.description || 'No description'}</Text>
            </View>
            <Text style={styles.itemDate}>
              {session.date ? new Date(session.date).toLocaleDateString() : 'TBD'}
            </Text>
          </View>
        ))}
        {sessions.length === 0 && <Text style={styles.emptyText}>No upcoming sessions</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Achievements</Text>
        <View style={styles.achievementsGrid}>
          {achievements.map((achievement, index) => (
            <View key={index} style={styles.achievementCard}>
              <Text style={styles.achievementIcon}>🏆</Text>
              <Text style={styles.achievementTitle}>{achievement.title}</Text>
            </View>
          ))}
        </View>
        {achievements.length === 0 && <Text style={styles.emptyText}>No achievements yet. Keep training!</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Training Progress</Text>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>Level: <Text style={styles.progressValue}>{progress?.level || 'Beginner'}</Text></Text>
          <Text style={styles.progressText}>Sessions Attended: <Text style={styles.progressValue}>{progress?.sessionsAttended || 0}</Text></Text>
          <Text style={styles.progressText}>Skills Mastered: <Text style={styles.progressValue}>{progress?.skillsMastered?.length || 0}</Text></Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#e53e3e',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    margin: '1%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#667eea',
  },
  section: {
    backgroundColor: 'white',
    margin: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f7fafc',
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#718096',
  },
  itemDate: {
    fontSize: 12,
    color: '#a0aec0',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementCard: {
    width: '48%',
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
    textAlign: 'center',
  },
  progressInfo: {
    padding: 12,
    backgroundColor: '#f7fafc',
    borderRadius: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 8,
  },
  progressValue: {
    fontWeight: 'bold',
    color: '#2d3748',
  },
  emptyText: {
    textAlign: 'center',
    color: '#a0aec0',
    padding: 20,
  },
});

