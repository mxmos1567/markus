import QRCode from 'qrcode'
import { memoryRoute } from '../domain/models'

export const QrCodeService = {
  /** Absolute URL a printed QR code should resolve to. */
  urlFor(slug: string): string {
    const path = memoryRoute(slug)
    if (typeof window === 'undefined') return path
    return `${window.location.origin}${path}`
  },

  async toDataUrl(slug: string): Promise<string> {
    return QRCode.toDataURL(this.urlFor(slug), {
      margin: 2,
      width: 512,
      color: { dark: '#0a0a14', light: '#ffffff' },
    })
  },
}
