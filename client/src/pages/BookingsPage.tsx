import { useState } from "react";
import { useAppSelector } from "@/store/hook";
import { useBookings, useCancelBooking } from "@/hooks/useBooking";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { formatDate, formatCurrency } from "@/lib/utils";
import { UserRole, Booking } from "@/types";

export const BookingsPage = () => {
  const [page, setPage] = useState(1);
  const [cancelId, setCancelId] = useState<number | null>(null);
  const { user } = useAppSelector((state) => state.auth);
  const { data, isLoading, error } = useBookings({ page, limit: 10 });
  const cancelBooking = useCancelBooking();

  const handleCancel = async () => {
    if (cancelId) {
      try {
        await cancelBooking.mutateAsync(cancelId);
        setCancelId(null);
      } catch {
        setCancelId(null);
      }
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error loading bookings</div>;

  const bookings = data?.data?.bookings || [];
  const pagination: { totalPages?: number } = data?.data?.pagination || {};

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Bookings</h1>

      <div className="grid gap-4">
        {bookings.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No bookings found
          </p>
        ) : (
          bookings.map((booking: Booking) => (
            <Card key={booking.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">
                      {booking.event?.title}
                    </h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>Attendee: {booking.attendee_name}</p>
                      <p>Event Date: {formatDate(booking.event?.date || "")}</p>
                      <p>Location: {booking.event?.location}</p>
                      <p>Quantity: {booking.quantity}</p>
                      <p>Amount: {formatCurrency(booking.booking_amount)}</p>
                      <p>Booked on: {formatDate(booking.createdAt)}</p>
                    </div>
                  </div>
                  {(user?.role === UserRole.ADMIN ||
                    user?.role === UserRole.CUSTOMER) && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setCancelId(booking.id)}
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

      {(pagination.totalPages ?? 0) > 1 && (
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
            disabled={page >= (pagination.totalPages ?? 1)}
          >
            Next
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={cancelId !== null}
        onOpenChange={(open) => !open && setCancelId(null)}
        onConfirm={handleCancel}
        title="Cancel Booking"
        description="Are you sure you want to cancel this booking? This action cannot be undone."
        confirmText="Cancel Booking"
        isLoading={cancelBooking.isPending}
      />
    </div>
  );
};
