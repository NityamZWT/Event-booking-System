import { useNavigate } from "react-router-dom";
import { Formik, Form, Field } from "formik";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useCreateEvent } from "@/hooks/useEvents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { eventSchema } from "@/validators/eventValidators";
import { handleQuantityOnchange, cn } from "@/lib/utils";
import ImageUploader from "@/components/common/ImageUploader";

export const CreateEventPage = () => {
  const navigate = useNavigate();
  const createEvent = useCreateEvent();

  const handleSubmit = async (values: any) => {
    try {
      const formattedValues = {
        ...values,
        date: values.date ? format(values.date, "yyyy-MM-dd") : "",
      };

      if (formattedValues.images) {
        const fd = new FormData();
        Object.entries(formattedValues).forEach(([key, val]) => {
          if (key === 'images' || val === undefined || val === null) return;

          if (typeof val === 'object' && !(val instanceof File)) {
            fd.append(key, JSON.stringify(val));
          } else {
            fd.append(key, String(val));
          }
        });

        const imgs = formattedValues.images;
        if (Array.isArray(imgs)) {
          imgs.forEach((f: File) => fd.append('images', f));
        } else {
          fd.append('images', imgs as File);
        }

        await createEvent.mutateAsync(fd as any);
      } else {
        await createEvent.mutateAsync(formattedValues);
      }
      navigate("/events");
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
              title: "",
              description: "",
              images: undefined,
              date: null,
              location: "",
              ticket_price: "",
              capacity: "",
            }}
            validationSchema={eventSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, setFieldValue, values }) => (
              <Form className="space-y-4">
                <div>
                  <Label htmlFor="title">Title*</Label>
                  <Field name="title" as={Input} />
                  {errors.title && touched.title && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.title}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Field
                    name="description"
                    as="textarea"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  {errors.description && touched.description && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.description}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="images">Event Images (Optional)</Label>
                  <ImageUploader
                    onFileChange={(file) => {
                      if (file) {
                        setFieldValue("images", file);
                        console.log("upoad file:", file)
                      } else {
                        setFieldValue("images", undefined);
                      }
                    }}
                    multiple={true}
                    maxFiles={10}
                    maxFileSize={5 * 1024 * 1024}
                    label="Upload Event Images"
                    description="Upload up to 5 images for your event"
                  />
                  {errors.images && touched.images && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.images as string}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="date">Date*</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !values.date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {values.date ? (
                          format(values.date, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={values.date ?? undefined}
                        onSelect={(date) => setFieldValue("date", date)}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.date && touched.date && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.date as string}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="location">Location*</Label>
                  <Field name="location" as={Input} />
                  {errors.location && touched.location && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.location}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="ticket_price">Ticket Price*</Label>
                  <Field
                    name="ticket_price"
                    type="number"
                    step="0.01"
                    min="0"
                    as={Input}
                  />
                  {errors.ticket_price && touched.ticket_price && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.ticket_price}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="capacity">Capacity*</Label>
                  <Field
                    name="capacity"
                    type="number"
                    min="1"
                    as={Input}
                    onChange={handleQuantityOnchange(setFieldValue, "capacity")}
                    onKeyDown={(e: any) => {
                      if ([".", ",", "-", "e", "E", "+"].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                  {errors.capacity && touched.capacity && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.capacity}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={createEvent.isPending}>
                    {createEvent.isPending ? "Creating..." : "Create Event"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/events")}
                  >
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
