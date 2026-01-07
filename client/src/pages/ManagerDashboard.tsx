import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useDeleteEvent } from "@/hooks/useEvents";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useEvents } from "@/hooks/useEvents";
import { useAppSelector } from "@/store/hook";
import { RevenueByEvent, UserRole } from "@/types";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Link } from "react-router-dom";

export const ManagerDashboard = () => {
  const { user } = useAppSelector((s) => s.auth);
  const { data: analyticsData, isLoading: analyticsLoading } = useAnalytics();
  const [page, setPage] = useState(1);

  const eventsParams: any =
    user?.role === UserRole.EVENT_MANAGER
      ? { page, limit: 10, own_events: 1 }
      : { page, limit: 10 };

  const { data: eventsData, isLoading: eventsLoading } =
    useEvents(eventsParams);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState<number | null>(null);
  const deleteEvent = useDeleteEvent();

  if (analyticsLoading || eventsLoading) return <LoadingSpinner />;

  const analytics = analyticsData?.data;
  const summary: {
    total_events?: number;
    total_bookings?: number;
    total_revenue?: string | number;
  } = analytics?.summary || {};
  const events = eventsData?.data?.events || [];
  const pagination: { totalPages?: number } =
    eventsData?.data?.pagination || {};
  const revenueByEvent: RevenueByEvent[] = analytics?.revenue_by_event || [];
  const revenueMap = new Map(
    revenueByEvent.map((r) => [String(r.event_id), r])
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.total_events || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.total_bookings || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {formatCurrency(summary.total_revenue || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Events</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No events found
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Event</th>
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Location</th>
                    <th className="text-right py-2">Tickets Sold</th>
                    <th className="text-right py-2">Capacity</th>
                    <th className="text-right py-2">Utilization</th>
                    <th className="text-right py-2">Revenue</th>
                    <th className="text-right py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e: any) => {
                    const rv = revenueMap.get(String(e.id)) as
                      | RevenueByEvent
                      | undefined;
                    const ticketsSold =
                      rv?.total_tickets_sold ??
                      (e.bookings?.[0]?.quantity || 0);
                    const capacity = rv?.capacity ?? e.capacity ?? 0;
                    const utilization =
                      rv?.capacity_utilization ??
                      (capacity
                        ? Math.round((ticketsSold / capacity) * 100)
                        : 0);
                    const revenue = rv?.revenue ?? 0;

                    return (
                      <tr key={e.id} className="border-b">
                        <td className="py-2 text-blue-500 underline">
                          {" "}
                          <Link to={`/events/${e.id}`}>{e.title}</Link>{" "}
                        </td>
                        <td className="py-2 text-sm">{formatDate(e.date)}</td>
                        <td className="py-2 text-sm">{e.location}</td>
                        <td className="py-2 text-right">{ticketsSold}</td>
                        <td className="py-2 text-right">{capacity}</td>
                        <td className="py-2 text-right">{utilization}%</td>
                        <td className="py-2 text-right font-semibold">
                          {formatCurrency(revenue)}
                        </td>
                        <td className="py-2 text-right">
                          <div className="flex justify-end gap-2">
                            {(() => {
                              const bookedTickets =
                                e.bookings?.[0]?.quantity || 0;
                              const remaining = e.capacity - bookedTickets;
                              const isFull = remaining <= 0;
                              const canBook = !e.pastEvent && !isFull;

                              return canBook ? (
                                <Link to={`/events/${e.id}/book`}>
                                  <Button size="sm">Book</Button>
                                </Link>
                              ) : null;
                            })()}

                            {(() => {
                              const canEdit =
                                (user?.role === UserRole.ADMIN && !e.pastEvent)||
                                (user?.role === UserRole.EVENT_MANAGER &&
                                  e.created_by === user?.id &&
                                  !e.pastEvent);

                              return canEdit ? (
                                <Link to={`/events/${e.id}/edit`}>
                                  <Button size="sm" variant="outline">
                                    Edit
                                  </Button>
                                </Link>
                              ) : null;
                            })()}

                            {(() => {
                              const bookedTickets =
                                e.bookings?.[0]?.quantity || 0;
                              const hasBookings = bookedTickets > 0;

                              if (user?.role === UserRole.ADMIN  && !e.pastEvent) {
                                const canDelete = e.pastEvent
                                  ? true
                                  : !hasBookings;

                                return canDelete ? (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      setSelectedDeleteId(e.id);
                                      setDeleteOpen(true);
                                    }}
                                  >
                                    Delete
                                  </Button>
                                ) : null;
                              }
                              return null;
                            })()}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={async () => {
          if (!selectedDeleteId) return;
          try {
            await deleteEvent.mutateAsync(selectedDeleteId);
            setSelectedDeleteId(null);
            setDeleteOpen(false);
          } catch (err) {
            // swallow — toast handled in hook
          }
        }}
        title="Delete event"
        description="Are you sure you want to delete this event and its bookings?"
        confirmText="Delete"
        isLoading={deleteEvent.isPending}
      />

      {(pagination.totalPages || 0) > 1 && (
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
            disabled={page >= (pagination.totalPages || 0)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
