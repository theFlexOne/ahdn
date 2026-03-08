import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { FbClientProvider } from './context/fb/FbClientProvider.tsx'

import Home from './pages/home/Home.tsx'
import Gallery from './pages/gallery/Gallery.tsx'
import Contact from './pages/contact/Contact.tsx'
import About from './pages/about/About.tsx'
import Layout from './layout/Layout.tsx'
import homeLoader from './pages/home/homeLoader.ts'
import galleryLoader from './pages/gallery/galleryLoader.ts'

import './index.css'

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <Home />,
        loader: homeLoader
      },
      {
        path: "/about",
        element: <About />
      },
      {
        path: "/gallery",
        element: <Gallery />,
        loader: galleryLoader
      },
      {
        path: "/contact",
        element: <Contact />
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

/*   
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
*/