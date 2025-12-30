import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import { useCreateEvent } from '@/hooks/useEvents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { eventSchema } from '@/validators/eventValidators';


export const CreateEventPage = () => {
  const navigate = useNavigate();
  const createEvent = useCreateEvent();

  const handleSubmit = async (values: any) => {
    try {
      await createEvent.mutateAsync(values);
      navigate('/events');
    } catch (error) {
      return;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Event</CardTitle>
        </CardHeader>
        <CardContent>
          <Formik
            initialValues={{
              title: '',
              description: '',
              date: '',
              location: '',
              ticket_price: '',
              capacity: '',
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
                  <Field name="date" type="date" as={Input} />
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
                  <Button type="submit" disabled={createEvent.isPending}>
                    {createEvent.isPending ? 'Creating...' : 'Create Event'}
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