import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer, createSupabaseServiceRole } from '@/lib/supabaseServer'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { name, school_name, grade_level, country, school_year } = await req.json()

  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createSupabaseServiceRole()

  // Check class exists and belongs to teacher
  const { data: cls, error: cErr } = await service
    .from('classes')
    .select('id, teacher_id')
    .eq('id', params.id)
    .single()

  if (cErr || !cls) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 })
  }

  if (cls.teacher_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Build update object with only provided fields
  const updates: Record<string, string | null> = {}
  if (name !== undefined) updates.name = name
  if (school_name !== undefined) updates.school_name = school_name || null
  if (grade_level !== undefined) updates.grade_level = grade_level || null
  if (country !== undefined) updates.country = country || null
  if (school_year !== undefined) updates.school_year = school_year

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { error: updateErr } = await service
    .from('classes')
    .update(updates)
    .eq('id', params.id)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
