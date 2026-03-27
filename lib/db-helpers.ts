import { createClient } from './supabase'

export async function getCurrentProfileId(): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

export async function insertFields() {
  const id = await getCurrentProfileId()
  return { created_by_user_id: id, modified_by_user_id: id }
}

export async function updateFields() {
  const id = await getCurrentProfileId()
  return { modified_by_user_id: id }
}
