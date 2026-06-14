'use client'
import { useState, useEffect } from 'react'

export function RainBg() {
  const [drops, setDrops] = useState<{ left: string; height: string; delay: string; duration: string }[]>([])

  useEffect(() => {
    setDrops(Array.from({ length: 30 }, () => ({
      left: `${Math.random() * 100}%`,
      height: `${40 + Math.random() * 60}px`,
      delay: `${Math.random() * 4}s`,
      duration: `${0.8 + Math.random() * 1.2}s`,
    })))
  }, [])

  return (
    <div className="rain-bg">
      {drops.map((d, i) => (
        <div key={i} className="rain-drop" style={{
          left: d.left, height: d.height,
          animationDelay: d.delay, animationDuration: d.duration,
          top: `-${d.height}`,
        }} />
      ))}
    </div>
  )
}
