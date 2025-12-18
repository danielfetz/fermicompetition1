import bcrypt from 'bcryptjs'

export async function hashPassword(plain: string) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(plain, salt)
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash)
}

// Generate readable password with mix of consonants, vowels, and digits
export function generateReadablePassword(length = 8) {
  const consonants = 'bcdfghjklmnpqrstvwxyz'
  const vowels = 'aeiou'
  const digits = '23456789'
  let out = ''
  for (let i = 0; i < length; i++) {
    const set = i % 3 === 2 ? digits : i % 2 === 0 ? consonants : vowels
    out += set[Math.floor(Math.random() * set.length)]
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

// Generate batch of fun credentials for students
export async function generateStudentCredentials(count: number): Promise<{
  username: string
  plainPassword: string
  passwordHash: string
}[]> {
  const credentials = []

  // Shuffle scientists for more variety
  const shuffledScientists = [...SCIENTISTS].sort(() => Math.random() - 0.5)

  for (let i = 0; i < count; i++) {
    const scientist = shuffledScientists[i % shuffledScientists.length]
    const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
    const number = (i + 1).toString().padStart(2, '0')
    const username = `${adjective}${scientist}${number}`.toLowerCase()

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
