import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useBookings, useCancelBooking } from '@/hooks/useBookings';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { formatDate, formatCurrency } from '@/lib/utils';
import { USER_ROLES } from '@/lib/constants';

export const BookingsPage = () => {
  const [page, setPage] = useState(1);
  const { user } = useSelector((state) => state.auth);
  const { data, isLoading, error } = useBookings({ page, limit: 10 });
  const cancelBooking = useCancelBooking();

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await cancelBooking.mutateAsync(id);
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to cancel booking');
      }
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  const bookings = data?.data?.bookings || [];
  const pagination = data?.data?.pagination || {};

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Bookings</h1>

      <div className="grid gap-4">
        {bookings.length === 0 ? (
          <p className="text-center text-slate-500 py-8">No bookings found</p>
        ) : (
          bookings.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{booking.event?.title}</h3>
                    <div className="space-y-1 text-sm text-slate-600">
                      <p>Attendee: {booking.attendee_name}</p>
                      <p>Event Date: {formatDate(booking.event?.date)}</p>
                      <p>Location: {booking.event?.location}</p>
                      <p>Quantity: {booking.quantity}</p>
                      <p>Amount: {formatCurrency(booking.booking_amount)}</p>
                      <p>Booked on: {formatDate(booking.created_at)}</p>
                    </div>
                  </div>
                  {(user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.CUSTOMER) && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleCancel(booking.id)}
                      disabled={cancelBooking.isPending}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};