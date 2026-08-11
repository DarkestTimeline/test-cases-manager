'use server'

import { supabase } from '@/lib/supabaseClient'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createModule(formData) {
  const name = formData.get('name')
  const description = formData.get('description')

  const { error } = await supabase.from('modules').insert({ name, description })

  if (error) throw new Error(error.message)

  revalidatePath('/modules')
  redirect('/modules')
}

export async function addTestCasesToModule(formData) {
  const moduleId = formData.get('moduleId')
  const testCaseIds = formData.getAll('testCaseIds')

  if (testCaseIds.length === 0) return

  const rowsToInsert = testCaseIds.map((testCaseId) => ({
    module_id: moduleId,
    test_case_id: testCaseId,
  }))

  const { error } = await supabase.from('module_cases').insert(rowsToInsert)

  if (error) throw new Error(error.message)

  revalidatePath(`/modules/${moduleId}`)
}