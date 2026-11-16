import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import LoginPage from './pages/LoginPage';
import HomeRedirect from './pages/HomeRedirect';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import BookPage from './pages/customer/BookPage';
import MyBookingsPage from './pages/customer/MyBookingsPage';
import SchedulePage from './pages/owner/SchedulePage';
import ServicesPage from './pages/owner/ServicesPage';
import BarbersPage from './pages/owner/BarbersPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* everything below needs a signed in user */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<HomeRedirect />} />
              <Route path="profile" element={<ProfilePage />} />

              <Route element={<ProtectedRoute roles={['customer']} />}>
                <Route path="book" element={<BookPage />} />
                <Route path="bookings" element={<MyBookingsPage />} />
              </Route>

              <Route path="owner" element={<ProtectedRoute roles={['owner']} />}>
                <Route path="today" element={<SchedulePage />} />
                <Route path="services" element={<ServicesPage />} />
                <Route path="barbers" element={<BarbersPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
