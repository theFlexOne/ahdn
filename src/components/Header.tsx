import { Link } from 'react-router';

import { cn } from '@/lib/utils';

export default function Header({ className }: { className?: string }) {
  return (
    <header className={cn(
      'flex bg-black text-gray-200 py-4 px-4 items-center w-full fixed font-default font-bold',
      'after:content-[""] after:absolute after:w-full after:h-4 after:bg-[linear-gradient(to_top,#040404_0%,#020202_50%,#000000_100%)] after:bottom-0 after:left-0',
      className
    )}>
      <nav className="w-full text-2xl uppercase">
        <ul className="flex w-full items-center">
          <li className="flex flex-1 items-center justify-center">
            <Link to="/bio">Bio</Link>
          </li>
          <li className="flex flex-1 items-center justify-center">
            <Link to="/schedule">Schedule</Link>
          </li>
          <li className="flex flex-1 items-center justify-center">
            <Link to="/song-list">Song List</Link>
          </li>
          <li className="flex flex-1 items-center justify-center">
            <Link to="/gallery">Gallery</Link>
          </li>
          <li className="flex flex-1 items-center justify-center">
            <Link to="/contact">Contact</Link>
          </li>
        </ul>
      </nav>
    </header>
  )
}
