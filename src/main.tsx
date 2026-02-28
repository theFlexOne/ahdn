import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import './index.css'

import Layout2 from './layout/Layout2.tsx'
import Home2 from './pages/home/Home2.tsx'
import { supabase } from './lib/supabaseClient.ts'
import { FbClientProvider } from './context/fb/FbClientProvider.tsx'

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
                type: "video/webm"
              },
              {
                src: mp4,
                type: "video/mp4"
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
    <FbClientProvider
      initOptions={{
        appId: import.meta.env.VITE_FACEBOOK_APP_ID,
      }}
    >
      <RouterProvider router={router} />
    </FbClientProvider>
  </StrictMode>,
)
