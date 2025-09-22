import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRole } from '@/lib/supabaseServer'

export async function GET(req: NextRequest) {
  const classId = req.nextUrl.searchParams.get('classId')
  if (!classId) return NextResponse.json({ error: 'classId required' }, { status: 400 })
  const supa = createSupabaseServiceRole()
  const { data: questions, error } = await supa
    .from('questions')
    .select('id, prompt, order')
    .eq('class_id', classId)
    .order('order', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ questions })
}

