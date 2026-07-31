const STORAGE_KEYS = {
  tokens: (uid: string) => `comp_dash_gmail_tokens_${uid}`,
  historyId: (uid: string) => `comp_dash_gmail_history_${uid}`,
  syncedEmails: (uid: string) => `comp_dash_gmail_synced_${uid}`,
}

interface GmailTokens {
  access_token: string
  refresh_token: string
  expiry_date: number
}

interface StoredEmail {
  id: string
  threadId: string
  from: string
  to: string
  subject: string
  snippet: string
  date: string
  labels: string[]
  competitionHint?: string
}

interface GmailSyncResult {
  historyId: string
  emails: StoredEmail[]
}

interface GmailSearchResult {
  emails: StoredEmail[]
}

function getApiBase(): string {
  if (typeof window === 'undefined') return ''
  return ''
}

async function fetchApi(endpoint: string, params: Record<string, string> = {}, options: { method?: string; body?: any } = {}): Promise<any> {
  const url = new URL(`/api${endpoint}`, window.location.origin)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString(), {
    method: options.method || 'GET',
    headers: options.body ? { 'Content-Type': 'application/json' } : {},
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const json = await res.json()
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || 'API request failed')
  }
  return json.data
}

export function getGmailTokens(userId: string): GmailTokens | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.tokens(userId))
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function setGmailTokens(userId: string, tokens: GmailTokens) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS.tokens(userId), JSON.stringify(tokens))
}

export function clearGmailTokens(userId: string) {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEYS.tokens(userId))
  localStorage.removeItem(STORAGE_KEYS.historyId(userId))
  localStorage.removeItem(STORAGE_KEYS.syncedEmails(userId))
}

export function getHistoryId(userId: string): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEYS.historyId(userId))
}

export function setHistoryId(userId: string, historyId: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS.historyId(userId), historyId)
}

export function getSyncedEmails(userId: string): StoredEmail[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.syncedEmails(userId))
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function setSyncedEmails(userId: string, emails: StoredEmail[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS.syncedEmails(userId), JSON.stringify(emails))
}

export function appendSyncedEmails(userId: string, newEmails: StoredEmail[]) {
  const existing = getSyncedEmails(userId)
  const existingIds = new Set(existing.map(e => e.id))
  const deduped = [...newEmails.filter(e => !existingIds.has(e.id)), ...existing]
  setSyncedEmails(userId, deduped)
}

export function isTokenExpired(tokens: GmailTokens): boolean {
  return Date.now() >= tokens.expiry_date - 60000
}

export async function refreshAccessToken(refreshToken: string): Promise<GmailTokens | null> {
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    })
    if (!res.ok) return null
    const data = await res.json()
    return {
      access_token: data.access_token,
      refresh_token: refreshToken,
      expiry_date: Date.now() + (data.expires_in || 3600) * 1000,
    }
  } catch { return null }
}

export async function fetchValidAccessToken(userId: string): Promise<string | null> {
  const tokens = getGmailTokens(userId)
  if (!tokens?.access_token) return null
  if (isTokenExpired(tokens)) {
    const refreshed = await refreshAccessToken(tokens.refresh_token)
    if (!refreshed) { clearGmailTokens(userId); return null }
    setGmailTokens(userId, refreshed)
    return refreshed.access_token
  }
  return tokens.access_token
}

export async function storeTokensOnServer(userId: string, tokens: GmailTokens, historyId?: string): Promise<void> {
  await fetchApi('/gmail/tokens', { userId }, {
    method: 'POST',
    body: {
      userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || '',
      expiresIn: String(Math.floor((tokens.expiry_date - Date.now()) / 1000)),
      historyId: historyId || '',
    },
  })
}

// --- Server-proxied Gmail API calls ---

export async function fetchInitialHistoryId(userId: string): Promise<string | null> {
  const accessToken = await fetchValidAccessToken(userId)
  if (!accessToken) return null
  try {
    const data = await fetchApi('/gmail/sync/initial', { userId, accessToken })
    return data.historyId || null
  } catch { return null }
}

export async function fetchHistorySync(userId: string): Promise<GmailSyncResult | null> {
  const accessToken = await fetchValidAccessToken(userId)
  const startHistoryId = getHistoryId(userId)
  if (!accessToken || !startHistoryId) return null
  try {
    const data = await fetchApi('/gmail/sync', { userId, accessToken, startHistoryId })
    return { historyId: data.historyId, emails: data.emails }
  } catch { return null }
}

export async function searchGmailEmails(userId: string, keyword: string): Promise<StoredEmail[]> {
  const accessToken = await fetchValidAccessToken(userId)
  if (!accessToken) return []
  try {
    const data = await fetchApi('/gmail/search', { userId, accessToken, keyword })
    return data.emails || []
  } catch { return [] }
}

export async function fetchEmailDetail(userId: string, emailId: string): Promise<StoredEmail | null> {
  const accessToken = await fetchValidAccessToken(userId)
  if (!accessToken) return null
  try {
    const data = await fetchApi('/gmail/email-detail', { userId, accessToken, id: emailId })
    return data.email || null
  } catch { return null }
}

export async function fetchRecentEmails(userId: string, maxResults = 30): Promise<StoredEmail[]> {
  const accessToken = await fetchValidAccessToken(userId)
  if (!accessToken) return []
  try {
    const data = await fetchApi('/gmail/recent', { userId, accessToken, maxResults: String(maxResults) })
    return data.emails || []
  } catch { return [] }
}

export function extractCompetitionHint(email: StoredEmail): string | null {
  const subject = (email.subject || '').toLowerCase()
  const from = (email.from || '').toLowerCase()
  const keywords = ['competition', 'hackathon', 'contest', 'challenge', 'registration', 'workshop', 'conference', 'seminar', 'symposium']
  for (const kw of keywords) {
    if (subject.includes(kw) || from.includes(kw)) {
      return kw
    }
  }
  return null
}