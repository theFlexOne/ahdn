import { createBrowserRouter } from "react-router";
import { homeLoader, scheduleLoader, galleryLoader } from "./pages/loaders";
import { Bio, Contact, Gallery, Home, Schedule } from "./pages";
import Layout from "./layout";


const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        id: "home",
        path: "/",
        element: <Home />,
        loader: homeLoader
      },
      {
        id: "bio",
        path: "/bio",
        element: <Bio />
      },
      {
        id: "schedule",
        path: "/schedule",
        element: <Schedule />,
        loader: scheduleLoader
      },
      {
        id: "gallery",
        path: "/gallery",
        element: <Gallery />,
        loader: galleryLoader
      },
      {
        id: "contact",
        path: "/contact",
        element: <Contact />
      },
    ]
  }
])

export default router
