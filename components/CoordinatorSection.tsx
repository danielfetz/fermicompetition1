'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

type Teacher = {
  profile_id: string
  user_id: string
  display_name: string | null
  school_name: string | null
  joined_at: string
  teacher_code: string
  code_name: string | null
  claimed_at: string | null
  email: string
  class_count: number
  student_count: number
}

type TeacherCode = {
  id: string
  code: string
  name: string | null
  claimed_by: string | null
  claimed_at: string | null
  created_at: string
}

type Props = {
  masterCodeId: string
  masterCodeName?: string
}

export default function CoordinatorSection({ masterCodeId, masterCodeName }: Props) {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [codes, setCodes] = useState<TeacherCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateCode, setShowCreateCode] = useState(false)
  const [newCodeName, setNewCodeName] = useState('')
  const [creating, setCreating] = useState(false)
  const [newCode, setNewCode] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)

    // Fetch teachers using codes under this master code
    const { data: teacherData } = await supabase
      .from('coordinator_teachers')
      .select('*')

    // Fetch all codes under this master code
    const { data: codeData } = await supabase
      .from('teacher_codes')
      .select('*')
      .eq('master_code_id', masterCodeId)
      .order('created_at', { ascending: false })

    setTeachers(teacherData || [])
    setCodes(codeData || [])
    setLoading(false)
  }

  async function handleCreateCode(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setNewCode(null)

    const { data, error } = await supabase.rpc('generate_teacher_code', {
      p_name: newCodeName || null
    })

    if (data?.success) {
      setNewCode(data.code)
      setNewCodeName('')
      loadData()
    }

    setCreating(false)
  }

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse flex items-center gap-2">
          <div className="w-4 h-4 bg-swan rounded"></div>
          <div className="h-4 bg-swan rounded w-32"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="card border-2 border-duo-purple">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-duo-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h2 className="text-xl font-bold text-eel">Coordinator Dashboard</h2>
        </div>
        <span className="badge badge-purple">{masterCodeName || 'Coordinator'}</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-snow rounded-lg">
          <div className="text-2xl font-bold text-duo-purple">{teachers.length}</div>
          <div className="text-xs text-wolf">Teachers</div>
        </div>
        <div className="text-center p-3 bg-snow rounded-lg">
          <div className="text-2xl font-bold text-duo-blue">{teachers.reduce((sum, t) => sum + t.class_count, 0)}</div>
          <div className="text-xs text-wolf">Classes</div>
        </div>
        <div className="text-center p-3 bg-snow rounded-lg">
          <div className="text-2xl font-bold text-duo-green">{teachers.reduce((sum, t) => sum + t.student_count, 0)}</div>
          <div className="text-xs text-wolf">Students</div>
        </div>
      </div>

      {/* Teachers Table */}
      {teachers.length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold text-eel mb-2">Teachers Using Your Codes</h3>
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-swan">
                  <th className="py-2 px-6 font-bold text-wolf text-xs uppercase">Email</th>
                  <th className="py-2 px-4 font-bold text-wolf text-xs uppercase">Code</th>
                  <th className="py-2 px-4 font-bold text-wolf text-xs uppercase">Classes</th>
                  <th className="py-2 px-4 font-bold text-wolf text-xs uppercase">Students</th>
                  <th className="py-2 px-4 font-bold text-wolf text-xs uppercase">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-swan">
                {teachers.map(t => (
                  <tr key={t.profile_id} className="hover:bg-snow">
                    <td className="py-2 px-6 text-eel">{t.email}</td>
                    <td className="py-2 px-4">
                      <span className="font-mono text-xs bg-swan px-2 py-1 rounded">{t.teacher_code}</span>
                    </td>
                    <td className="py-2 px-4 text-duo-blue font-bold">{t.class_count}</td>
                    <td className="py-2 px-4 text-duo-green font-bold">{t.student_count}</td>
                    <td className="py-2 px-4 text-wolf text-xs">
                      {t.claimed_at ? new Date(t.claimed_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Available Codes */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-eel">Available Codes</h3>
          <button
            onClick={() => setShowCreateCode(!showCreateCode)}
            className="btn btn-sm btn-primary"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Generate Code
          </button>
        </div>

        {/* Create Code Form */}
        {showCreateCode && (
          <div className="bg-snow rounded-lg p-4 mb-4">
            <form onSubmit={handleCreateCode} className="flex gap-2">
              <input
                type="text"
                value={newCodeName}
                onChange={(e) => setNewCodeName(e.target.value)}
                placeholder="Optional: Label (e.g., 'Physics Dept')"
                className="input flex-1"
                disabled={creating}
              />
              <button type="submit" disabled={creating} className="btn btn-primary">
                {creating ? 'Creating...' : 'Create'}
              </button>
            </form>
            {newCode && (
              <div className="mt-3 p-3 bg-duo-green/10 border border-duo-green rounded-lg">
                <p className="text-sm text-duo-green font-bold mb-1">New code created!</p>
                <p className="font-mono text-lg text-eel select-all">{newCode}</p>
                <p className="text-xs text-wolf mt-1">Share this code with a teacher</p>
              </div>
            )}
          </div>
        )}

        {/* Codes List */}
        <div className="space-y-2">
          {codes.filter(c => !c.claimed_by).length === 0 ? (
            <p className="text-sm text-wolf italic">No unclaimed codes. Generate one above!</p>
          ) : (
            codes.filter(c => !c.claimed_by).map(code => (
              <div key={code.id} className="flex items-center justify-between p-3 bg-snow rounded-lg">
                <div>
                  <span className="font-mono font-bold text-eel">{code.code}</span>
                  {code.name && <span className="text-wolf text-sm ml-2">({code.name})</span>}
                </div>
                <span className="badge badge-yellow">Unclaimed</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
