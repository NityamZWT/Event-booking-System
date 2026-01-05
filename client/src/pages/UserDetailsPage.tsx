// pages/UserDetailPage.tsx
import { useParams, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { useAppSelector } from "@/store/hook";
import { useUser, useDeleteUser, useUpdateUserRole } from "@/hooks/useUsers";
import { useDeleteEvent } from "@/hooks/useEvents"; // Import delete event hook
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { formatDate, formatCurrency } from "@/lib/utils";
import { UserRole, Event, Booking } from "@/types";
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Ticket,
  Trash2,
  Edit,
  AlertCircle,
} from "lucide-react";

export const UserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const { data, isLoading, error, refetch } = useUser(
    id ? parseInt(id) : undefined
  );
  const deleteUser = useDeleteUser();
  const updateUserRole = useUpdateUserRole();
  const deleteEvent = useDeleteEvent(); // Hook for deleting events

  const [deleteUserOpen, setDeleteUserOpen] = useState(false);
  const [deleteEventOpen, setDeleteEventOpen] = useState<number | null>(null);
  const [deleteEventTitle, setDeleteEventTitle] = useState<string>("");
  const [roleToUpdate, setRoleToUpdate] = useState<string>("");
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground mt-2">
          Only administrators can access this page.
        </p>
        <Button onClick={() => navigate("/events")} className="mt-4">
          Go to Events
        </Button>
      </div>
    );
  }

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error loading user details</div>;

  const user = data?.data;
  if (!user) return <div>User not found</div>;

  const isCurrentUser = currentUser?.id === user.id;
  const canDeleteUser =
    isAdmin && !isCurrentUser && user.role !== UserRole.ADMIN;
  const canUpdateRole = isAdmin && !isCurrentUser;

  // Calculate statistics
  const totalBookings = user.bookings?.length || 0;
  const totalBookingAmount =
    user.bookings?.reduce(
      (sum: number, booking: Booking) => sum + (booking.booking_amount || 0),
      0
    ) || 0;

  const totalEvents = user.events?.length || 0;
  const upcomingEvents =
    user.events?.filter((event: Event) => !event.pastEvent).length || 0;

  // Helper functions for permissions
  const canEditEvent = (
    event: Event,
    currentUserRole: UserRole,
    currentUserId: number
  ) => {
    if (currentUserRole === UserRole.ADMIN) return true;
    if (currentUserRole === UserRole.EVENT_MANAGER) {
      return event.created_by === currentUserId && !event.pastEvent;
    }
    return false;
  };

  const canBookEvent = (event: any, userRole: UserRole) => {
    // No one can book past events
    if (event.pastEvent) return false;

    // Check if event is full
    const bookedTickets = event.bookedTickets || 0;
    const remaining = event.capacity - bookedTickets;
    const isFull = remaining <= 0;

    if (isFull) return false;

    // Admin and Event Manager can book (excluding their own events)
    return userRole === UserRole.ADMIN || userRole === UserRole.EVENT_MANAGER;
  };

  const canDeleteEventFunc = (event: any, userRole: UserRole) => {
    if (userRole !== UserRole.ADMIN) return false;

    const hasBookings = (event.bookedTickets || 0) > 0;

    return event.pastEvent ? true : !hasBookings;
  };

  const handleDeleteUser = async () => {
    try {
      await deleteUser.mutateAsync(parseInt(id!));
      navigate("/admin/users");
    } catch {
      // Error handled by hook
    }
  };

  const handleDeleteEvent = async () => {
    if (deleteEventOpen) {
      try {
        await deleteEvent.mutateAsync(deleteEventOpen);
        await refetch(); // Refresh user data after deleting event
      } catch {
        // Error handled by hook
      } finally {
        setDeleteEventOpen(null);
        setDeleteEventTitle("");
      }
    }
  };

  const handleDeleteEventClick = (eventId: number, eventTitle: string) => {
    setDeleteEventOpen(eventId);
    setDeleteEventTitle(eventTitle);
  };

  const handleRoleUpdate = async () => {
    if (!roleToUpdate || roleToUpdate === user.role) return;

    setIsUpdatingRole(true);
    try {
      await updateUserRole.mutateAsync({
        userId: parseInt(id!),
        role: roleToUpdate as UserRole,
      });
      setRoleToUpdate("");
    } catch {
      // Error handled by hook
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "bg-purple-500 text-white";
      case UserRole.EVENT_MANAGER:
        return "bg-blue-500 text-white";
      case UserRole.CUSTOMER:
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Details</h1>
          <p className="text-muted-foreground mt-1">
            View and manage user information
          </p>
        </div>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div>
                <CardTitle className="text-2xl">
                  {user.first_name} {user.last_name}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Badge className={getRoleBadgeVariant(user.role)}>
                    {user.role}
                  </Badge>
                  <span className="text-muted-foreground">
                    Joined {formatDate(user.createdAt)}
                  </span>
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              {canDeleteUser && (
                <Button
                  variant="destructive"
                  onClick={() => setDeleteUserOpen(true)}
                  disabled={deleteUser.isPending}
                >
                  Delete User
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Email Address
                </h3>
                <p className="text-lg">{user.email}</p>
              </div>
              {/* <Separator />
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Account Status
                </h3>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span>Active</span>
                </div>
              </div> */}
            </div>

            {/* Role Management */}
            {canUpdateRole && (
              <div className="space-y-4">
                <div>
                  {/* <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Update User Role
                  </h3> */}
                  <div className="flex gap-2">
                    <Select
                      value={roleToUpdate || user.role}
                      onValueChange={setRoleToUpdate}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UserRole.CUSTOMER}>
                          Customer
                        </SelectItem>
                        <SelectItem value={UserRole.EVENT_MANAGER}>
                          Event Manager
                        </SelectItem>
                        <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    {roleToUpdate && roleToUpdate !== user.role && (
                      <Button
                        onClick={handleRoleUpdate}
                        disabled={isUpdatingRole || updateUserRole.isPending}
                      >
                        {isUpdatingRole ? "Updating..." : "Update"}
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Note: You cannot change admin roles or your own role
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold">{totalBookings}</p>
              </div>
              <Ticket className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalBookingAmount)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        {user.role === UserRole.EVENT_MANAGER && (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Events
                    </p>
                    <p className="text-2xl font-bold">{totalEvents}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Upcoming Events
                    </p>
                    <p className="text-2xl font-bold">{upcomingEvents}</p>
                  </div>
                  <Users className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="bookings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bookings" className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            Bookings ({totalBookings})
          </TabsTrigger>
          {user.role === UserRole.EVENT_MANAGER && (
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Events ({totalEvents})
            </TabsTrigger>
          )}
        </TabsList>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-4">
          {totalBookings === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">
                  No bookings found
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  This user hasn't made any bookings yet
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {user.bookings?.map((booking: Booking) => (
                <Card
                  key={booking.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4
                            className="font-semibold hover:text-primary cursor-pointer underline"
                            onClick={() =>
                              navigate(`/events/${booking?.event?.id}`)
                            }
                          >
                            {booking.event?.title || "Event"}
                          </h4>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          {booking.event?.date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(booking.event.date)}</span>
                            </div>
                          )}
                          {booking.event?.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>{booking.event.location}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm">
                          <span className="text-muted-foreground">
                            Attendee:
                          </span>{" "}
                          {booking.attendee_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-primary">
                          {formatCurrency(booking.booking_amount)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Booked on {formatDate(booking.createdAt)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Events Tab (Event Managers only) */}
        {(user.role === UserRole.EVENT_MANAGER ||  user.role === UserRole.ADMIN) && (
          <TabsContent value="events" className="space-y-4">
            {totalEvents === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg text-muted-foreground">
                    No events found
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This event manager hasn't created any events yet
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {user.events?.map((event: any) => {
                  const bookedTickets = event.bookedTickets || 0;
                  const remaining =
                    event.remainingCapacity || event.capacity - bookedTickets;
                  const isFull = remaining <= 0;
                  const revenue = bookedTickets * (event.ticket_price || 0);
                  const capacityPercentage =
                    event.capacity > 0
                      ? Math.round((bookedTickets / event.capacity) * 100)
                      : 0;

                  const showEditButton = canEditEvent(
                    event,
                    UserRole.ADMIN,
                    user.id
                  );
                  const showBookButton = canBookEvent(event, UserRole.ADMIN);
                  const showDeleteButton = canDeleteEventFunc(
                    event,
                    UserRole.ADMIN
                  );

                  return (
                    <Card
                      key={event.id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <h4
                                  className="font-semibold hover:text-primary cursor-pointer underline"
                                  onClick={() =>
                                    navigate(`/events/${event.id}`)
                                  }
                                >
                                  {event.title}
                                </h4>
                                {event.pastEvent ? (
                                  <Badge
                                    variant="destructive"
                                    className="text-xs"
                                  >
                                    Past
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Upcoming
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(event.date)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span>{event.location}</span>
                              </div>
                            </div>

                            {/* Analytics Row */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-2 text-center">
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground text-left">
                                  Capacity
                                </p>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-primary rounded-full"
                                      style={{
                                        width: `${capacityPercentage}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium">
                                    {bookedTickets}/{event.capacity}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Ticket Price
                                </p>
                                <p className="text-sm font-medium">
                                  {formatCurrency(event.ticket_price)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Bookings
                                </p>
                                <p className="text-sm font-medium">
                                  {bookedTickets}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Status
                                </p>
                                <p className="text-sm font-medium">
                                  {event.pastEvent
                                    ? "Past Event"
                                    : isFull
                                    ? "Sold Out"
                                    : `${100 - capacityPercentage}% Available`}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Total Revenue
                                </p>
                                <p className="text-sm font-semibold text-primary">
                                  {formatCurrency(revenue)}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {showBookButton && !isFull && !event.pastEvent && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  navigate(`/events/${event.id}/book`)
                                }
                              >
                                Book
                              </Button>
                            )}
                            {showEditButton && !event.pastEvent && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  navigate(`/events/${event.id}/edit`)
                                }
                              >
                                Edit
                              </Button>
                            )}
                            {showDeleteButton && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  handleDeleteEventClick(event.id, event.title)
                                }
                                disabled={
                                  deleteEvent.isPending &&
                                  deleteEventOpen === event.id
                                }
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Delete User Confirmation Dialog */}
      <ConfirmDialog
        open={deleteUserOpen}
        onOpenChange={setDeleteUserOpen}
        onConfirm={handleDeleteUser}
        title="Delete User"
        description={
          <div className="space-y-2">
            <p>
              Are you sure you want to delete user "{user.first_name}{" "}
              {user.last_name}"?
            </p>
            <div className="flex items-start gap-2 mt-2 p-3 bg-destructive/10 rounded-md">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
              <div className="text-sm text-destructive">
                <p className="font-medium">Warning:</p>
                <p>This action will permanently delete:</p>
                <ul className="list-disc list-inside ml-2 mt-1">
                  <li>User account</li>
                  <li>All bookings made by this user</li>
                  {user.role === UserRole.EVENT_MANAGER && (
                    <li>All events created by this user</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        }
        confirmText="Delete User"
        confirmVariant="destructive"
        isLoading={deleteUser.isPending}
      />

      {/* Delete Event Confirmation Dialog */}
      <ConfirmDialog
        open={deleteEventOpen !== null}
        onOpenChange={(open) => !open && setDeleteEventOpen(null)}
        onConfirm={handleDeleteEvent}
        title="Delete Event"
        description={
          <div className="space-y-2">
            <p>Are you sure you want to delete event "{deleteEventTitle}"?</p>
            <div className="text-sm text-muted-foreground mt-2">
              {user.events?.find((e: any) => e.id === deleteEventOpen)
                ?.pastEvent ? (
                <p>This is a past event and can be deleted.</p>
              ) : (
                <p>
                  This event has{" "}
                  {user.events?.find((e: any) => e.id === deleteEventOpen)
                    ?.bookedTickets || 0}{" "}
                  booked tickets. Future events can only be deleted if they have
                  no bookings.
                </p>
              )}
            </div>
          </div>
        }
        confirmText="Delete Event"
        confirmVariant="destructive"
        isLoading={deleteEvent.isPending}
        disabled={
          deleteEventOpen !== null &&
          !user.events?.find((e: any) => e.id === deleteEventOpen)?.pastEvent &&
          (user.events?.find((e: any) => e.id === deleteEventOpen)
            ?.bookedTickets || 0) > 0
        }
      />
    </div>
  );
};

export default UserDetailPage;
