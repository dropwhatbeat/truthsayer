import { closeBrowser } from './setup'

export async function teardown() {
  await closeBrowser()
}
