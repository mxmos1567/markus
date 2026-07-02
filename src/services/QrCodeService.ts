import QRCode from 'qrcode'
import { slotRoute } from '../domain/models'

export const QrCodeService = {
  /** Absolute URL a scanned QR code should resolve to. */
  urlFor(shelfSlug: string, code: string): string {
    const path = slotRoute(shelfSlug, code)
    if (typeof window === 'undefined') return path
    return `${window.location.origin}${path}`
  },

  async toDataUrl(shelfSlug: string, code: string): Promise<string> {
    return QRCode.toDataURL(this.urlFor(shelfSlug, code), {
      margin: 2,
      width: 512,
      color: { dark: '#0a0a14', light: '#ffffff' },
    })
  },

  async toSvg(shelfSlug: string, code: string): Promise<string> {
    return QRCode.toString(this.urlFor(shelfSlug, code), {
      type: 'svg',
      margin: 2,
      color: { dark: '#0a0a14', light: '#ffffff' },
    })
  },
}
