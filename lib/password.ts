import bcrypt from 'bcryptjs'

export async function hashPassword(plain: string) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(plain, salt)
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash)
}

// Generate readable password - 8 uppercase alphanumeric characters
// Excludes confusing characters: O, 0, I, 1, S (looks like 5)
export function generateReadablePassword(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

// Famous scientists for fun usernames
const SCIENTISTS = [
  'Fermi',
  'Einstein',
  'Curie',
  'Newton',
  'Darwin',
  'Tesla',
  'Hawking',
  'Feynman',
  'Galileo',
  'Kepler',
  'Planck',
  'Bohr',
  'Maxwell',
  'Faraday',
  'Heisenberg',
  'Schrodinger',
  'Lovelace',
  'Hopper',
  'Turing',
  'Euler',
  'Gauss',
  'Pascal',
  'Noether',
  'Ramanujan',
  'Dirac',
  'Pauli',
  'Hubble',
  'Sagan',
  'Nye',
  'Tyson',
]

// Fun adjectives for usernames
const ADJECTIVES = [
  'Atomic',
  'Cosmic',
  'Quantum',
  'Super',
  'Mega',
  'Ultra',
  'Stellar',
  'Brave',
  'Swift',
  'Clever',
  'Mighty',
  'Noble',
  'Quick',
  'Sharp',
  'Bright',
  'Bold',
  'Cool',
  'Epic',
  'Grand',
  'Prime',
]

// Generate a fun username with a scientist name
export function generateFunUsername(index: number): string {
  // Use modulo to cycle through scientists
  const scientist = SCIENTISTS[index % SCIENTISTS.length]
  // Add a random adjective for extra fun
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  // Add a number suffix based on index
  const number = (index + 1).toString().padStart(2, '0')

  return `${adjective}${scientist}${number}`.toLowerCase()
}

// Generate username with just scientist name and number (simpler version)
export function generateScientistUsername(index: number): string {
  const scientist = SCIENTISTS[index % SCIENTISTS.length]
  const number = (index + 1).toString().padStart(2, '0')
  return `${scientist.toLowerCase()}${number}`
}

// Legacy function for backwards compatibility
export function generateUsername(prefix: string, index: number) {
  const number = (index + 1).toString().padStart(2, '0')
  return `${prefix}${number}`.toLowerCase()
}

// Generate batch of fun credentials for students with globally unique usernames
// Takes a map of base username -> highest existing number for efficient lookup
export async function generateStudentCredentials(
  count: number,
  existingMaxNumbers: Map<string, number>
): Promise<{
  username: string
  plainPassword: string
  passwordHash: string
}[]> {
  const credentials = []
  // Track numbers we're using in this batch
  const usedNumbers = new Map<string, number>(existingMaxNumbers)

  for (let i = 0; i < count; i++) {
    // Pick random adjective and scientist
    const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
    const scientist = SCIENTISTS[Math.floor(Math.random() * SCIENTISTS.length)]
    const baseUsername = `${adjective}${scientist}`.toLowerCase()

    // Get the next available number for this base
    const currentMax = usedNumbers.get(baseUsername) || 0
    const nextNumber = currentMax + 1
    const username = `${baseUsername}${nextNumber.toString().padStart(2, '0')}`

    usedNumbers.set(baseUsername, nextNumber)

    const plainPassword = generateReadablePassword(8)
    const passwordHash = await hashPassword(plainPassword)

    credentials.push({
      username,
      plainPassword,
      passwordHash,
    })
  }

  return credentials
}

// Helper to extract base username and number from a full username
export function parseUsername(username: string): { base: string; number: number } | null {
  const match = username.match(/^(.+?)(\d+)$/)
  if (!match) return null
  return { base: match[1], number: parseInt(match[2], 10) }
}
