import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getMyChildren, getMyPayments } from '../../services/api';

export default function ParentDashboardScreen({ navigation }) {
  const { token, logout } = useAuth();
  const [children, setChildren] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const [childrenData, paymentsData] = await Promise.all([
        getMyChildren(token),
        getMyPayments(token)
      ]);
      setChildren(childrenData.children || []);
      setPayments(paymentsData.payments || []);
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

  const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const activeSubscriptions = children.filter(c => c.subscription?.status === 'active').length;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Parent Dashboard</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Children</Text>
          <Text style={styles.statValue}>{children.length}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Paid</Text>
          <Text style={styles.statValue}>${totalPayments}</Text>
        </View>
        <View style={[styles.statCard, { width: '98%' }]}>
          <Text style={styles.statLabel}>Active Subscriptions</Text>
          <Text style={styles.statValue}>{activeSubscriptions}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Children</Text>
        {children.map((child, index) => (
          <View key={index} style={styles.listItem}>
            <View>
              <Text style={styles.itemTitle}>{child.name || 'Child'}</Text>
              <Text style={styles.itemSubtitle}>Level: {child.progress?.level || 'Beginner'}</Text>
              <Text style={styles.itemSubtitle}>Sessions: {child.progress?.sessionsAttended || 0}</Text>
            </View>
            <View style={[styles.badge, child.subscription?.status === 'active' ? styles.badgeActive : styles.badgeInactive]}>
              <Text style={styles.badgeText}>{child.subscription?.status || 'Inactive'}</Text>
            </View>
          </View>
        ))}
        {children.length === 0 && <Text style={styles.emptyText}>No children registered</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment History</Text>
        {payments.slice(0, 5).map((payment, index) => (
          <View key={index} style={styles.listItem}>
            <View>
              <Text style={styles.itemTitle}>${payment.amount}</Text>
              <Text style={styles.itemSubtitle}>{payment.description || 'Payment'}</Text>
            </View>
            <View>
              <View style={[styles.badge, payment.status === 'paid' ? styles.badgeActive : styles.badgeWarning]}>
                <Text style={styles.badgeText}>{payment.status}</Text>
              </View>
              <Text style={styles.itemDate}>
                {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : 'N/A'}
              </Text>
            </View>
          </View>
        ))}
        {payments.length === 0 && <Text style={styles.emptyText}>No payment history</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Add Child</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Make Payment</Text>
        </TouchableOpacity>
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
    marginTop: 4,
    textAlign: 'right',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeActive: {
    backgroundColor: '#c6f6d5',
  },
  badgeInactive: {
    backgroundColor: '#fed7d7',
  },
  badgeWarning: {
    backgroundColor: '#fef3c7',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#2d3748',
  },
  actionButton: {
    backgroundColor: '#667eea',
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#a0aec0',
    padding: 20,
  },
});

