/**
 * Devices layout route - renders child routes
 */

import { createFileRoute, Outlet } from '@tanstack/react-router'

function DevicesLayout() {
  return <Outlet />
}

export const Route = createFileRoute('/devices')({
  component: DevicesLayout,
})
