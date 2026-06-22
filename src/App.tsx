import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { LoginPage } from '@/pages/auth/LoginPage'
import { SignupPage } from '@/pages/auth/SignupPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { Suspense, lazy } from 'react'

const OnboardingPage   = lazy(() => import('@/pages/onboarding/OnboardingPage').then(m => ({ default: m.OnboardingPage })))
const MembersPage      = lazy(() => import('@/pages/members/MembersPage').then(m => ({ default: m.MembersPage })))
const MemberDetailPage = lazy(() => import('@/pages/members/MemberDetailPage').then(m => ({ default: m.MemberDetailPage })))
const PastorsPage      = lazy(() => import('@/pages/pastors/PastorsPage').then(m => ({ default: m.PastorsPage })))
const PastorDetailPage = lazy(() => import('@/pages/pastors/PastorDetailPage').then(m => ({ default: m.PastorDetailPage })))
const BranchesPage     = lazy(() => import('@/pages/branches/BranchesPage').then(m => ({ default: m.BranchesPage })))
const FamiliesPage     = lazy(() => import('@/pages/families/FamiliesPage').then(m => ({ default: m.FamiliesPage })))
const ChildrenPage     = lazy(() => import('@/pages/children/ChildrenPage').then(m => ({ default: m.ChildrenPage })))
const VolunteersPage   = lazy(() => import('@/pages/volunteers/VolunteersPage').then(m => ({ default: m.VolunteersPage })))
const FellowshipsPage      = lazy(() => import('@/pages/fellowships/FellowshipsPage').then(m => ({ default: m.FellowshipsPage })))
const FellowshipDetailPage = lazy(() => import('@/pages/fellowships/FellowshipDetailPage').then(m => ({ default: m.FellowshipDetailPage })))
const EventsPage       = lazy(() => import('@/pages/events/EventsPage').then(m => ({ default: m.EventsPage })))
const EventDetailPage  = lazy(() => import('@/pages/events/EventDetailPage').then(m => ({ default: m.EventDetailPage })))
const ServicePage      = lazy(() => import('@/pages/service/ServicePage').then(m => ({ default: m.ServicePage })))
const ActivityPage     = lazy(() => import('@/pages/activity/ActivityPage').then(m => ({ default: m.ActivityPage })))
const PrayerPage       = lazy(() => import('@/pages/prayer/PrayerPage').then(m => ({ default: m.PrayerPage })))
const PastoralPage     = lazy(() => import('@/pages/pastoral/PastoralPage').then(m => ({ default: m.PastoralPage })))
const CollectionsPage  = lazy(() => import('@/pages/collections/CollectionsPage').then(m => ({ default: m.CollectionsPage })))
const ExpensesPage     = lazy(() => import('@/pages/expenses/ExpensesPage').then(m => ({ default: m.ExpensesPage })))
const CommunicationPage= lazy(() => import('@/pages/communication/CommunicationPage').then(m => ({ default: m.CommunicationPage })))
const LMSPage          = lazy(() => import('@/pages/lms/LMSPage').then(m => ({ default: m.LMSPage })))
const HRPage           = lazy(() => import('@/pages/hr/HRPage').then(m => ({ default: m.HRPage })))
const PropertyPage     = lazy(() => import('@/pages/property/PropertyPage').then(m => ({ default: m.PropertyPage })))
const FacilityPage     = lazy(() => import('@/pages/facility/FacilityPage').then(m => ({ default: m.FacilityPage })))
const ReportsPage      = lazy(() => import('@/pages/reports/ReportsPage').then(m => ({ default: m.ReportsPage })))
const UsersPage        = lazy(() => import('@/pages/users/UsersPage').then(m => ({ default: m.UsersPage })))
const RolesPage        = lazy(() => import('@/pages/roles/RolesPage').then(m => ({ default: m.RolesPage })))
const TemplatesPage    = lazy(() => import('@/pages/templates/TemplatesPage').then(m => ({ default: m.TemplatesPage })))
const SettingsPage     = lazy(() => import('@/pages/settings/SettingsPage').then(m => ({ default: m.SettingsPage })))
const BillingPage      = lazy(() => import('@/pages/billing/BillingPage').then(m => ({ default: m.BillingPage })))
const SearchPage       = lazy(() => import('@/pages/search/SearchPage').then(m => ({ default: m.SearchPage })))
const ProjectsPage     = lazy(() => import('@/pages/projects/ProjectsPage').then(m => ({ default: m.ProjectsPage })))
const WorkflowsPage    = lazy(() => import('@/pages/workflows/WorkflowsPage').then(m => ({ default: m.WorkflowsPage })))
const CemeteryPage     = lazy(() => import('@/pages/cemetery/CemeteryPage').then(m => ({ default: m.CemeteryPage })))

function PageLoader() {
  return (
    <div className="flex h-40 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/login"  element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Protected */}
            <Route element={<ProtectedRoute />}>
              <Route path="/onboard" element={<OnboardingPage />} />
              <Route element={<AppLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard"      element={<DashboardPage />} />
                <Route path="/members"        element={<MembersPage />} />
                <Route path="/members/:id"    element={<MemberDetailPage />} />
                <Route path="/pastors"        element={<PastorsPage />} />
                <Route path="/pastors/:id"    element={<PastorDetailPage />} />
                <Route path="/branches"       element={<BranchesPage />} />
                <Route path="/families"       element={<FamiliesPage />} />
                <Route path="/children"       element={<ChildrenPage />} />
                <Route path="/volunteers"     element={<VolunteersPage />} />
                <Route path="/fellowships"    element={<FellowshipsPage />} />
                <Route path="/fellowships/:id" element={<FellowshipDetailPage />} />
                <Route path="/events"         element={<EventsPage />} />
                <Route path="/events/:id"     element={<EventDetailPage />} />
                <Route path="/service"        element={<ServicePage />} />
                <Route path="/activity"       element={<ActivityPage />} />
                <Route path="/prayer"         element={<PrayerPage />} />
                <Route path="/pastoral"       element={<PastoralPage />} />
                <Route path="/collections"    element={<CollectionsPage />} />
                <Route path="/expenses"       element={<ExpensesPage />} />
                <Route path="/communication"  element={<CommunicationPage />} />
                <Route path="/lms"            element={<LMSPage />} />
                <Route path="/hr"             element={<HRPage />} />
                <Route path="/property"       element={<PropertyPage />} />
                <Route path="/facility"       element={<FacilityPage />} />
                <Route path="/reports"        element={<ReportsPage />} />
                <Route path="/users"          element={<UsersPage />} />
                <Route path="/roles"          element={<RolesPage />} />
                <Route path="/templates"      element={<TemplatesPage />} />
                <Route path="/settings"       element={<SettingsPage />} />
                <Route path="/billing/*"      element={<BillingPage />} />
                <Route path="/search"         element={<SearchPage />} />
                <Route path="/projects"       element={<ProjectsPage />} />
                <Route path="/workflows"      element={<WorkflowsPage />} />
                <Route path="/cemetery"       element={<CemeteryPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
