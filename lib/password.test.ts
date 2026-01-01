import { describe, it, expect } from 'vitest'
import {
  generateReadablePassword,
  generateFunUsername,
  generateScientistUsername,
  generateStudentCredentials,
  parseUsername,
  hashPassword,
  verifyPassword,
} from './password'

describe('generateReadablePassword', () => {
  const VALID_CHARS = 'ABCDEFGHJKLMNPQRTUVWXYZ23456789'
  const EXCLUDED_CHARS = ['O', '0', 'I', '1', 'S']

  it('generates password of default length 8', () => {
    const password = generateReadablePassword()
    expect(password).toHaveLength(8)
  })

  it('generates password of custom length', () => {
    expect(generateReadablePassword(4)).toHaveLength(4)
    expect(generateReadablePassword(12)).toHaveLength(12)
    expect(generateReadablePassword(16)).toHaveLength(16)
  })

  it('only uses allowed characters', () => {
    // Generate many passwords to test randomness coverage
    for (let i = 0; i < 100; i++) {
      const password = generateReadablePassword()
      for (const char of password) {
        expect(VALID_CHARS).toContain(char)
      }
    }
  })

  it('excludes confusing characters (O, 0, I, 1, S)', () => {
    // Generate many passwords to ensure excluded chars never appear
    for (let i = 0; i < 100; i++) {
      const password = generateReadablePassword()
      for (const excluded of EXCLUDED_CHARS) {
        expect(password).not.toContain(excluded)
      }
    }
  })

  it('generates different passwords (randomness check)', () => {
    const passwords = new Set<string>()
    for (let i = 0; i < 50; i++) {
      passwords.add(generateReadablePassword())
    }
    // With 8-char passwords from 29 chars, collision is extremely unlikely
    expect(passwords.size).toBeGreaterThan(45)
  })
})

describe('generateFunUsername', () => {
  it('generates lowercase username with adjective, scientist, and number', () => {
    const username = generateFunUsername(0)
    expect(username).toMatch(/^[a-z]+[a-z]+01$/)
  })

  it('pads number to 2 digits', () => {
    expect(generateFunUsername(0)).toMatch(/01$/)
    expect(generateFunUsername(8)).toMatch(/09$/)
    expect(generateFunUsername(99)).toMatch(/00$/) // 99 + 1 = 100, padded to "00" with length 2
  })

  it('cycles through scientists based on index', () => {
    // Scientists array has 30 entries, so index 30 should cycle back
    const username30 = generateFunUsername(30)
    const username0 = generateFunUsername(0)
    // Both should use the same scientist (Fermi) but different numbers
    expect(username30).toMatch(/fermi31$/)
    expect(username0).toMatch(/fermi01$/)
  })
})

describe('generateScientistUsername', () => {
  it('generates lowercase username with scientist and number', () => {
    const username = generateScientistUsername(0)
    expect(username).toBe('fermi01')
  })

  it('cycles through scientists', () => {
    expect(generateScientistUsername(0)).toBe('fermi01')
    expect(generateScientistUsername(1)).toBe('einstein02')
    expect(generateScientistUsername(2)).toBe('curie03')
  })

  it('pads numbers correctly', () => {
    expect(generateScientistUsername(8)).toBe('galileo09')
    // 99 % 30 scientists = index 9 (kepler), number = 99+1 = 100
    expect(generateScientistUsername(99)).toBe('kepler100')
  })
})

describe('parseUsername', () => {
  it('extracts base and number from valid username', () => {
    expect(parseUsername('fermi01')).toEqual({ base: 'fermi', number: 1 })
    expect(parseUsername('quantumeinstein42')).toEqual({ base: 'quantumeinstein', number: 42 })
    expect(parseUsername('cosmicgauss100')).toEqual({ base: 'cosmicgauss', number: 100 })
  })

  it('returns null for invalid usernames', () => {
    expect(parseUsername('fermi')).toBeNull() // no number
    expect(parseUsername('')).toBeNull()
  })

  it('parses numeric-only strings (regex allows digit in base)', () => {
    // The regex .+? matches any character including digits
    // '123' -> base='1', number=23 (greedy number at end)
    expect(parseUsername('123')).toEqual({ base: '1', number: 23 })
  })

  it('handles edge cases', () => {
    // Number at end with letters before
    expect(parseUsername('a1')).toEqual({ base: 'a', number: 1 })
    expect(parseUsername('test99999')).toEqual({ base: 'test', number: 99999 })
  })
})

describe('generateStudentCredentials', () => {
  it('generates requested number of credentials', async () => {
    const creds = await generateStudentCredentials(5, new Map())
    expect(creds).toHaveLength(5)
  })

  it('generates unique usernames within batch', async () => {
    const creds = await generateStudentCredentials(20, new Map())
    const usernames = creds.map(c => c.username)
    const uniqueUsernames = new Set(usernames)
    expect(uniqueUsernames.size).toBe(20)
  })

  it('respects existing max numbers', async () => {
    const existing = new Map([
      ['quantumfermi', 5],
      ['cosmiceinstein', 10],
    ])
    const creds = await generateStudentCredentials(50, existing)

    // Check that any credentials with these bases have higher numbers
    for (const cred of creds) {
      const parsed = parseUsername(cred.username)
      if (parsed?.base === 'quantumfermi') {
        expect(parsed.number).toBeGreaterThan(5)
      }
      if (parsed?.base === 'cosmiceinstein') {
        expect(parsed.number).toBeGreaterThan(10)
      }
    }
  })

  it('generates valid passwords and hashes', async () => {
    const creds = await generateStudentCredentials(3, new Map())

    for (const cred of creds) {
      expect(cred.plainPassword).toHaveLength(8)
      expect(cred.passwordHash).toMatch(/^\$2[aby]?\$/) // bcrypt hash prefix
      // Verify hash matches plain password
      const isValid = await verifyPassword(cred.plainPassword, cred.passwordHash)
      expect(isValid).toBe(true)
    }
  })

  it('username format is lowercase adjective + scientist + padded number', async () => {
    const creds = await generateStudentCredentials(10, new Map())

    for (const cred of creds) {
      // Should be all lowercase
      expect(cred.username).toBe(cred.username.toLowerCase())
      // Should end with padded number (at least 2 digits)
      expect(cred.username).toMatch(/\d{2,}$/)
      // Should have only alphanumeric characters
      expect(cred.username).toMatch(/^[a-z0-9]+$/)
    }
  })
})

describe('hashPassword and verifyPassword', () => {
  it('creates valid bcrypt hash', async () => {
    const hash = await hashPassword('testpassword')
    expect(hash).toMatch(/^\$2[aby]?\$\d{2}\$/)
    expect(hash.length).toBeGreaterThan(50)
  })

  it('verifies correct password', async () => {
    const password = 'mySecurePassword123'
    const hash = await hashPassword(password)
    expect(await verifyPassword(password, hash)).toBe(true)
  })

  it('rejects incorrect password', async () => {
    const hash = await hashPassword('correctPassword')
    expect(await verifyPassword('wrongPassword', hash)).toBe(false)
  })

  it('generates different hashes for same password (salt)', async () => {
    const password = 'samePassword'
    const hash1 = await hashPassword(password)
    const hash2 = await hashPassword(password)
    expect(hash1).not.toBe(hash2)
    // But both should verify correctly
    expect(await verifyPassword(password, hash1)).toBe(true)
    expect(await verifyPassword(password, hash2)).toBe(true)
  })
})
