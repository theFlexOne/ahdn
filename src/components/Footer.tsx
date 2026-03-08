import { cn } from '@/lib/utils'
import FacebookBadge from '@/assets/badges/fb_badge_outline.svg?react'
import YoutubeBadge from '@/assets/badges/yt_badge_outline.svg?react'
import XBadge from '@/assets/badges/x_badge_outline.svg?react'

export default function Footer({ className }: { className?: string }) {
  return (
    <footer className={cn(
      'flex flex-col bg-black text-gray-200 py-6 px-4 items-center justify-center gap-4 relative',
      'after:content-[""] after:absolute after:w-full after:h-4 after:bg-[linear-gradient(to_bottom,#040404_0%,#020202_50%,#000000_100%)] after:top-0 after:left-0',
      className
    )}>
      <ul className='flex gap-4'>
        <li>
          <a href="/">
            <FacebookBadge className='w-10 h-10' />
          </a>
        </li>
        <li>
          <a href="/">
            <YoutubeBadge className='w-10 h-10' />
          </a>
        </li>
        <li>
          <a href="/">
            <XBadge className='w-10 h-10' />
          </a>
        </li>
      </ul>
      <p className='text-sm'>©2013 A Hard Day's Night</p>
    </footer>
  )
}
