import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { useEvents, useDeleteEvent } from '@/hooks/useEvents';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { formatDate, formatCurrency } from '@/lib/utils';
import { UserRole } from '@/types';

export const EventsPage = () => {
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { user } = useAppSelector((state) => state.auth);
  const { data, isLoading, error } = useEvents({ page, limit: 10 });
  const deleteEvent = useDeleteEvent();

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteEvent.mutateAsync(deleteId);
        setDeleteId(null);
      } catch (error) {
        setDeleteId(null);
      }
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error loading events</div>;

  const events = data?.data?.events || [];
  const pagination = data?.data?.pagination || {};

  const canManageEvents = user?.role === UserRole.ADMIN || user?.role === UserRole.EVENT_MANAGER;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Events</h1>
        {canManageEvents && (
          <Link to="/events/create">
            <Button>Create Event</Button>
          </Link>
        )}
      </div>

      <div className="grid gap-4">
        {events.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No events found</p>
        ) : (
          events.map((event) => (
            <Card key={event.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                    )}
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>Date: {formatDate(event.date)}</p>
                      <p>Location: {event.location}</p>
                      <p>Price: {formatCurrency(event.ticket_price)}</p>
                      <p>Capacity: {event.capacity}</p>
                      <p>Created by: {event.creator?.first_name} {event.creator?.last_name}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!event.pastEvent && (
                      <Link to={`/events/${event.id}/book`}>
                        <Button size="sm">Book</Button>
                      </Link>
                    )}
                    {(user?.role === UserRole.ADMIN ||
                      (user?.role === UserRole.EVENT_MANAGER && event.created_by === user.id)) && (
                      <Link to={`/events/${event.id}/edit`}>
                        <Button size="sm" variant="outline">Edit</Button>
                      </Link>
                    )}
                    {user?.role === UserRole.ADMIN && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteId(event.id)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
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

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Event"
        description="Are you sure you want to delete this event? This action cannot be undone."
        confirmText="Delete"
        isLoading={deleteEvent.isPending}
      />
    </div>
  );
};