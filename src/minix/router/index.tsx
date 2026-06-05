import { createBrowserRouter } from 'react-router-dom'

import { MinixShellLayout } from '../layout/MinixShellLayout'
import { ErrorPage, RouteErrorBoundary } from '../routes/ErrorPage'
import { HomePage } from '../routes/HomePage'
import { LoadingPage } from '../routes/LoadingPage'
import { LoginPage } from '../routes/LoginPage'
import { NotFoundPage } from '../routes/NotFoundPage'
import { OfflinePage } from '../routes/OfflinePage'
import { PlaceholderPage } from '../routes/PlaceholderPage'
import { minixPrimaryRoutes } from '../routes/route-manifest'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/offline',
    element: <OfflinePage />,
  },
  {
    path: '/loading',
    element: <LoadingPage />,
  },
  {
    path: '/error',
    element: <ErrorPage />,
  },
  {
    path: '/404',
    element: <NotFoundPage />,
  },
  {
    path: '/',
    element: <MinixShellLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <HomePage /> },
      ...minixPrimaryRoutes.map((route) => ({
        path: route.segment,
        element: <PlaceholderPage route={route} />,
      })),
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
