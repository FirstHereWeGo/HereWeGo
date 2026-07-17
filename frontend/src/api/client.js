const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function request(path, options) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`${options?.method || 'GET'} ${path} failed: ${res.status} ${detail}`);
  }
  return res.json();
}

export function getTeams() {
  return request('/api/teams');
}

export function getFormations() {
  return request('/api/formations');
}

export function getTactics() {
  return request('/api/tactics');
}

export function postWinProbability(payload) {
  return request('/api/win-probability', { method: 'POST', body: JSON.stringify(payload) });
}
