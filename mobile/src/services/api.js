const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}, authToken = null) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    headers,
    ...options
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = data?.message || 'Network error';
    throw new Error(message);
  }

  return data;
}

export async function login(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export async function getMe(token) {
  return request('/auth/me', { method: 'GET' }, token);
}

export async function getDashboard(role, token) {
  return request(`/dashboard/${role}`, { method: 'GET' }, token);
}

export async function getMySessions(token) {
  return request('/training-sessions/my-sessions', { method: 'GET' }, token);
}

export async function getMyTeams(token) {
  return request('/teams/my-teams', { method: 'GET' }, token);
}

export async function getMyProgress(token) {
  return request('/progress/my-progress', { method: 'GET' }, token);
}

export async function getMyAchievements(token) {
  return request('/achievements/my-achievements', { method: 'GET' }, token);
}

export async function getMyChildren(token) {
  return request('/users/my-children', { method: 'GET' }, token);
}

export async function getMyPayments(token) {
  return request('/payments/my-payments', { method: 'GET' }, token);
}

export { BASE_URL };

