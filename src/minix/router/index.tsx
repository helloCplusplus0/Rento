import { createBrowserRouter } from 'react-router-dom'

import { MinixShellLayout } from '../layout/MinixShellLayout'
import { HomePage } from '../routes/HomePage'
import { NotFoundPage } from '../routes/NotFoundPage'
import { PlaceholderPage } from '../routes/PlaceholderPage'
import { minixPrimaryRoutes } from '../routes/route-manifest'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MinixShellLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <HomePage /> },
      ...minixPrimaryRoutes.map((route) => ({
        path: route.path,
        element: <PlaceholderPage route={route} />,
      })),
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
