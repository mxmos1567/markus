import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/public/HomePage'
import { SlotPage } from './pages/public/SlotPage'
import { TimelinePage } from './pages/public/TimelinePage'
import { NotFoundPage } from './pages/public/NotFoundPage'
import { LoadingScreen } from './components/common/LoadingScreen'

// The admin area is a separate chunk: public visitors scanning a shelf's
// QR code should never download dashboard/editor code they'll never use.
const LoginPage = lazy(() => import('./pages/admin/LoginPage').then((m) => ({ default: m.LoginPage })))
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const ShelvesPage = lazy(() => import('./pages/admin/ShelvesPage').then((m) => ({ default: m.ShelvesPage })))
const ShelfDetailPage = lazy(() => import('./pages/admin/ShelfDetailPage').then((m) => ({ default: m.ShelfDetailPage })))
const SlotsPage = lazy(() => import('./pages/admin/SlotsPage').then((m) => ({ default: m.SlotsPage })))
const MemoriesPage = lazy(() => import('./pages/admin/MemoriesPage').then((m) => ({ default: m.MemoriesPage })))
const MemoryFormPage = lazy(() => import('./pages/admin/MemoryFormPage').then((m) => ({ default: m.MemoryFormPage })))
const UsersPage = lazy(() => import('./pages/admin/UsersPage').then((m) => ({ default: m.UsersPage })))
const QrCodesPage = lazy(() => import('./pages/admin/QrCodesPage').then((m) => ({ default: m.QrCodesPage })))
const TimelineAdminPage = lazy(() =>
  import('./pages/admin/TimelineAdminPage').then((m) => ({ default: m.TimelineAdminPage })),
)
const MediaPage = lazy(() => import('./pages/admin/MediaPage').then((m) => ({ default: m.MediaPage })))
const StatisticsPage = lazy(() => import('./pages/admin/StatisticsPage').then((m) => ({ default: m.StatisticsPage })))
const ImportExportPage = lazy(() =>
  import('./pages/admin/ImportExportPage').then((m) => ({ default: m.ImportExportPage })),
)
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const AdminLayout = lazy(() => import('./components/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })))
const AdminGuard = lazy(() => import('./components/admin/AdminGuard').then((m) => ({ default: m.AdminGuard })))

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/slot/:shelf/:slot" element={<SlotPage />} />
      <Route path="/timeline" element={<TimelinePage />} />

      <Route
        path="/admin/login"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <LoginPage />
          </Suspense>
        }
      />
      <Route
        path="/admin"
        element={
          <Suspense fallback={<LoadingScreen />}>
            <AdminGuard>
              <AdminLayout />
            </AdminGuard>
          </Suspense>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="shelves" element={<ShelvesPage />} />
        <Route path="shelves/:id" element={<ShelfDetailPage />} />
        <Route path="slots" element={<SlotsPage />} />
        <Route path="memories" element={<MemoriesPage />} />
        <Route path="memories/:id" element={<MemoryFormPage />} />
        <Route path="qr-codes" element={<QrCodesPage />} />
        <Route path="timeline" element={<TimelineAdminPage />} />
        <Route path="media" element={<MediaPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="statistics" element={<StatisticsPage />} />
        <Route path="import-export" element={<ImportExportPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
