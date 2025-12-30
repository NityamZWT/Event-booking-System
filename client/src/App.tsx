import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { store } from "./store";
import { Layout } from "./components/layout/Layout";
import { PrivateRoute } from "./components/auth/PrivateRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { EventsPage } from "./pages/EventsPage";
import { CreateEventPage } from "./pages/CreateEventPage";
import { EditEventPage } from "./pages/EditEventPage";
import { BookEventPage } from "./pages/BookEventPage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { BookingsPage } from "./pages/BookingsPage";
import { ManagerDashboard } from "./pages/ManagerDashboard";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { UserRole } from "./types";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="/events" replace />} />
              <Route path="events" element={<EventsPage />} />
              <Route
                path="events/create"
                element={
                  <PrivateRoute
                    allowedRoles={[UserRole.ADMIN, UserRole.EVENT_MANAGER]}
                  >
                    <CreateEventPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="events/:id/edit"
                element={
                  <PrivateRoute
                    allowedRoles={[UserRole.ADMIN, UserRole.EVENT_MANAGER]}
                  >
                    <EditEventPage />
                  </PrivateRoute>
                }
              />
              <Route path="events/:id" element={<EventDetailPage />} />
              <Route path="events/:id/book" element={<BookEventPage />} />
              <Route path="bookings" element={<BookingsPage />} />
              {/* Analytics page removed — dashboard shows analytics for admin/manager */}
              <Route
                path="admin/users"
                element={
                  <PrivateRoute allowedRoles={[UserRole.ADMIN]}>
                    <AdminUsersPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="dashboard"
                element={
                  <PrivateRoute allowedRoles={[UserRole.EVENT_MANAGER, UserRole.ADMIN]}>
                    <ManagerDashboard />
                  </PrivateRoute>
                }
              />
            </Route>
          </Routes>
        </BrowserRouter>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
