import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Calendar as CalendarIcon, Clock, Users, Loader2 } from 'lucide-react';
import { format, addDays } from 'date-fns';

const timeSlots = [
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'
];

const partySizes = [1, 2, 3, 4, 5, 6, 7, 8];

export default function BookingForm({
  restaurant,
  user,
  onSubmit,
  isSubmitting
}) {
  const [date, setDate] = useState(null);
  const [time, setTime] = useState('');
  const [partySize, setPartySize] = useState('2');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  useEffect(() => {
    if (user?.full_name) {
      setCustomerName(user.full_name);
    }
    if (user?.phone) {
      setCustomerPhone(user.phone);
    }
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!date || !time || !partySize) {
      return;
    }

    onSubmit({
      restaurant: restaurant.id,
      guest_email: user?.email,
      guest_name: customerName,
      guest_phone: customerPhone,
      date: format(date, 'yyyy-MM-dd'),
      time,
      guests: parseInt(partySize),
      special_requests: specialRequests,
      status: 'pending'
    });
  };

  const isFormValid = date && time && partySize && customerName;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Date Selection */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-stone-600">
          <CalendarIcon className="w-4 h-4 text-stone-400" />
          Select Date
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal h-14 bg-white border-stone-200 rounded-xl hover:bg-stone-50 transition-colors"
            >
              <CalendarIcon className="mr-2 h-5 w-5 text-stone-400" />
              <span className={date ? 'text-stone-900' : 'text-stone-400'}>
                {date ? format(date, 'MMM d, yyyy') : 'Pick a date'}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={(date) => date < new Date() || date > addDays(new Date(), 30)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Time Selection */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-stone-600">
          <Clock className="w-4 h-4 text-stone-400" />
          Select Time
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {timeSlots.map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => setTime(slot)}
              className={`py-2.5 px-2 text-sm rounded-xl border transition-all duration-200 font-medium ${time === slot
                ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400 hover:bg-stone-50'
                }`}
            >
              {slot}
            </button>
          ))}
        </div>
      </div>

      {/* Party Size */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-stone-600">
          <Users className="w-4 h-4 text-stone-400" />
          Party Size
        </label>
        <Select value={partySize} onValueChange={setPartySize}>
          <SelectTrigger className="w-full h-14 bg-white border-stone-200 rounded-xl text-stone-900">
            <SelectValue placeholder="Number of guests" />
          </SelectTrigger>
          <SelectContent className="rounded-xl overflow-hidden">
            {partySizes.map((size) => (
              <SelectItem key={size} value={size.toString()} className="cursor-pointer">
                {size} {size === 1 ? 'Guest' : 'Guests'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Contact Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-stone-600">
            Your Name
          </label>
          <Input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Full name"
            className="h-14 bg-white border-stone-200 rounded-xl text-stone-900 focus-visible:ring-stone-200"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-stone-600">
            Phone Number
          </label>
          <Input
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
            className="h-14 bg-white border-stone-200 rounded-xl text-stone-900 focus-visible:ring-stone-200"
          />
        </div>
      </div>

      {/* Special Requests */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-stone-600">
          Special Requests (Optional)
        </label>
        <Textarea
          value={specialRequests}
          onChange={(e) => setSpecialRequests(e.target.value)}
          placeholder="Allergies, celebrations, seating preferences..."
          className="min-h-28 bg-white border-stone-200 rounded-xl text-stone-900 resize-none focus-visible:ring-stone-200 p-4"
        />
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <Button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className="w-full h-16 bg-[#FABC7F] hover:bg-[#f3a85b] text-white font-bold rounded-2xl text-lg shadow-lg shadow-orange-100 transition-all active:scale-[0.98]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-6 h-6 mr-2 animate-spin text-white" />
              Confirming...
            </>
          ) : (
            'Confirm Reservation'
          )}
        </Button>
      </div>

      <p className="text-[11px] text-center text-stone-400 font-medium tracking-tight">
        By booking, you agree to our terms and cancellation policy
      </p>
    </form>
  );
}