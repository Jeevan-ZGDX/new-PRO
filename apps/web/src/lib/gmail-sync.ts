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

export async function fetchInitialHistoryId(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.historyId || null
  } catch { return null }
}

export async function fetchEmailDetail(accessToken: string, emailId: string): Promise<StoredEmail | null> {
  try {
    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${emailId}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const headers = (data.payload?.headers || []).reduce((acc: Record<string, string>, h: any) => {
      acc[h.name.toLowerCase()] = h.value
      return acc
    }, {})
    return {
      id: data.id,
      threadId: data.threadId,
      from: headers.from || '',
      to: headers.to || '',
      subject: headers.subject || '',
      snippet: data.snippet || '',
      date: headers.date || data.internalDate || '',
      labels: data.labelIds || [],
    }
  } catch { return null }
}

export async function fetchHistorySync(accessToken: string, startHistoryId: string): Promise<{
  historyId: string
  emails: StoredEmail[]
}> {
  try {
    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${startHistoryId}&historyTypes=messageAdded`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!res.ok) return { historyId: startHistoryId, emails: [] }
    const data = await res.json()
    const newHistoryId = data.historyId || startHistoryId
    const messageIds: string[] = []
    for (const record of data.history || []) {
      for (const msg of record.messagesAdded || []) {
        if (msg.message?.id) messageIds.push(msg.message.id)
      }
    }
    const emails: StoredEmail[] = []
    for (const id of messageIds.slice(0, 50)) {
      const detail = await fetchEmailDetail(accessToken, id)
      if (detail) emails.push(detail)
    }
    return { historyId: newHistoryId, emails }
  } catch { return { historyId: startHistoryId, emails: [] } }
}

export async function searchGmailEmails(accessToken: string, query: string): Promise<StoredEmail[]> {
  try {
    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=20`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!res.ok) return []
    const data = await res.json()
    const messages = data.messages || []
    const emails: StoredEmail[] = []
    for (const msg of messages.slice(0, 20)) {
      const detail = await fetchEmailDetail(accessToken, msg.id)
      if (detail) emails.push(detail)
    }
    return emails
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
