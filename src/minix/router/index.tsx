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
  BillDetailRoute,
  BillDetailRouteErrorBoundary,
  billDetailLoader,
} from '../routes/bills/BillDetailRoute'
import {
  BillListRoute,
  BillListRouteErrorBoundary,
  billListLoader,
} from '../routes/bills/BillListRoute'
import {
  BillStatsRoute,
  BillStatsRouteErrorBoundary,
  billStatsLoader,
} from '../routes/bills/BillStatsRoute'
import {
  CreateBillRoute,
  CreateBillRouteErrorBoundary,
  createBillLoader,
} from '../routes/bills/CreateBillRoute'
import {
  EditBillRoute,
  EditBillRouteErrorBoundary,
  editBillLoader,
} from '../routes/bills/EditBillRoute'
import {
  ContractCheckoutRoute,
  ContractCheckoutRouteErrorBoundary,
  contractCheckoutLoader,
} from '../routes/contracts/ContractCheckoutRoute'
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
        element: <ContractCheckoutRoute />,
        loader: contractCheckoutLoader,
        errorElement: <ContractCheckoutRouteErrorBoundary />,
      },
      {
        path: 'bills',
        element: <BillListRoute />,
        loader: billListLoader,
        errorElement: <BillListRouteErrorBoundary />,
      },
      {
        path: 'bills/stats',
        element: <BillStatsRoute />,
        loader: billStatsLoader,
        errorElement: <BillStatsRouteErrorBoundary />,
      },
      {
        path: 'bills/create',
        element: <CreateBillRoute />,
        loader: createBillLoader,
        errorElement: <CreateBillRouteErrorBoundary />,
      },
      {
        path: 'bills/:id',
        element: <BillDetailRoute />,
        loader: billDetailLoader,
        errorElement: <BillDetailRouteErrorBoundary />,
      },
      {
        path: 'bills/:id/edit',
        element: <EditBillRoute />,
        loader: editBillLoader,
        errorElement: <EditBillRouteErrorBoundary />,
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
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
