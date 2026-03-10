'use client'

import React from 'react'

const URL_REGEX = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi

function isUrl(str: string): boolean {
  return /^(https?:\/\/|www\.)/i.test(str)
}

function hrefForUrl(url: string): string {
  if (/^www\./i.test(url)) {
    return `https://${url}`
  }
  return url
}

export function Linkify({ text, className }: { text: string; className?: string }) {
  if (!text) return null

  const parts = text.split(URL_REGEX)

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (isUrl(part)) {
          return (
            <a
              key={i}
              href={hrefForUrl(part)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              {part}
            </a>
          )
        }
        return <React.Fragment key={i}>{part}</React.Fragment>
      })}
    </span>
  )
}
