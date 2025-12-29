import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { store } from './store';
// import { Layout } from './components/layout/Layout';
// import { PrivateRoute } from './components/auth/PrivateRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
// import { EventsPage } from './pages/EventsPage';
// import { CreateEventPage } from './pages/CreateEventPage';
// import { EditEventPage } from './pages/EditEventPage';
// import { BookEventPage } from './pages/BookEventPage';
// import { BookingsPage } from './pages/BookingsPage';
// import { AnalyticsPage } from './pages/AnalyticsPage';
// import { USER_ROLES } from './lib/constants';

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
            
            {/* <Route
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
                  <PrivateRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.EVENT_MANAGER]}>
                    <CreateEventPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="events/:id/edit"
                element={
                  <PrivateRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.EVENT_MANAGER]}>
                    <EditEventPage />
                  </PrivateRoute>
                }
              />
              <Route path="events/:id/book" element={<BookEventPage />} />
              <Route path="bookings" element={<BookingsPage />} />
              <Route
                path="analytics"
                element={
                  <PrivateRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.EVENT_MANAGER]}>
                    <AnalyticsPage />
                  </PrivateRoute>
                }
              />
            </Route> */}
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
