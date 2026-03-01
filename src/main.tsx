import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import './index.css'

import Layout2 from './layout/Layout2.tsx'
import Home2 from './pages/home/Home2.tsx'
import { FbClientProvider } from './context/fb/FbClientProvider.tsx'
import homeLoader2 from './pages/home/homeLoader.ts'

const router = createBrowserRouter([
  {
    element: <Layout2 />,
    children: [
      {
        path: "*",
        element: <Home2 />,
        loader: homeLoader2
      }
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