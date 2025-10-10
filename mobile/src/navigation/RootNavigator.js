import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/Auth/LoginScreen';
import AdminDashboardScreen from '../screens/Admin/AdminDashboardScreen';
import CoachDashboardScreen from '../screens/Coach/CoachDashboardScreen';
import TraineeDashboardScreen from '../screens/Trainee/TraineeDashboardScreen';
import ParentDashboardScreen from '../screens/Parent/ParentDashboardScreen';
import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator();

/**
 * Basic navigation skeleton. In a real app you would:
 * - Detect the authenticated user & role from context/store
 * - Redirect to the appropriate dashboard
 */
export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // or a loading screen
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      {user ? (
        <>
          <Stack.Screen
            name="AdminDashboard"
            component={AdminDashboardScreen}
            options={{ title: 'Admin Dashboard', headerShown: user.role === 'admin' }}
          />
          <Stack.Screen
            name="CoachDashboard"
            component={CoachDashboardScreen}
            options={{ title: 'Coach Dashboard', headerShown: user.role === 'coach' }}
          />
          <Stack.Screen
            name="TraineeDashboard"
            component={TraineeDashboardScreen}
            options={{ title: 'Trainee Dashboard', headerShown: user.role === 'trainee' }}
          />
          <Stack.Screen
            name="ParentDashboard"
            component={ParentDashboardScreen}
            options={{ title: 'Parent Dashboard', headerShown: user.role === 'parent' }}
          />
        </>
      ) : (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: 'Login', headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
}

