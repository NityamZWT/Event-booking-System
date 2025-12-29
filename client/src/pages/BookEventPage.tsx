import { useNavigate, useParams } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { useEvent } from '@/hooks/useEvents';
import { useCreateBooking } from '@/hooks/useBookings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatDate, formatCurrency } from '@/lib/utils';

const bookingSchema = Yup.object({
  attendee_name: Yup.string().min(2).max(100).required('Attendee name is required'),
  quantity: Yup.number().min(1).required('Quantity is required'),
});

export const BookEventPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useEvent(id ? parseInt(id) : null);
  const createBooking = useCreateBooking();

  const handleSubmit = async (values: any) => {
    const event = data?.data;
    const bookingAmount = Number(event.ticket_price) * values.quantity;

    try {
      await createBooking.mutateAsync({
        event_id: parseInt(id!),
        attendee_name: values.attendee_name,
        quantity: values.quantity,
        booking_amount: bookingAmount,
      });
      navigate('/bookings');
    } catch (error) {
      return;
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error loading event</div>;

  const event = data?.data;

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Book Event</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Date: {formatDate(event.date)}</p>
              <p>Location: {event.location}</p>
              <p>Price per ticket: {formatCurrency(event.ticket_price)}</p>
              <p>Available capacity: {event.capacity}</p>
            </div>
          </div>

          <Formik
            initialValues={{
              attendee_name: '',
              quantity: 1,
            }}
            validationSchema={bookingSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values }) => (
              <Form className="space-y-4">
                <div>
                  <Label htmlFor="attendee_name">Attendee Name</Label>
                  <Field name="attendee_name" as={Input} />
                  {errors.attendee_name && touched.attendee_name && (
                    <p className="text-sm text-destructive mt-1">{errors.attendee_name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Field name="quantity" type="number" min="1" as={Input} />
                  {errors.quantity && touched.quantity && (
                    <p className="text-sm text-destructive mt-1">{errors.quantity}</p>
                  )}
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-semibold">
                    Total Amount: {formatCurrency(event.ticket_price * values.quantity)}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={createBooking.isPending}>
                    {createBooking.isPending ? 'Booking...' : 'Book Now'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/events')}>
                    Cancel
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </CardContent>
      </Card>
    </div>
  );
};