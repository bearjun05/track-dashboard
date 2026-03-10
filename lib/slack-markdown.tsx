'use client'

import React from 'react'
import { cn } from '@/lib/utils'

const URL_REGEX = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi
const SLACK_LINK_REGEX = /<([^|>]+)\|([^>]+)>/g
const MENTION_REGEX = /@(\w+)/g

function isUrl(str: string): boolean {
  return /^(https?:\/\/|www\.)/i.test(str)
}

function hrefForUrl(url: string): string {
  if (/^www\./i.test(url)) return `https://${url}`
  return url
}

/** Parse Slack-style markdown into tokens for rendering */
function tokenize(text: string): Array<{ type: string; value: string; raw?: string }> {
  if (!text) return []
  const tokens: Array<{ type: string; value: string; raw?: string }> = []
  let remaining = text

  while (remaining.length > 0) {
    // Code block (```...```) - highest priority
    const codeBlockMatch = remaining.match(/^```([\s\S]*?)```/)
    if (codeBlockMatch) {
      tokens.push({ type: 'code_block', value: codeBlockMatch[1].trim(), raw: codeBlockMatch[0] })
      remaining = remaining.slice(codeBlockMatch[0].length)
      continue
    }

    // Inline code (`...`)
    const inlineCodeMatch = remaining.match(/^`([^`]+)`/)
    if (inlineCodeMatch) {
      tokens.push({ type: 'code', value: inlineCodeMatch[1], raw: inlineCodeMatch[0] })
      remaining = remaining.slice(inlineCodeMatch[0].length)
      continue
    }

    // Slack link <url|text>
    const slackLinkMatch = remaining.match(/^<([^|>]+)\|([^>]+)>/)
    if (slackLinkMatch) {
      tokens.push({ type: 'link', value: slackLinkMatch[2], raw: slackLinkMatch[1] })
      remaining = remaining.slice(slackLinkMatch[0].length)
      continue
    }

    // Bold *text* (must not be followed by another *)
    const boldMatch = remaining.match(/^\*([^*]+)\*/)
    if (boldMatch) {
      tokens.push({ type: 'bold', value: boldMatch[1] })
      remaining = remaining.slice(boldMatch[0].length)
      continue
    }

    // Italic _text_
    const italicMatch = remaining.match(/^_([^_]+)_/)
    if (italicMatch) {
      tokens.push({ type: 'italic', value: italicMatch[1] })
      remaining = remaining.slice(italicMatch[0].length)
      continue
    }

    // Strikethrough ~text~
    const strikeMatch = remaining.match(/^~([^~]+)~/)
    if (strikeMatch) {
      tokens.push({ type: 'strikethrough', value: strikeMatch[1] })
      remaining = remaining.slice(strikeMatch[0].length)
      continue
    }

    // Block quote > at line start (handled in block mode)
    // @mention
    const mentionMatch = remaining.match(/^@(\w+)/)
    if (mentionMatch) {
      tokens.push({ type: 'mention', value: mentionMatch[1] })
      remaining = remaining.slice(mentionMatch[0].length)
      continue
    }

    // URL (auto-detect)
    const urlMatch = remaining.match(/^(https?:\/\/[^\s]+|www\.[^\s]+)/i)
    if (urlMatch) {
      tokens.push({ type: 'url', value: urlMatch[1] })
      remaining = remaining.slice(urlMatch[1].length)
      continue
    }

    // Take one character as plain text
    tokens.push({ type: 'text', value: remaining[0] })
    remaining = remaining.slice(1)
  }

  return tokens
}

/** Render a single line (or block) with inline formatting */
function renderInline(tokens: Array<{ type: string; value: string; raw?: string }>, baseClass: string) {
  return tokens.map((t, i) => {
    switch (t.type) {
      case 'bold':
        return <strong key={i} className="font-semibold">{renderInline(tokenize(t.value), baseClass)}</strong>
      case 'italic':
        return <em key={i} className="italic">{renderInline(tokenize(t.value), baseClass)}</em>
      case 'strikethrough':
        return <span key={i} className="line-through">{renderInline(tokenize(t.value), baseClass)}</span>
      case 'code':
        return (
          <code key={i} className={cn('rounded px-1 py-0.5 font-mono text-[12px] bg-foreground/[0.04]', baseClass)}>
            {t.value}
          </code>
        )
      case 'link':
        return (
          <a key={i} href={t.raw} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
            {t.value}
          </a>
        )
      case 'url':
        return (
          <a key={i} href={hrefForUrl(t.value)} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
            {t.value}
          </a>
        )
      case 'mention':
        return (
          <span key={i} className="rounded bg-blue-500/15 px-1 py-0.5 font-medium text-blue-600">
            @{t.value}
          </span>
        )
      case 'text':
        return <React.Fragment key={i}>{t.value}</React.Fragment>
      case 'code_block':
        return (
          <code key={i} className={cn('rounded px-1 py-0.5 font-mono text-[12px] bg-foreground/[0.04] whitespace-pre-wrap', baseClass)}>
            {t.value}
          </code>
        )
      default:
        return <React.Fragment key={i}>{t.value}</React.Fragment>
    }
  })
}

/** Split text into lines and detect block-level elements */
function parseBlocks(text: string): Array<{ type: 'blockquote' | 'bullet' | 'numbered' | 'code_block' | 'paragraph'; content: string; num?: number }> {
  const lines = text.split('\n')
  const blocks: Array<{ type: 'blockquote' | 'bullet' | 'numbered' | 'code_block' | 'paragraph'; content: string; num?: number }> = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Code block
    if (line.startsWith('```')) {
      const start = i
      i++
      while (i < lines.length && !lines[i].startsWith('```')) i++
      const content = lines.slice(start + 1, i).join('\n')
      blocks.push({ type: 'code_block', content })
      i++
      continue
    }

    // Block quote
    if (line.startsWith('>')) {
      const content = line.replace(/^>\s?/, '')
      blocks.push({ type: 'blockquote', content })
      i++
      continue
    }

    // Bullet list (- or •)
    if (/^[-•]\s/.test(line) || /^\*\s/.test(line)) {
      blocks.push({ type: 'bullet', content: line.replace(/^[-•*]\s+/, '') })
      i++
      continue
    }

    // Numbered list
    const numMatch = line.match(/^(\d+)\.\s+(.*)/)
    if (numMatch) {
      blocks.push({ type: 'numbered', content: numMatch[2], num: parseInt(numMatch[1], 10) })
      i++
      continue
    }

    // Paragraph
    if (line.trim()) {
      blocks.push({ type: 'paragraph', content: line })
    }
    i++
  }

  return blocks
}

