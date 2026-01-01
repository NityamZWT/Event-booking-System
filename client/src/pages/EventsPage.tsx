"use client";

import React from "react";
import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAppSelector } from "@/store/hook";
import { useEvents, useDeleteEvent } from "@/hooks/useEvents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  formatDate,
  formatCurrency,
  convertLocalToUTCDateString,
} from "@/lib/utils";
import { Event, Pagination, UserRole } from "@/types";

export const EventsPage = () => {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { user } = useAppSelector((state) => state.auth);

  const { data, isLoading, error } = useEvents({
    page,
    limit: 10,
    q,
    date: selectedDate ? convertLocalToUTCDateString(selectedDate) : undefined,
  });

  const navigate = useNavigate();
  const deleteEvent = useDeleteEvent();

  const handleSearch = () => {
    setQ(searchInput);
    setPage(1);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setPage(1);
  };

  const clearDateFilter = () => {
    setSelectedDate(undefined);
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteEvent.mutateAsync(deleteId);
        setDeleteId(null);
      } catch {
        setDeleteId(null);
      }
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error loading events</div>;

  const events = data?.data?.events || [];
  const pagination: Pagination = data?.data?.pagination || { totalPages: 1 };

  const canManageEvents =
    user?.role === UserRole.ADMIN || user?.role === UserRole.EVENT_MANAGER;

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

      {/* Search and Filter Section */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        {/* Search Input */}
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search events by title"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* Date Picker */}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[240px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(selectedDate, "PPP") // Formatted local date
                ) : (
                  <span>Filter by date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Clear Date Button */}
          {selectedDate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearDateFilter}
              className="h-10 px-3"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Search Button */}
        <div>
          <Button onClick={handleSearch}>Search</Button>
        </div>
      </div>

      {/* Events List */}
      <div className="grid gap-4">
        {events.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {selectedDate || q
              ? "No events match your search criteria"
              : "No events found"}
          </p>
        ) : (
          events.map((event: Event) => (
            <Card
              key={event.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("button, a")) {
                  return;
                }
                navigate(`/events/${event.id}`);
              }}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex gap-1">
                      <h3 className="text-xl font-semibold mb-2">
                        {event.title}
                      </h3>
                      {event.pastEvent === true ? (
                        <span className="bg-red-500 text-white rounded-md p-0.5 m-0">
                          Past Event
                        </span>
                      ) : null}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>Date: {formatDate(event.date)}</p>
                      <p>Location: {event.location}</p>
                      <p>Price: {formatCurrency(event.ticket_price)}</p>
                    </div>
                  </div>
                  <div
                    className="flex gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {!event.pastEvent &&
                      (() => {
                        const bookedTickets =
                          event.bookings?.reduce(
                            (sum: number, booking: any) =>
                              sum + (booking.quantity || 0),
                            0
                          ) || 0;
                        const remaining = event.capacity - bookedTickets;
                        const isFull = remaining <= 0;
                        return !isFull ? (
                          <Link to={`/events/${event.id}/book`}>
                            <Button size="sm">Book</Button>
                          </Link>
                        ) : (
                          <Button size="sm" disabled variant="outline">
                            Full
                          </Button>
                        );
                      })()}
                    {(user?.role === UserRole.ADMIN ||
                      (user?.role === UserRole.EVENT_MANAGER &&
                        event.created_by === user.id)) && (
                      <Link to={`/events/${event.id}/edit`}>
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
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

      {/* Pagination */}
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

      {/* Delete Confirmation Dialog */}
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
