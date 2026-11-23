import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import MainLayout from './components/common/MainLayout';
import AdminLayout from './components/common/AdminLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

import HomePage from './pages/public/HomePage';
import MovieDetailPage from './pages/public/MovieDetailPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import NotFoundPage from './pages/public/NotFoundPage';
import PromotionPage from './pages/public/PromotionPage';

import SeatSelectionPage from './pages/member/seatselection/SeatSelectionPage';
import CheckoutPage from './pages/member/CheckoutPage';
import BookingSuccessPage from './pages/member/BookingSuccessPage';
import MyTicketsPage from './pages/member/MyTicketsPage';

import AdminMoviesPage from './pages/admin/AdminMoviesPage';
import AdminRoomsPage from './pages/admin/AdminRoomsPage';
import AdminShowtimesPage from './pages/admin/AdminShowtimesPage';
import AdminStatsPage from './pages/admin/AdminStatsPage';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="upcoming" element={<HomePage />} />
          <Route path="movies/:id" element={<MovieDetailPage />} />
          <Route path="promotion" element={<PromotionPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />

          <Route
            path="booking/:showtimeId"
            element={
              <ProtectedRoute allowedRoles={['member', 'admin']}>
                <SeatSelectionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="checkout"
            element={
              <ProtectedRoute allowedRoles={['member', 'admin']}>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="booking-success/:bookingId"
            element={
              <ProtectedRoute allowedRoles={['member', 'admin']}>
                <BookingSuccessPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="my-tickets"
            element={
              <ProtectedRoute allowedRoles={['member', 'admin']}>
                <MyTicketsPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/movies" replace />} />
          <Route path="movies" element={<AdminMoviesPage />} />
          <Route path="rooms" element={<AdminRoomsPage />} />
          <Route path="showtimes" element={<AdminShowtimesPage />} />
          <Route path="stats" element={<AdminStatsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;