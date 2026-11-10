import { RouterProvider } from 'react-router'
import { router } from '@/routes/AppRoutes'

export function App() {
  return <RouterProvider router={router} />
}
