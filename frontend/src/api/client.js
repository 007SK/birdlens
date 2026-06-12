const BASE = import.meta.env.VITE_API_BASE_URL ?? ''

async function request(path, options = {}) {
  let res
  try {
    res = await fetch(`${BASE}${path}`, options)
  } catch {
    throw new Error('Service is starting up, please try again in 30 seconds.')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  getStats:       () => request('/stats'),
  getFeed:        () => request('/feed'),
  getDiscoveries: () => request('/discoveries'),
  analyze:        (formData) => request('/analyze', { method: 'POST', body: formData }),
}
