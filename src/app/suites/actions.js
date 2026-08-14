'use server'

import { supabase } from '@/lib/supabaseClient'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createSuite(formData) {
  const name = formData.get('name')
  const description = formData.get('description')

  const { error } = await supabase.from('suites').insert({ name, description })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/suites')
  redirect('/suites')
}

export async function addTestCasesToSuite(formData) {
  const suiteId = formData.get('suiteId')
  const testCaseIds = formData.getAll('testCaseIds')

  if (testCaseIds.length === 0) return

  const rowsToInsert = testCaseIds.map((testCaseId) => ({
    suite_id: suiteId,
    test_case_id: testCaseId,
  }))

  const { error } = await supabase.from('suite_cases').insert(rowsToInsert)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/suites/${suiteId}`)
}

export async function removeTestCaseFromSuite(formData) {
  const suiteCaseId = formData.get('suiteCaseId')
  const suiteId = formData.get('suiteId')

  const { error } = await supabase.from('suite_cases').delete().eq('id', suiteCaseId)

  if (error) throw new Error(error.message)

  revalidatePath(`/suites/${suiteId}`)
}