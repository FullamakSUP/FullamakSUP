import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

function TableQRCode({ tableNumber, size = 150 }) {
  const [qrUrl, setQrUrl] = useState(null)

  useEffect(() => {
    let isMounted = true
    const menuUrl = `${window.location.origin}/menu?table=${tableNumber}`
    QRCode.toDataURL(menuUrl, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    }).then((url) => {
      if (isMounted) setQrUrl(url)
    }).catch((err) => {
      console.error('QR generation error:', err)
    })
    
    return () => { isMounted = false }
  }, [tableNumber, size])

  if (!qrUrl) {
    return <div style={{ width: size, height: size, background: '#f0f0f0', borderRadius: '12px', animation: 'pulse 1.5s ease-in-out infinite' }}></div>
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <img src={qrUrl} alt={`QR Code Meja ${tableNumber}`} style={{ width: size, height: size, borderRadius: '12px' }} />
      <p style={{ marginTop: '8px', fontSize: '12px', fontWeight: 'bold' }}>Meja {tableNumber}</p>
      <p style={{ fontSize: '10px', color: '#64748b' }}>Scan untuk order</p>
    </div>
  )
}

export default TableQRCode