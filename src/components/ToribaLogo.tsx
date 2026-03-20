import React from 'react'

export const ToribaLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="50" cy="50" r="50" fill="currentColor" />
    <path
      d="M44 28 C44 24.686 46.686 22 50 22 C53.314 22 56 24.686 56 28 L56 72 C56 75.314 53.314 78 50 78 C46.686 78 44 75.314 44 72 L44 28 Z"
      fill="white"
    />
    <path
      d="M24 35 C24 31 18 31 18 35 C18 55 28 68 36 74 C38 75.5 41 72 39 70 C32 65 24 53 24 35 Z"
      fill="white"
    />
    <path
      d="M76 35 C76 31 82 31 82 35 C82 55 72 68 64 74 C62 75.5 59 72 61 70 C68 65 76 53 76 35 Z"
      fill="white"
    />
  </svg>
)
