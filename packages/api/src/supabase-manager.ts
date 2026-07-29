let _supabaseClient: any = null

export function setSupabaseClient(client: any) {
  _supabaseClient = client
}

export function getSupabaseClient() {
  return _supabaseClient
}

export function isSupabaseEnabled() {
  return _supabaseClient !== null
}
