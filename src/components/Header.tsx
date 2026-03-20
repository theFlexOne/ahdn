import { cn } from '@/lib/utils'

export default function Header({ className }: { className?: string }) {
  return (
    <header className={cn(
      'flex bg-black text-gray-200 py-4 px-4 items-center w-full fixed',
      'after:content-[""] after:absolute after:w-full after:h-4 after:bg-[linear-gradient(to_top,#040404_0%,#020202_50%,#000000_100%)] after:bottom-0 after:left-0',
      className
    )}>
      <nav className="w-full font-[Montserrat] text-2xl">
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
