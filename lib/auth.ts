import bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'

const SALT_ROUNDS = 10

export function generatePlayerToken(): { plaintext: string; hash: string } {
  const plaintext = randomUUID()
  const hash = bcrypt.hashSync(plaintext, SALT_ROUNDS)
  return { plaintext, hash }
}

export function verifyPlayerToken(plaintext: string, hash: string): boolean {
  return bcrypt.compareSync(plaintext, hash)
}
