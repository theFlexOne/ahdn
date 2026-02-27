import { cn } from '@/lib/utils'

export default function Header2({ className }: { className?: string }) {
  className = cn('flex bg-black text-gray-300 py-4 px-4 items-center', className)
  return (
    <header className={className}>
      <nav className="w-full font-gl text-2xl">
        <ul className="flex w-full items-center">
          <li className="flex-1 text-center">
            <a href="/schedule">Schedule</a>
          </li>
          <li className="flex-1 text-center">
            <a href="/songs">Songs</a>
          </li>
          <li className="flex-1 text-center">
            <a href="/gallery">Gallery</a>
          </li>
          <li className="flex-1 text-center">
            <a href="/about">About</a>
          </li>
          <li className="flex-1 text-center">
            <a href="/tech">Tech</a>
          </li>
          <li className="flex-1 text-center">
            <a href="/contact">Contact</a>
          </li>
        </ul>
      </nav>
    </header>
  )
}
