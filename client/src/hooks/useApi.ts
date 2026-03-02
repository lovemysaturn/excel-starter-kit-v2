const API_BASE = '/api';

interface ApiOptions {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
}

async function apiFetch(endpoint: string, options: ApiOptions = {}) {
    const { method = 'GET', body, headers = {} } = options;
    const config: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
    };
    if (body) config.body = JSON.stringify(body);
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || res.statusText);
    }
    return res.json();
}

export const apiGet = (endpoint: string) => apiFetch(endpoint);
export const apiPost = (endpoint: string, body?: any) => apiFetch(endpoint, { method: 'POST', body });
export const apiPut = (endpoint: string, body?: any) => apiFetch(endpoint, { method: 'PUT', body });
export const apiDelete = (endpoint: string) => apiFetch(endpoint, { method: 'DELETE' });
