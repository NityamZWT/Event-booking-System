import React, { useState, useRef, useEffect, useCallback } from "react";
import { useEventSearch } from "@/hooks/useEventSearch";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { LoadingSpinner } from "./LoadingSpinner";

interface EventSearchComboboxProps {
  value?: string;
  onSelect?: (event: any) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  emptyMessage?: string;
  searchPlaceholder?: string;
  showSelectedInTrigger?: boolean;
  disabled?: boolean;
}

export const EventSearchCombobox: React.FC<EventSearchComboboxProps> = ({
  value,
  onSelect,
  placeholder = "Select event...",
  className,
  triggerClassName,
  emptyMessage = "No events found.",
  searchPlaceholder = "Search events...",
  showSelectedInTrigger = true,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState("");
  const [inputValue, setInputValue] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const {
    query,
    events,
    isLoading,
    isFetching,
    hasMore,
    handleSearch,
    loadMore,
    reset,
    fetchAllEvents,
    searchMode,
  } = useEventSearch({
    initialQuery: "",
    pageSize: 10,
    enabled: open,
  });

  useEffect(() => {
    setInputValue(query);
  }, [query]);

  useEffect(() => {
    if (open) {
      fetchAllEvents();
      setInputValue("");
    }
  }, [open, fetchAllEvents]);

  useEffect(() => {
    if (!open) {
      reset();
      setInternalValue("");
      setInputValue("");
    }
  }, [open, reset]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || !hasMore || isFetching) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = container;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

    if (scrollPercentage >= 0.8) {
      loadMore();
    }
  }, [hasMore, isFetching, loadMore]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !open) {
      return;
    }

    container.addEventListener("scroll", handleScroll);

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll, open]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    handleSearch(value);
  };

  const handleSelect = useCallback(
    (event: any) => {
      setInternalValue(event.title);
      onSelect?.(event);
      setOpen(false);
      setInputValue("");
    },
    [onSelect]
  );

  const selectedEvent = events.find(
    (event) => event.id.toString() === value || event.title === internalValue
  );

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild disabled={disabled}>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              triggerClassName,
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className="truncate">
              {showSelectedInTrigger && selectedEvent
                ? selectedEvent.title
                : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-full p-0"
          align="center"
          sideOffset={5}
          style={{ width: "var(--radix-popover-trigger-width)" }}
        >
          <Command shouldFilter={false} className="w-full">
            <CommandInput
              placeholder={searchPlaceholder}
              value={inputValue}
              onValueChange={handleInputChange}
              disabled={disabled}
              className="w-full"
            />
            <CommandList className="max-h-[300px]">
              <div 
                ref={scrollContainerRef}
                className="overflow-y-auto max-h-[300px]"
              >
                {isLoading && events.length === 0 ? (
                  <div className="flex items-center justify-center py-6 w-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : events.length === 0 ? (
                  <CommandEmpty className="w-full text-center py-6">
                    {searchMode === "search" && inputValue.trim()
                      ? emptyMessage
                      : "No events available"}
                  </CommandEmpty>
                ) : (
                  <>
                    <CommandGroup className="w-full">
                      {events.map((event, index) => (
                        <CommandItem
                          key={`${event.id}-${index}`}
                          value={event.title}
                          onSelect={() => handleSelect(event)}
                          className="cursor-pointer w-full"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 flex-shrink-0",
                              selectedEvent?.id === event.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="font-medium truncate">
                              {event.title}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>

                    {isFetching && events.length > 0 && (
                      <LoadingSpinner/>
                    )}

                    {/* Manual load more button */}
                    {hasMore && !isFetching && (
                      <div className="px-2 py-2 border-t bg-background">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            loadMore();
                          }}
                          className="w-full text-xs"
                        >
                          Load More Events ({events.length}+ shown)
                        </Button>
                      </div>
                    )}

                    {/* End indicator */}
                    {!hasMore && events.length > 0 && (
                      <div className="px-2 py-3 text-center text-xs text-muted-foreground border-t bg-background">
                        {searchMode === "search"
                          ? `Found ${events.length} event${events.length !== 1 ? "s" : ""}`
                          : `All ${events.length} event${events.length !== 1 ? "s" : ""} loaded`}
                      </div>
                    )}
                  </>
                )}
              </div>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};