import bcrypt from 'bcryptjs'

export async function hashPassword(plain: string) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(plain, salt)
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash)
}

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

export function generateUsername(prefix: string, index: number) {
  const number = (index + 1).toString().padStart(2, '0')
  return `${prefix}${number}`.toLowerCase()
}

