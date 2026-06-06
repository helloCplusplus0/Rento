import { createBrowserRouter } from 'react-router-dom'

import { MinixShellLayout } from '../layout/MinixShellLayout'
import {
  redirectAuthenticatedLoginGuard,
  requireAuthenticatedGuard,
} from './guards'
import { ErrorPage, RouteErrorBoundary } from '../routes/ErrorPage'
import {
  HomePage,
  homePageLoader,
  HomePageRouteErrorBoundary,
} from '../routes/HomePage'
import { LoadingPage } from '../routes/LoadingPage'
import { LoginPage } from '../routes/LoginPage'
import { NotFoundPage } from '../routes/NotFoundPage'
import { OfflinePage } from '../routes/OfflinePage'
import {
  AddHubRoute,
  AddHubRouteErrorBoundary,
  addHubLoader,
} from '../routes/add/AddHubRoute'
import {
  BillListRoute,
  BillListRouteErrorBoundary,
  billListLoader,
} from '../routes/bills/BillListRoute'
import {
  ContractListRoute,
  ContractListRouteErrorBoundary,
  contractListLoader,
} from '../routes/contracts/ContractListRoute'
import {
  RoomListRoute,
  RoomListRouteErrorBoundary,
  roomListLoader,
} from '../routes/rooms/RoomListRoute'
import {
  SettingsRoute,
  SettingsRouteErrorBoundary,
  settingsLoader,
} from '../routes/settings/SettingsRoute'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
    loader: redirectAuthenticatedLoginGuard,
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
    loader: requireAuthenticatedGuard,
    children: [
      {
        index: true,
        element: <HomePage />,
        loader: homePageLoader,
        errorElement: <HomePageRouteErrorBoundary />,
      },
      {
        path: 'rooms',
        element: <RoomListRoute />,
        loader: roomListLoader,
        errorElement: <RoomListRouteErrorBoundary />,
      },
      {
        path: 'add',
        element: <AddHubRoute />,
        loader: addHubLoader,
        errorElement: <AddHubRouteErrorBoundary />,
      },
      {
        path: 'contracts',
        element: <ContractListRoute />,
        loader: contractListLoader,
        errorElement: <ContractListRouteErrorBoundary />,
      },
      {
        path: 'bills',
        element: <BillListRoute />,
        loader: billListLoader,
        errorElement: <BillListRouteErrorBoundary />,
      },
      {
        path: 'settings',
        element: <SettingsRoute />,
        loader: settingsLoader,
        errorElement: <SettingsRouteErrorBoundary />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