export function SlackMarkdown({ text, className }: { text: string; className?: string }) {
  if (!text) return null

  const baseClass = 'text-foreground/70'
  const codeBgClass = 'bg-foreground/[0.04]'

  const blocks = parseBlocks(text)

  return (
    <span className={cn('slack-markdown', baseClass, className)}>
      {blocks.map((block, bi) => {
        switch (block.type) {
          case 'code_block':
            return (
              <pre
                key={bi}
                className={cn('my-1.5 overflow-x-auto rounded-md px-2.5 py-2 font-mono text-[12px]', codeBgClass)}
              >
                <code>{block.content}</code>
              </pre>
            )
          case 'blockquote':
            return (
              <blockquote key={bi} className={cn('border-l-2 border-foreground/15 pl-2 my-1', baseClass)}>
                {renderInline(tokenize(block.content), baseClass)}
              </blockquote>
            )
          case 'bullet':
            return (
              <div key={bi} className="flex gap-1.5 my-0.5">
                <span className="text-foreground/40">•</span>
                <span>{renderInline(tokenize(block.content), baseClass)}</span>
              </div>
            )
          case 'numbered':
            return (
              <div key={bi} className="flex gap-1.5 my-0.5">
                <span className="text-foreground/40">{block.num ?? bi + 1}.</span>
                <span>{renderInline(tokenize(block.content), baseClass)}</span>
              </div>
            )
          case 'paragraph':
          default:
            return (
              <span key={bi}>
                {renderInline(tokenize(block.content), baseClass)}
                {bi < blocks.length - 1 && '\n'}
              </span>
            )
        }
      })}
    </span>
  )
}
