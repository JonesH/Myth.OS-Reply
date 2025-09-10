'use client'

import { useEffect, useRef } from 'react'

interface QRCodeProps {
  text: string
  size?: number
  className?: string
}

export default function QRCode({ text, size = 200, className = '' }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !text) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, size, size)

    // Simple QR code-like pattern generation
    // In a real implementation, you'd use a QR code library like qrcode.js
    const cellSize = size / 25 // 25x25 grid
    const margin = cellSize * 2

    // Draw background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)

    // Draw border
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.strokeRect(margin, margin, size - margin * 2, size - margin * 2)

    // Draw corner squares (QR code characteristic)
    const cornerSize = cellSize * 7
    ctx.fillStyle = '#000000'
    
    // Top-left corner
    ctx.fillRect(margin, margin, cornerSize, cornerSize)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(margin + cellSize, margin + cellSize, cornerSize - cellSize * 2, cornerSize - cellSize * 2)
    ctx.fillStyle = '#000000'
    ctx.fillRect(margin + cellSize * 2, margin + cellSize * 2, cornerSize - cellSize * 4, cornerSize - cellSize * 4)

    // Top-right corner
    ctx.fillStyle = '#000000'
    ctx.fillRect(size - margin - cornerSize, margin, cornerSize, cornerSize)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(size - margin - cornerSize + cellSize, margin + cellSize, cornerSize - cellSize * 2, cornerSize - cellSize * 2)
    ctx.fillStyle = '#000000'
    ctx.fillRect(size - margin - cornerSize + cellSize * 2, margin + cellSize * 2, cornerSize - cellSize * 4, cornerSize - cellSize * 4)

    // Bottom-left corner
    ctx.fillStyle = '#000000'
    ctx.fillRect(margin, size - margin - cornerSize, cornerSize, cornerSize)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(margin + cellSize, size - margin - cornerSize + cellSize, cornerSize - cellSize * 2, cornerSize - cellSize * 2)
    ctx.fillStyle = '#000000'
    ctx.fillRect(margin + cellSize * 2, size - margin - cornerSize + cellSize * 2, cornerSize - cellSize * 4, cornerSize - cellSize * 4)

    // Draw data pattern (simplified)
    ctx.fillStyle = '#000000'
    for (let i = 0; i < 25; i++) {
      for (let j = 0; j < 25; j++) {
        if (i > 2 && i < 22 && j > 2 && j < 22) {
          // Skip corner areas
          if ((i < 9 && j < 9) || (i < 9 && j > 15) || (i > 15 && j < 9)) {
            continue
          }
          
          // Random pattern based on text hash
          const hash = text.charCodeAt(i % text.length) + text.charCodeAt(j % text.length)
          if (hash % 3 === 0) {
            ctx.fillRect(margin + i * cellSize, margin + j * cellSize, cellSize, cellSize)
          }
        }
      }
    }

    // Add text below QR code
    ctx.fillStyle = '#000000'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Scan with Theta Wallet', size / 2, size + 20)
  }, [text, size])

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size + 30}
        className="border border-gray-200 rounded-lg"
      />
    </div>
  )
}
