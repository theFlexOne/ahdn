import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import './index.css'

import Layout from './layout/Layout.tsx'
import Home from './pages/home/Home.tsx'
import About from './pages/about/About.tsx'
import Schedule from './pages/schedule/Schedule.tsx'
import Songs from './pages/songs/Songs.tsx'
import Gallery from './pages/gallery/Gallery.tsx'
import Contact from './pages/contact/Contact.tsx'

import homeLoader from './pages/home/homeLoader.ts'
import scheduleLoader from './pages/schedule/scheduleLoader.ts'
import songsLoader from './pages/songs/songsLoader.ts'
import galleryLoader from './pages/gallery/galleryLoader.ts'

import Layout2 from './layout/Layout2.tsx'
import Home2 from './pages/home/Home2.tsx'
import { supabase } from './lib/supabaseClient.ts'

const router = createBrowserRouter([
  // {
  //   element: <Layout />,
  //   children: [
  //     {
  //       index: true,
  //       element: <Navigate to="/home" />,
  //     },
  //     {
  //       path: '/home',
  //       element: <Home />,
  //       loader: homeLoader,
  //     },
  //     {
  //       path: "/schedule",
  //       element: <Schedule />,
  //       loader: scheduleLoader,
  //     },
  //     {
  //       path: "/songs",
  //       element: <Songs />,
  //       loader: songsLoader,
  //     },
  //     {
  //       path: "/gallery",
  //       element: <Gallery />,
  //       loader: galleryLoader,
  //     },
  //     {
  //       path: "/about",
  //       element: <About />,
  //     },
  //     {
  //       path: "/contact",
  //       element: <Contact />,
  //     }
  //   ]
  // },
  {
    element: <Layout2 />,
    children: [
      {
        path: "*",
        element: <Home2 />,
        loader: () => {
          const { data: { publicUrl: webm } } = supabase.storage.from("videos").getPublicUrl("bg_hero_vid.av1.webm");
          const { data: { publicUrl: mp4 } } = supabase.storage.from("videos").getPublicUrl("bg_hero_vid.mp4");
          return {
            videoUrls: [
              {
                src: webm,
                type: "video/webm; codecs=\"vp9, vorbis"
              },
              {
                src: mp4,
                type: "video/mp4; codecs=\"avc1.42E01E, mp4a.40.2"
              }
            ],
          }
        },
      },
    ]
  }
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)

