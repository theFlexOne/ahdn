import { cn } from '@/lib/utils'
import facebookBadge from '@/assets/badges/fb_badge.svg'
import youtubeBadge from '@/assets/badges/yt_badge.svg'
import xBadge from '@/assets/badges/x_badge.svg'

export default function Footer({ className }: { className?: string }) {
  return (
    <footer className={cn('flex bg-white/90 border border-white/80 rounded-t-sm py-8 px-4 items-center justify-center gap-16', className)}>
      <p className='text-sm'>©2013 A Hard Day's Night</p>
      <ul className='flex gap-2'>
        <li>
          <a href="/">
            <img src={facebookBadge} alt="Facebook badge" width={30} />
          </a>
        </li>
        <li>
          <a href="/">
            <img src={youtubeBadge} alt="YouTube badge" width={30} />
          </a>
        </li>
        <li>
          <a href="/">
            <img src={xBadge} alt="X badge" width={30} />
          </a>
        </li>
      </ul>
    </footer>
  )
}
