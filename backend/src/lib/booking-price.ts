const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid date format");
  }

  if (end <= start) {
    throw new Error("Check-out must be after check-in");
  }

  const nights = Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);
  if (nights < 1) {
    throw new Error("Stay must be at least one night");
  }

  return nights;
}

export function calculateTotalPrice(
  pricePerNight: number,
  checkIn: string,
  checkOut: string
): number {
  const nights = calculateNights(checkIn, checkOut);
  return Math.round(pricePerNight * nights * 100) / 100;
}
