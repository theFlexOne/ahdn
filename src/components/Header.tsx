import { cn } from '@/lib/utils'
import ahdnLogo from '../assets/AHDN-logo.svg'
import facebookBadge from '/badges/facebook-badge.svg'
import youtubeBadge from '/badges/youtube-badge.svg'
import xBadge from '/badges/x-badge.svg'

export default function Header({ className }: { className?: string }) {
  className = cn('flex bg-white/90 border border-white/80 rounded-b-sm py-2 px-4 items-center', className)
  return (
    <header className={className}>
      <a href="/">
        <img src={ahdnLogo} alt="A Hard Day's Night logo" width={150} />
      </a>

      <ul className='mx-auto flex gap-2'>
        <li>
          <a href="/">
            <img src={facebookBadge} alt="Facebook badge" width={40} />
          </a>
        </li>
        <li>
          <a href="/">
            <img src={youtubeBadge} alt="YouTube badge" width={40} />
          </a>
        </li>
        <li>
          <a href="/">
            <img src={xBadge} alt="X badge" width={40} />
          </a>
        </li>
      </ul>

      <nav className="font-gl text-2xl">
        <ul className="flex gap-4 items-center">
          <li>
            <a href="/schedule">Schedule</a>
          </li>
          <li>
            <a href="/songs">Songs</a>
          </li>
          <li>
            <a href="/gallery">Gallery</a>
          </li>
          <li>
            <a href="/about">About</a>
          </li>
          <li>
            <a href="/tech">Tech</a>
          </li>
          <li>
            <a href="/contact">Contact</a>
          </li>
        </ul>
      </nav>
    </header>
  )
}
