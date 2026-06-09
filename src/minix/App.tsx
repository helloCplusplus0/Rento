import { RouterProvider } from 'react-router-dom'

import { AlertManagerProvider } from '@/components/providers/AlertManagerProvider'

import { router } from './router/index'

export default function App() {
  return (
    <AlertManagerProvider>
      <RouterProvider router={router} />
    </AlertManagerProvider>
  )
}
