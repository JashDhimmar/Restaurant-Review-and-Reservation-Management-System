import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import ReservationService from '@/services/ReservationService';
import RestaurantService from '@/services/RestaurantService';
import OwnerSidebar from '@/components/owner/OwnerSidebar';
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
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const queryClient = useQueryClient();

  const { data: restaurants = [] } = useQuery({
    queryKey: ['owner-restaurants', user?.email],
    queryFn: () => RestaurantService.getMyRestaurants(),
    enabled: !!user?.email,
  });

  const restaurant = restaurants[0];

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['owner-reservations', restaurant?.id],
    queryFn: () => ReservationService.getReservations(),
    enabled: !!restaurant?.id,
  });

  const updateReservation = useMutation({
    mutationFn: ({ id, status }) => ReservationService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-reservations'] });
    },
  });

  const filteredReservations = useMemo(() => {
    return reservations.filter(reservation => {
      // Search filter
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        if (!reservation.guest_name?.toLowerCase().includes(search) &&
          !reservation.guest_email?.toLowerCase().includes(search) &&
          !reservation.guest_phone?.includes(search)) {
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
    return format(date, 'MMM d, yyyy');
  };

  const getTimeLabel = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const d = new Date();
    d.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
    return format(d, 'h:mm a');
  };

  return (
    <div className="flex min-h-screen bg-stone-50">
      <OwnerSidebar activePage="reservations" />

      <div className="flex-1 min-w-0">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header within content area */}
          <div className="mb-8">
            <h1 className="font-display text-2xl font-bold text-stone-900">
              Reservation Management
            </h1>
            <p className="text-stone-500">Manage and track all your restaurant bookings</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 mb-6 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 border-stone-200 focus:border-amber-500 focus:ring-amber-500 rounded-xl"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] h-11 border-stone-200 rounded-xl bg-white">
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
                  <SelectTrigger className="w-[140px] h-11 border-stone-200 rounded-xl bg-white">
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
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Total</p>
              <p className="text-2xl font-bold text-stone-900">{filteredReservations.length}</p>
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Pending</p>
              <p className="text-2xl font-bold text-amber-600">
                {filteredReservations.filter(r => r.status === 'pending').length}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Confirmed</p>
              <p className="text-2xl font-bold text-emerald-600">
                {filteredReservations.filter(r => r.status === 'confirmed').length}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Total Guests</p>
              <p className="text-2xl font-bold text-stone-900">
                {filteredReservations.reduce((sum, r) => sum + (r.guests || 0), 0)}
              </p>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : filteredReservations.length === 0 ? (
              <div className="text-center py-20 px-4">
                <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-stone-200">
                  <Calendar className="w-8 h-8 text-stone-300" />
                </div>
                <h3 className="text-lg font-bold text-stone-900 mb-1">No reservations found</h3>
                <p className="text-stone-500">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-stone-50/50 hover:bg-stone-50/50">
                      <TableHead className="py-4 font-bold text-stone-900">Guest</TableHead>
                      <TableHead className="py-4 font-bold text-stone-900">Date & Time</TableHead>
                      <TableHead className="py-4 font-bold text-stone-900">Party Size</TableHead>
                      <TableHead className="py-4 font-bold text-stone-900">Status</TableHead>
                      <TableHead className="py-4 font-bold text-stone-900">Notes</TableHead>
                      <TableHead className="py-4 font-bold text-stone-900 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReservations.map((reservation) => (
                      <TableRow key={reservation.id} className="hover:bg-stone-50/30 transition-colors group">
                        <TableCell className="py-5">
                          <div>
                            <p className="font-bold text-stone-900 leading-none mb-1">{reservation.guest_name}</p>
                            {reservation.guest_phone && (
                              <p className="text-xs text-stone-500 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {reservation.guest_phone}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-stone-900">{getDateLabel(reservation.date)}</span>
                            <span className="text-xs text-amber-700 font-bold mt-0.5">{getTimeLabel(reservation.time)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-5">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center">
                              <Users className="w-4 h-4 text-stone-600" />
                            </div>
                            <span className="text-sm font-medium text-stone-900">{reservation.guests}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-5">
                          <Badge className={`${statusColors[reservation.status]} border shadow-sm px-2.5 py-0.5 font-medium`}>
                            {statusLabels[reservation.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-5">
                          <p className="text-xs text-stone-500 max-w-[200px] truncate italic">
                            {reservation.special_requests || 'No special requests'}
                          </p>
                        </TableCell>
                        <TableCell className="py-5 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                                <MoreVertical className="w-4 h-4 text-stone-500" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl">
                              {/* Dropdown actions remain same... */}
                              {reservation.status === 'pending' && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => updateReservation.mutate({ id: reservation.id, status: 'confirmed' })}
                                    className="text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Confirm Booking
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => updateReservation.mutate({ id: reservation.id, status: 'cancelled' })}
                                    className="text-red-600 focus:text-red-700 focus:bg-red-50"
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Cancel Booking
                                  </DropdownMenuItem>
                                </>
                              )}
                              {reservation.status === 'confirmed' && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => updateReservation.mutate({ id: reservation.id, status: 'completed' })}
                                    className="focus:bg-stone-50"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Mark Completed
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => updateReservation.mutate({ id: reservation.id, status: 'no_show' })}
                                    className="text-red-600 focus:text-red-700 focus:bg-red-50"
                                  >
                                    <UserX className="w-4 h-4 mr-2" />
                                    Mark No-Show
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => updateReservation.mutate({ id: reservation.id, status: 'cancelled' })}
                                    className="text-red-600 focus:text-red-700 focus:bg-red-50"
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Cancel Booking
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}