import { cn } from '@/lib/utils'
import FacebookBadge from '@/assets/badges/fb_badge_outline.svg?react'
import YoutubeBadge from '@/assets/badges/yt_badge_outline.svg?react'
import XBadge from '@/assets/badges/x_badge_outline.svg?react'

export default function Footer2({ className }: { className?: string }) {
  return (
    <footer className={cn('flex bg-white/90 border border-white/80 rounded-t-sm py-8 px-4 items-center justify-center gap-16', className)}>
      <p className='text-sm'>©2013 A Hard Day's Night</p>
      <ul className='flex gap-2'>
        <li>
          <a href="/">
            <FacebookBadge />
          </a>
        </li>
        <li>
          <a href="/">
            <YoutubeBadge />
          </a>
        </li>
        <li>
          <a href="/">
            <XBadge />
          </a>
        </li>
      </ul>
    </footer>
  )
}
