import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRole } from '@/lib/supabaseServer'
import { signStudentToken } from '@/lib/jwt'
import crypto from 'crypto'

// Guest class ID - a special class for all guest users
// This will be created on first guest login if it doesn't exist
const GUEST_CLASS_NAME = '__guest_class__'

export async function POST(req: NextRequest) {
  const supa = createSupabaseServiceRole()

  // Find or create the guest class
  let { data: guestClass } = await supa
    .from('classes')
    .select('id')
    .eq('name', GUEST_CLASS_NAME)
    .maybeSingle()

  if (!guestClass) {
    // Create the guest class with a system user (we'll use a placeholder teacher_id)
    // First, check if there's any teacher we can use, or create a special one
    const { data: anyUser } = await supa
      .from('classes')
      .select('teacher_id')
      .limit(1)
      .maybeSingle()

    if (!anyUser) {
      return NextResponse.json(
        { error: 'System not configured for guest access yet' },
        { status: 503 }
      )
    }

    const { data: newClass, error: classError } = await supa
      .from('classes')
      .insert({
        name: GUEST_CLASS_NAME,
        teacher_id: anyUser.teacher_id,
        num_students: 500,
        school_name: 'Guest Access',
        is_active: true
      })
      .select('id')
      .single()

    if (classError) {
      console.error('Failed to create guest class:', classError)
      return NextResponse.json({ error: 'Failed to initialize guest access' }, { status: 500 })
    }

    guestClass = newClass

    // Seed the guest class with guest questions
    await supa.rpc('seed_class_questions', { p_class_id: guestClass.id, p_mode: 'guest' })
  }

  // Generate a unique guest identifier
  const guestId = crypto.randomBytes(4).toString('hex')
  const guestUsername = `guest_${guestId}`

  // Create a temporary guest student record
  const { data: guestStudent, error: studentError } = await supa
    .from('students')
    .insert({
      class_id: guestClass.id,
      username: guestUsername,
      password_hash: 'guest_no_password', // Guests don't need passwords
      plain_password: null,
      full_name: `Guest ${guestId}`,
      competition_mode: 'guest'
    })
    .select('id, class_id')
    .single()

  if (studentError) {
    console.error('Failed to create guest student:', studentError)
    return NextResponse.json({ error: 'Failed to create guest session' }, { status: 500 })
  }

  // Sign JWT token for the guest
  const token = signStudentToken({
    studentId: guestStudent.id,
    classId: guestStudent.class_id,
    role: 'student'
  })

  return NextResponse.json({
    token,
    classId: guestStudent.class_id,
    needsName: false, // Guests don't need to enter their name
    isGuest: true
  })
}
