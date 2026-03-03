import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Calendar, 
  Search,
  Check,
  X,
  MoreVertical,
  Clock,
  Users,
  Phone,
  AlertCircle,
  CheckCircle,
  XCircle,
  UserX
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns';
import { motion } from 'framer-motion';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  completed: 'bg-stone-100 text-stone-600 border-stone-200',
  no_show: 'bg-red-100 text-red-700 border-red-200'
};

const statusLabels = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
  no_show: 'No Show'
};

export default function OwnerReservations() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const userData = await base44.auth.me();
        setUser(userData);
      }
    };
    loadUser();
  }, []);

  const { data: restaurants = [] } = useQuery({
    queryKey: ['owner-restaurants', user?.email],
    queryFn: () => base44.entities.Restaurant.filter({ owner_email: user.email }),
    enabled: !!user?.email,
  });

  const restaurant = restaurants[0];

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['owner-reservations', restaurant?.id],
    queryFn: () => base44.entities.Reservation.filter({ restaurant_id: restaurant.id }, '-date'),
    enabled: !!restaurant?.id,
  });

  const updateReservation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Reservation.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-reservations'] });
    },
  });

  const filteredReservations = useMemo(() => {
    return reservations.filter(reservation => {
      // Search filter
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        if (!reservation.customer_name?.toLowerCase().includes(search) &&
            !reservation.customer_email?.toLowerCase().includes(search) &&
            !reservation.customer_phone?.includes(search)) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all' && reservation.status !== statusFilter) {
        return false;
      }

      // Date filter
      if (dateFilter !== 'all') {
        const date = parseISO(reservation.date);
        if (dateFilter === 'today' && !isToday(date)) return false;
        if (dateFilter === 'tomorrow' && !isTomorrow(date)) return false;
        if (dateFilter === 'upcoming' && isPast(date) && !isToday(date)) return false;
        if (dateFilter === 'past' && !isPast(date)) return false;
      }

      return true;
    });
  }, [reservations, searchQuery, statusFilter, dateFilter]);

  const getDateLabel = (dateStr) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d, yyyy');
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="font-display text-2xl font-bold text-stone-900">
            Reservation Management
          </h1>
          <p className="text-stone-500">Manage all your restaurant reservations</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40 h-11">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-40 h-11">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="tomorrow">Tomorrow</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <p className="text-sm text-stone-500 mb-1">Total</p>
            <p className="text-2xl font-bold text-stone-900">{filteredReservations.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <p className="text-sm text-stone-500 mb-1">Pending</p>
            <p className="text-2xl font-bold text-amber-600">
              {filteredReservations.filter(r => r.status === 'pending').length}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <p className="text-sm text-stone-500 mb-1">Confirmed</p>
            <p className="text-2xl font-bold text-emerald-600">
              {filteredReservations.filter(r => r.status === 'confirmed').length}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <p className="text-sm text-stone-500 mb-1">Total Guests</p>
            <p className="text-2xl font-bold text-stone-900">
              {filteredReservations.reduce((sum, r) => sum + (r.party_size || 0), 0)}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-stone-900 mb-2">No reservations found</h3>
              <p className="text-stone-500">Try adjusting your filters</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-stone-50">
                  <TableHead>Guest</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Party Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Special Requests</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.map((reservation) => (
                  <TableRow key={reservation.id} className="hover:bg-stone-50">
                    <TableCell>
                      <div>
                        <p className="font-medium text-stone-900">{reservation.customer_name}</p>
                        <p className="text-sm text-stone-500">{reservation.customer_email}</p>
                        {reservation.customer_phone && (
                          <p className="text-sm text-stone-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {reservation.customer_phone}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-stone-400" />
                        <div>
                          <p className="font-medium text-stone-900">{getDateLabel(reservation.date)}</p>
                          <p className="text-sm text-stone-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {reservation.time}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-stone-400" />
                        <span>{reservation.party_size} guests</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusColors[reservation.status]} border`}>
                        {statusLabels[reservation.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-48">
                      <p className="text-sm text-stone-500 truncate">
                        {reservation.special_requests || '-'}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {reservation.status === 'pending' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => updateReservation.mutate({ id: reservation.id, status: 'confirmed' })}
                                className="text-emerald-600"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Confirm
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateReservation.mutate({ id: reservation.id, status: 'cancelled' })}
                                className="text-red-600"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Cancel
                              </DropdownMenuItem>
                            </>
                          )}
                          {reservation.status === 'confirmed' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => updateReservation.mutate({ id: reservation.id, status: 'completed' })}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Mark Completed
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateReservation.mutate({ id: reservation.id, status: 'no_show' })}
                                className="text-red-600"
                              >
                                <UserX className="w-4 h-4 mr-2" />
                                Mark No-Show
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateReservation.mutate({ id: reservation.id, status: 'cancelled' })}
                                className="text-red-600"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Cancel
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}