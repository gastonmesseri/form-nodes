import moment from 'moment';
import { computed } from '@angular/core';
import { field, form } from '@ngblocks/form-nodes';

const booking = form({
  date: field(new Date(2025, 0, 10)),
  momentDate: field(moment([2025, 0, 10])),
  guest: field({ name: 'Ada' }),
});

const day = computed(() => booking.date()?.getDate());
const momentDay = computed(() => booking.momentDate()?.date());
const name = computed(() => booking.guest()?.name);

if (day() !== 10 || momentDay() !== 10 || name() !== 'Ada') {
  throw new Error('Derived values must reflect the initial form.');
}

// Create a new instance before changing mutable values.
const nextDate = new Date(booking.date()!.getTime());
nextDate.setDate(11);
booking.date.set(nextDate);
booking.momentDate.set(booking.momentDate()!.clone().add(1, 'day'));
booking.guest.set({ ...booking.guest()!, name: 'Grace' });

booking.date()?.getDate(); // 11
booking.momentDate()?.date(); // 11
booking.guest()?.name; // 'Grace'
if (day() !== 11 || momentDay() !== 11 || name() !== 'Grace') {
  throw new Error('Replacing values must refresh dependent signals.');
}

booking.resetToInitial();
if (day() !== 10 || momentDay() !== 10 || name() !== 'Ada') {
  throw new Error('Updates must leave declared initial values intact.');
}
