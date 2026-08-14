'use server'

import { supabase } from '@/lib/supabaseClient'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createTestCase(formData) {
  const title = formData.get('title')
  const preconditions = formData.get('preconditions')
  const steps_to_reproduce = formData.get('steps_to_reproduce')
  const expected_result = formData.get('expected_result')

  const { error } = await supabase.from('test_cases').insert({
    title,
    preconditions,
    steps_to_reproduce,
    expected_result,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/test-cases')
  redirect('/test-cases')
}

export async function archiveTestCase(formData) {
  const testCaseId = formData.get('testCaseId')

  const { error } = await supabase
    .from('test_cases')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', testCaseId)

  if (error) throw new Error(error.message)

  revalidatePath('/test-cases')
}

export async function restoreTestCase(formData) {
  const testCaseId = formData.get('testCaseId')

  const { error } = await supabase
    .from('test_cases')
    .update({ archived_at: null })
    .eq('id', testCaseId)

  if (error) throw new Error(error.message)

  revalidatePath('/test-cases')
}