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
      restaurant_id: restaurant.id,
      restaurant_name: restaurant.name,
      customer_email: user?.email,
      customer_name: customerName,
      customer_phone: customerPhone,
      date: format(date, 'yyyy-MM-dd'),
      time,
      party_size: parseInt(partySize),
      special_requests: specialRequests,
      status: 'pending'
    });
  };

  const isFormValid = date && time && partySize && customerName;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Date Selection */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          <CalendarIcon className="w-4 h-4 inline-block mr-2" />
          Select Date
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal h-12 bg-white"
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-stone-500" />
              {date ? format(date, 'EEEE, MMMM d, yyyy') : 'Pick a date'}
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
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          <Clock className="w-4 h-4 inline-block mr-2" />
          Select Time
        </label>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {timeSlots.map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => setTime(slot)}
              className={`py-2 px-3 text-sm rounded-lg border transition-all ${
                time === slot
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-white text-stone-700 border-stone-200 hover:border-amber-300'
              }`}
            >
              {slot}
            </button>
          ))}
        </div>
      </div>

      {/* Party Size */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          <Users className="w-4 h-4 inline-block mr-2" />
          Party Size
        </label>
        <Select value={partySize} onValueChange={setPartySize}>
          <SelectTrigger className="w-full h-12 bg-white">
            <SelectValue placeholder="Number of guests" />
          </SelectTrigger>
          <SelectContent>
            {partySizes.map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size} {size === 1 ? 'Guest' : 'Guests'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Contact Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Your Name
          </label>
          <Input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Full name"
            className="h-12 bg-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Phone Number
          </label>
          <Input
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
            className="h-12 bg-white"
          />
        </div>
      </div>

      {/* Special Requests */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Special Requests (Optional)
        </label>
        <Textarea
          value={specialRequests}
          onChange={(e) => setSpecialRequests(e.target.value)}
          placeholder="Allergies, celebrations, seating preferences..."
          className="min-h-24 bg-white resize-none"
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!isFormValid || isSubmitting}
        className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Booking...
          </>
        ) : (
          'Confirm Reservation'
        )}
      </Button>

      <p className="text-xs text-center text-stone-500">
        By booking, you agree to our terms and cancellation policy
      </p>
    </form>
  );
}