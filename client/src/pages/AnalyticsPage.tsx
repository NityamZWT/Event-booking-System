import { useAnalytics } from '@/hooks/useAnalytics';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatDate, formatCurrency } from '@/lib/utils';

export const AnalyticsPage = () => {
  const { data, isLoading, error } = useAnalytics();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error loading analytics</div>;

  const analytics = data?.data;
  const summary = analytics?.summary || {};
  const revenueByEvent = analytics?.revenue_by_event || [];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.total_events || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.total_bookings || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(summary.total_revenue || 0)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue by Event</CardTitle>
        </CardHeader>
        <CardContent>
          {revenueByEvent.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No data available</p>
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
                  </tr>
                </thead>
                <tbody>
                  {revenueByEvent.map((event) => (
                    <tr key={event.event_id} className="border-b">
                      <td className="py-2">{event.event_title}</td>
                      <td className="py-2 text-sm">{formatDate(event.event_date)}</td>
                      <td className="py-2 text-sm">{event.location}</td>
                      <td className="py-2 text-right">{event.total_tickets_sold}</td>
                      <td className="py-2 text-right">{event.capacity}</td>
                      <td className="py-2 text-right">{event.capacity_utilization}%</td>
                      <td className="py-2 text-right font-semibold">
                        {formatCurrency(event.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};