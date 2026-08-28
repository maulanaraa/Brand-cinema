import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import AdminLayout from './components/admin/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'

// Public pages
import HomePage from './pages/HomePage'
import MoviesPage from './pages/MoviesPage'
import MovieDetailsPage from './pages/MovieDetailsPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import UnauthorizedPage from './pages/UnauthorizedPage'
import NotFoundPage from './pages/NotFoundPage'

// User pages
import BookingsPage from './pages/user/BookingsPage'
import BookingDetailsPage from './pages/user/BookingDetailsPage'
import BookingPage from './pages/user/BookingPage'
import SeatSelectionPage from './pages/user/SeatSelectionPage' 
import SnackSelectionPage from './pages/user/SnackSelectionPage'
import PaymentPage from './pages/user/PaymentPage'
import OrderSummaryPage from './pages/user/OrderSummaryPage'
import PaymentInstructionPage from './pages/user/PaymentInstructionPage'
import BookingConfirmationPage from './pages/user/BookingConfirmationPage'
import BookingPendingPage from './pages/user/BookingPendingPage'
import BookingFailedPage from './pages/user/BookingFailedPage'
import BookingPaymentFinishPage from './pages/user/BookingPaymentFinishPage'
import ProfilePage from './pages/user/ProfilePage'

// Admin pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminMoviesPage from './pages/admin/AdminMoviesPage'
import AdminHallsPage from './pages/admin/AdminHallsPage'
import AdminShowtimesPage from './pages/admin/AdminShowtimesPage'
import AdminBookingsPage from './pages/admin/AdminBookingsPage'
import AdminBookingDetailsPage from './pages/admin/AdminBookingDetailsPage' 
//import AdminReportsPage from './pages/admin/AdminReport' 
import AdminCarouselPage from './pages/admin/AdminCarouselPage'
import AdminReportsPage from './pages/admin/AdminReport'
import AdminConcessionsPage from './pages/admin/AdminConcessionsPage'
import AdminCitiesPage from './pages/admin/AdminCitiesPage'
import AdminCinemasPage from './pages/admin/AdminCinemasPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'

function App() {
  useAuth()

  return (
    <Routes>
      {/* Public and User routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="movies" element={<MoviesPage />} />
        <Route path="movies/:id" element={<MovieDetailsPage />} /> {/* keep consistent plural */}
        <Route path="book/:movieId" element={
          <ProtectedRoute>
            <BookingPage />
          </ProtectedRoute>
        } />
        <Route path="booking/:showtimeId" element={
          <ProtectedRoute>
            <BookingPage />
          </ProtectedRoute>
        } />
        <Route path="showtimes/:showtimeId/book" element={
          <ProtectedRoute>
            <BookingPage />
          </ProtectedRoute>
        } />
        <Route path="seat-selection/:movieId" element={
          <ProtectedRoute>
            <SeatSelectionPage />
          </ProtectedRoute>
        } />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />

        {/* Protected user routes */}
        <Route path="bookings" element={
          <ProtectedRoute>
            <BookingsPage />
          </ProtectedRoute>
        } />
        <Route path="my-bookings" element={
          <ProtectedRoute>
            <BookingsPage />
          </ProtectedRoute>
        } />
        <Route path="bookings/:id/success" element={<BookingConfirmationPage />} />
        <Route path="bookings/:id/pending" element={
          <ProtectedRoute>
            <BookingPendingPage />
          </ProtectedRoute>
        } />
        <Route path="bookings/:id/failed" element={
          <ProtectedRoute>
            <BookingFailedPage />
          </ProtectedRoute>
        } />
        <Route path="bookings/:id/payment/finish" element={
          <ProtectedRoute>
            <BookingPaymentFinishPage />
          </ProtectedRoute>
        } />
        <Route path="bookings/:id/summary" element={
          <ProtectedRoute>
            <OrderSummaryPage />
          </ProtectedRoute>
        } />
        <Route path="bookings/:id/pay" element={
          <ProtectedRoute>
            <PaymentPage />
          </ProtectedRoute>
        } />
        <Route path="bookings/:id/pay/instruction" element={
          <ProtectedRoute>
            <PaymentInstructionPage />
          </ProtectedRoute>
        } />
        <Route path="bookings/:id" element={
          <ProtectedRoute>
            <BookingDetailsPage />
          </ProtectedRoute>
        } />
        <Route path="tickets/:id" element={
          <ProtectedRoute>
            <BookingDetailsPage />
          </ProtectedRoute>
        } />
        <Route path="profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="snack-selection" element={
          <ProtectedRoute>
            <SnackSelectionPage />
          </ProtectedRoute>
        } />
        <Route path="payment" element={
          <ProtectedRoute>
            <PaymentPage />
          </ProtectedRoute>
        } />
        <Route path="booking-confirmation" element={
          <ProtectedRoute>
            <BookingConfirmationPage />
          </ProtectedRoute>
        } />
        <Route path="unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin/login" element={<Navigate to="/login" replace />} />
      <Route path="/admin" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboardPage />} />
        <Route path="movies" element={<AdminMoviesPage />} />
        <Route path="movies/new" element={<AdminMoviesPage />} />
        <Route path="movies/:movieId/edit" element={<AdminMoviesPage />} />
        <Route path="cities" element={<AdminCitiesPage />} />
        <Route path="cinemas" element={<AdminCinemasPage />} />
        <Route path="halls" element={<AdminHallsPage />} />
        <Route path="showtimes" element={<AdminShowtimesPage />} />
        <Route path="showtimes/new" element={<AdminShowtimesPage />} />
        <Route path="showtimes/:showtimeId/edit" element={<AdminShowtimesPage />} />
        <Route path="bookings" element={<AdminBookingsPage />} />
        <Route path="bookings/:id" element={<AdminBookingDetailsPage />} />
        <Route path="carousel" element={<AdminCarouselPage />} />
        <Route path="concessions" element={<AdminConcessionsPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
      </Route>
    </Routes>
  )
}

export default App
