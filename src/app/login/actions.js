'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData) {
  const email = formData.get('email')
  const password = formData.get('password')

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect(`/login?error=${encodeURIComponent('Invalid email or password.')}`)
  }

  redirect('/')
}

export async function loginAsDemo() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: process.env.DEMO_EMAIL,
    password: process.env.DEMO_PASSWORD,
  })

  if (error) {
    redirect(`/login?error=${encodeURIComponent('Demo account is not set up correctly.')}`)
  }

  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}