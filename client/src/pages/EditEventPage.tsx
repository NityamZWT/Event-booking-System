import { useNavigate, useParams } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { useEvent, useUpdateEvent } from '@/hooks/useEvents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

const eventSchema = Yup.object({
  title: Yup.string().min(3).max(200).required('Title is required'),
  description: Yup.string().max(1000),
  date: Yup.date().min(new Date(), 'Date must be in the future').required('Date is required'),
  location: Yup.string().min(3).max(255).required('Location is required'),
  ticket_price: Yup.number().min(0).required('Price is required'),
  capacity: Yup.number().min(1).required('Capacity is required'),
});

export const EditEventPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useEvent(id ? parseInt(id) : null);
  const updateEvent = useUpdateEvent();

  const handleSubmit = async (values: any) => {
    try {
      await updateEvent.mutateAsync({ id: parseInt(id!), data: values });
      navigate('/events');
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
          <CardTitle>Edit Event</CardTitle>
        </CardHeader>
        <CardContent>
          <Formik
            initialValues={{
              title: event.title,
              description: event.description || '',
              date: new Date(event.date).toISOString().slice(0, 16),
              location: event.location,
              ticket_price: event.ticket_price,
              capacity: event.capacity,
            }}
            validationSchema={eventSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched }) => (
              <Form className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Field name="title" as={Input} />
                  {errors.title && touched.title && (
                    <p className="text-sm text-destructive mt-1">{errors.title}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Field name="description" as="textarea" className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                  {errors.description && touched.description && (
                    <p className="text-sm text-destructive mt-1">{errors.description}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="date">Date</Label>
                  <Field name="date" type="datetime-local" as={Input} />
                  {errors.date && touched.date && (
                    <p className="text-sm text-destructive mt-1">{errors.date}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Field name="location" as={Input} />
                  {errors.location && touched.location && (
                    <p className="text-sm text-destructive mt-1">{errors.location}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="ticket_price">Ticket Price</Label>
                  <Field name="ticket_price" type="number" step="0.01" as={Input} />
                  {errors.ticket_price && touched.ticket_price && (
                    <p className="text-sm text-destructive mt-1">{errors.ticket_price}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="capacity">Capacity</Label>
                  <Field name="capacity" type="number" as={Input} />
                  {errors.capacity && touched.capacity && (
                    <p className="text-sm text-destructive mt-1">{errors.capacity}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={updateEvent.isPending}>
                    {updateEvent.isPending ? 'Updating...' : 'Update Event'}
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