export async function fetchWithAuth(url, options = {}) {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  
  const token = url.includes('/api/admin') ? adminToken : (authToken || adminToken);
  
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
  
  return fetch(url, { ...options, headers });
}
