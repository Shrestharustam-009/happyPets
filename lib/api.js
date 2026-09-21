export async function fetchWithAuth(url, options = {}) {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  
  const token = url.includes('/api/admin') ? adminToken : (authToken || adminToken);
  
  // If the caller already manually passed an Authorization header, respect it.
  // Otherwise, auto-inject the detected token.
  const existingAuth = options.headers?.Authorization || options.headers?.authorization;
  
  const headers = {
    ...options.headers,
    ...(!existingAuth && token ? { Authorization: `Bearer ${token}` } : {})
  };
  
  return fetch(url, { ...options, headers });
}
