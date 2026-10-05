import { withGarminSession, closeGarminSession } from './garmin-session.js'

export async function testGarminCredentials(
  email: string,
  password: string,
): Promise<{ ok: true; displayName?: string }> {
  await closeGarminSession({ force: true })

  const previousEmail = process.env.GARMIN_EMAIL
  const previousPassword = process.env.GARMIN_PASSWORD

  process.env.GARMIN_EMAIL = email
  process.env.GARMIN_PASSWORD = password

  try {
    const profile = await withGarminSession(async (call) =>
      call<Record<string, unknown>>('get_user_profile'),
    )

    const displayName =
      (profile?.displayName as string | undefined) ??
      (profile?.fullName as string | undefined)

    return { ok: true, displayName }
  } finally {
    await closeGarminSession({ force: true })
    if (previousEmail) process.env.GARMIN_EMAIL = previousEmail
    else delete process.env.GARMIN_EMAIL
    if (previousPassword) process.env.GARMIN_PASSWORD = previousPassword
    else delete process.env.GARMIN_PASSWORD
  }
}
