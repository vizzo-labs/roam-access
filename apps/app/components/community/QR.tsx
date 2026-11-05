import QRCode from 'qrcode';

// A QR code as inline SVG (crisp in print, no image request). `label` says
// where it goes; the URL is always printed beside it as real text too.
export async function QR({ url, label, size = 160 }: { url: string; label: string; size?: number | string }) {
  const svg = await QRCode.toString(url, {
    type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#1A1A1A', light: '#FFFFFF' },
  });
  return (
    <span role="img" aria-label={label} className="pub-qr" style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg.replace('<svg ', '<svg aria-hidden="true" focusable="false" ') }}/>
  );
}
