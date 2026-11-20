import type { HotelRoomStatus, TransportAssignmentStatus } from "@/lib/types/domain";

export const HOTEL_STATUS_NEXT: Record<HotelRoomStatus, HotelRoomStatus[]> = {
  required: ["blocked", "pending_allocation"],
  blocked: ["booked"],
  booked: ["confirmed"],
  confirmed: [],
  pending_allocation: ["confirmed"],
};

export const TRANSPORT_STATUS_NEXT: Record<
  TransportAssignmentStatus,
  TransportAssignmentStatus[]
> = {
  required: ["pending", "allocated"],
  pending: ["allocated"],
  allocated: ["confirmed"],
  confirmed: [],
};

export function nextHotelStatuses(current: HotelRoomStatus): HotelRoomStatus[] {
  return HOTEL_STATUS_NEXT[current] ?? [];
}

export function nextTransportStatuses(
  current: TransportAssignmentStatus,
): TransportAssignmentStatus[] {
  return TRANSPORT_STATUS_NEXT[current] ?? [];
}
