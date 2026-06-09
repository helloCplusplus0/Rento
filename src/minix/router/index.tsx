import { createBrowserRouter } from 'react-router-dom'

import { MinixRuntimeLayout } from '../layout/MinixRuntimeLayout'
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
  AddContractRoute,
  AddContractRouteErrorBoundary,
  addContractLoader,
} from '../routes/add/AddContractRoute'
import {
  AddHubRoute,
  AddHubRouteErrorBoundary,
  addHubLoader,
} from '../routes/add/AddHubRoute'
import {
  AddRoomRoute,
  AddRoomRouteErrorBoundary,
  addRoomLoader,
} from '../routes/add/AddRoomRoute'
import {
  ContractCreateRoute,
  ContractCreateRouteErrorBoundary,
  contractCreateLoader,
} from '../routes/contracts/ContractCreateRoute'
import {
  ContractDetailRoute,
  ContractDetailRouteErrorBoundary,
  contractDetailLoader,
} from '../routes/contracts/ContractDetailRoute'
import {
  ContractEditRoute,
  ContractEditRouteErrorBoundary,
  contractEditLoader,
} from '../routes/contracts/ContractEditRoute'
import {
  ContractListRoute,
  ContractListRouteErrorBoundary,
  contractListLoader,
} from '../routes/contracts/ContractListRoute'
import {
  ContractRenewRoute,
  ContractRenewRouteErrorBoundary,
  contractRenewLoader,
} from '../routes/contracts/ContractRenewRoute'
import {
  MeterReadingBatchRoute,
  MeterReadingBatchRouteErrorBoundary,
  meterReadingBatchLoader,
} from '../routes/meter-readings/MeterReadingBatchRoute'
import {
  MeterReadingHistoryRoute,
  MeterReadingHistoryRouteErrorBoundary,
  meterReadingHistoryLoader,
} from '../routes/meter-readings/MeterReadingHistoryRoute'
import {
  EditRoomRoute,
  EditRoomRouteErrorBoundary,
  editRoomLoader,
} from '../routes/rooms/EditRoomRoute'
import {
  RenterCreateRoute,
  RenterCreateRouteErrorBoundary,
  renterCreateLoader,
} from '../routes/renters/RenterCreateRoute'
import {
  RenterDetailRoute,
  RenterDetailRouteErrorBoundary,
  renterDetailLoader,
} from '../routes/renters/RenterDetailRoute'
import {
  RenterEditRoute,
  RenterEditRouteErrorBoundary,
  renterEditLoader,
} from '../routes/renters/RenterEditRoute'
import {
  RenterListRoute,
  RenterListRouteErrorBoundary,
  renterListLoader,
} from '../routes/renters/RenterListRoute'
import {
  RoomDetailRoute,
  RoomDetailRouteErrorBoundary,
  roomDetailLoader,
} from '../routes/rooms/RoomDetailRoute'
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
    element: <MinixRuntimeLayout />,
    children: [
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
            path: 'rooms/:id',
            element: <RoomDetailRoute />,
            loader: roomDetailLoader,
            errorElement: <RoomDetailRouteErrorBoundary />,
          },
          {
            path: 'rooms/:id/edit',
            element: <EditRoomRoute />,
            loader: editRoomLoader,
            errorElement: <EditRoomRouteErrorBoundary />,
          },
          {
            path: 'add',
            element: <AddHubRoute />,
            loader: addHubLoader,
            errorElement: <AddHubRouteErrorBoundary />,
          },
          {
            path: 'add/room',
            element: <AddRoomRoute />,
            loader: addRoomLoader,
            errorElement: <AddRoomRouteErrorBoundary />,
          },
          {
            path: 'add/contract',
            element: <AddContractRoute />,
            loader: addContractLoader,
            errorElement: <AddContractRouteErrorBoundary />,
          },
          {
            path: 'contracts',
            element: <ContractListRoute />,
            loader: contractListLoader,
            errorElement: <ContractListRouteErrorBoundary />,
          },
          {
            path: 'contracts/new',
            element: <ContractCreateRoute />,
            loader: contractCreateLoader,
            errorElement: <ContractCreateRouteErrorBoundary />,
          },
          {
            path: 'contracts/:id',
            element: <ContractDetailRoute />,
            loader: contractDetailLoader,
            errorElement: <ContractDetailRouteErrorBoundary />,
          },
          {
            path: 'contracts/:id/edit',
            element: <ContractEditRoute />,
            loader: contractEditLoader,
            errorElement: <ContractEditRouteErrorBoundary />,
          },
          {
            path: 'contracts/:id/renew',
            element: <ContractRenewRoute />,
            loader: contractRenewLoader,
            errorElement: <ContractRenewRouteErrorBoundary />,
          },
          {
            path: 'contracts/:id/checkout',
            lazy: async () => {
              const routeModule = await import('../routes/contracts/ContractCheckoutRoute')
              return {
                Component: routeModule.ContractCheckoutRoute,
                loader: routeModule.contractCheckoutLoader,
                ErrorBoundary: routeModule.ContractCheckoutRouteErrorBoundary,
              }
            },
          },
          {
            path: 'bills',
            lazy: async () => {
              const routeModule = await import('../routes/bills/BillListRoute')
              return {
                Component: routeModule.BillListRoute,
                loader: routeModule.billListLoader,
                ErrorBoundary: routeModule.BillListRouteErrorBoundary,
              }
            },
          },
          {
            path: 'bills/stats',
            lazy: async () => {
              const routeModule = await import('../routes/bills/BillStatsRoute')
              return {
                Component: routeModule.BillStatsRoute,
                loader: routeModule.billStatsLoader,
                ErrorBoundary: routeModule.BillStatsRouteErrorBoundary,
              }
            },
          },
          {
            path: 'bills/create',
            lazy: async () => {
              const routeModule = await import('../routes/bills/CreateBillRoute')
              return {
                Component: routeModule.CreateBillRoute,
                loader: routeModule.createBillLoader,
                ErrorBoundary: routeModule.CreateBillRouteErrorBoundary,
              }
            },
          },
          {
            path: 'bills/:id',
            lazy: async () => {
              const routeModule = await import('../routes/bills/BillDetailRoute')
              return {
                Component: routeModule.BillDetailRoute,
                loader: routeModule.billDetailLoader,
                ErrorBoundary: routeModule.BillDetailRouteErrorBoundary,
              }
            },
          },
          {
            path: 'bills/:id/edit',
            lazy: async () => {
              const routeModule = await import('../routes/bills/EditBillRoute')
              return {
                Component: routeModule.EditBillRoute,
                loader: routeModule.editBillLoader,
                ErrorBoundary: routeModule.EditBillRouteErrorBoundary,
              }
            },
          },
          {
            path: 'renters',
            element: <RenterListRoute />,
            loader: renterListLoader,
            errorElement: <RenterListRouteErrorBoundary />,
          },
          {
            path: 'renters/new',
            element: <RenterCreateRoute />,
            loader: renterCreateLoader,
            errorElement: <RenterCreateRouteErrorBoundary />,
          },
          {
            path: 'renters/:id',
            element: <RenterDetailRoute />,
            loader: renterDetailLoader,
            errorElement: <RenterDetailRouteErrorBoundary />,
          },
          {
            path: 'renters/:id/edit',
            element: <RenterEditRoute />,
            loader: renterEditLoader,
            errorElement: <RenterEditRouteErrorBoundary />,
          },
          {
            path: 'meter-readings/batch',
            element: <MeterReadingBatchRoute />,
            loader: meterReadingBatchLoader,
            errorElement: <MeterReadingBatchRouteErrorBoundary />,
          },
          {
            path: 'meter-readings/history',
            element: <MeterReadingHistoryRoute />,
            loader: meterReadingHistoryLoader,
            errorElement: <MeterReadingHistoryRouteErrorBoundary />,
          },
          {
            path: 'settings',
            element: <SettingsRoute />,
            loader: settingsLoader,
            errorElement: <SettingsRouteErrorBoundary />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
