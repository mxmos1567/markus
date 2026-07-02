import QRCode from 'qrcode'
import { slotRoute } from '../domain/models'
import { getDb } from '../db/database'

const BASE_URL_SETTING_KEY = 'qr-base-url'

export const QrCodeService = {
  /**
   * Reads the configured QR Code Base URL from settings (e.g.
   * "http://erinnerungsregal.local" for a Raspberry Pi on the home
   * network). Falls back to the browser's current origin when unset,
   * so this works out of the box before anyone visits Settings.
   */
  async getBaseUrl(): Promise<string> {
    const db = await getDb()
    const stored = (await db.get('settings', BASE_URL_SETTING_KEY)) as string | undefined
    if (stored) return stored.replace(/\/$/, '')
    return typeof window === 'undefined' ? '' : window.location.origin
  },

  async setBaseUrl(baseUrl: string): Promise<void> {
    const db = await getDb()
    const trimmed = baseUrl.trim().replace(/\/$/, '')
    if (trimmed) await db.put('settings', trimmed, BASE_URL_SETTING_KEY)
    else await db.delete('settings', BASE_URL_SETTING_KEY)
  },

  /** Absolute URL a printed QR code should resolve to. */
  async urlFor(shelfSlug: string, code: string): Promise<string> {
    const base = await this.getBaseUrl()
    return `${base}${slotRoute(shelfSlug, code)}`
  },

  async toDataUrl(shelfSlug: string, code: string): Promise<string> {
    const url = await this.urlFor(shelfSlug, code)
    return QRCode.toDataURL(url, {
      margin: 2,
      width: 512,
      color: { dark: '#0a0a14', light: '#ffffff' },
    })
  },
}
