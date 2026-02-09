import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Home from './pages/home/Home.tsx'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import Layout from './layout/Layout.tsx'
import Schedule from './pages/schedule/Schedule.tsx'
import Songs from './pages/songs/Songs.tsx'
import Gallery from './pages/gallery/Gallery.tsx'
import homeLoader from './pages/home/homeLoader.ts'
import scheduleLoader from './pages/schedule/scheduleLoader.ts'
import songsLoader from './pages/songs/songsLoader.ts'
import galleryLoader from './pages/gallery/galleryLoader.ts'
import About from './pages/about/About.tsx'
import Contact from './pages/contact/Contact.tsx'

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/home" />,
      },
      {
        path: '/home',
        element: <Home />,
        loader: homeLoader,
      },
      {
        path: "/schedule",
        element: <Schedule />,
        loader: scheduleLoader,
      },
      {
        path: "/songs",
        element: <Songs />,
        loader: songsLoader,
      },
      {
        path: "/gallery",
        element: <Gallery />,
        loader: galleryLoader,
      },
      {
        path: "/about",
        element: <About />,
      },
      {
        path: "/contact",
        element: <Contact />,
      }
    ]
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)

