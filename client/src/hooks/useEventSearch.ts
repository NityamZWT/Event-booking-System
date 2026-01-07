import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { debounce } from 'lodash';
import { eventsAPI } from '@/api/events';

interface Event {
  id: number;
  title: string;
}

interface EventListResponse {
  data: {
    events: Event[];
    pagination?: {
      page: number;
      hasMore: boolean;
      total: number;
    };
  };
}

interface UseEventSearchOptions {
  initialQuery?: string;
  pageSize?: number;
  enabled?: boolean;
}

export const useEventSearch = (options: UseEventSearchOptions = {}) => {
  const { initialQuery = '', pageSize = 10, enabled = true } = options;
  
  const [query, setQuery] = useState(initialQuery);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [searchMode, setSearchMode] = useState<'all' | 'search'>('all');

  const { data, isLoading, isFetching, error } = useQuery<EventListResponse>({
    queryKey: ['event-search', query, page, pageSize],
    queryFn: () => {
      return eventsAPI.getEventList(query, page, pageSize);
    },
    enabled: enabled,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (data?.data?.events) {
      setEvents(prev => {
        if (page === 1) {
          return data.data.events;
        }

        const existingIds = new Set(prev.map(e => e.id));
        const newEvents = data.data.events.filter((e: any) => !existingIds.has(e.id));
        const combined = [...prev, ...newEvents];
        return combined;
      });
      
      setHasMore(data.data.pagination?.hasMore || false);
    }
  }, [data, page]);

  const debouncedSearch = useCallback(
    debounce((searchTerm: string) => {
      setEvents([]);
      setPage(1);
      setQuery(searchTerm);
      setSearchMode(searchTerm.trim() ? 'search' : 'all');
    }, 300),
    []
  );

  const handleSearch = (searchTerm: string) => {
    debouncedSearch(searchTerm);
  };

  const loadMore = useCallback(() => {
    if (hasMore && !isFetching) {
      setPage(prev => prev + 1);
    }
  }, [hasMore, isFetching]);

  const reset = useCallback(() => {
    setQuery('');
    setPage(1);
    setEvents([]);
    setHasMore(false);
    setSearchMode('all');
  }, []);

  const fetchAllEvents = useCallback(() => {  
    setSearchMode('all');
    setQuery('');
    setPage(1);
    setEvents([]);
  }, []);

  return {
    query,
    events,
    isLoading,
    isFetching,
    error,
    hasMore,
    handleSearch,
    loadMore,
    reset,
    fetchAllEvents,
    searchMode
  };
};