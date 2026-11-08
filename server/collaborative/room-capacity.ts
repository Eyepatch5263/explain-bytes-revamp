import { MAX_ROOM_PARTICIPANTS } from "../../shared/collaboration";

type RoomMembers = Map<string, Set<string>>;
type Reservation = { documentId: string; userId: string };

export class RoomCapacityRegistry {
  private readonly roomMembers = new Map<string, RoomMembers>();
  private readonly socketReservations = new Map<string, Reservation>();

  constructor(private readonly limit = MAX_ROOM_PARTICIPANTS) {}

  count(documentId: string) {
    return this.roomMembers.get(documentId)?.size ?? 0;
  }

  reserve(documentId: string, userId: string, socketId: string) {
    const existing = this.socketReservations.get(socketId);
    if (existing?.documentId === documentId && existing.userId === userId) return;
    if (existing) this.release(socketId);

    let members = this.roomMembers.get(documentId);
    if (!members) {
      members = new Map();
      this.roomMembers.set(documentId, members);
    }
    if (!members.has(userId) && members.size >= this.limit) {
      throw new Error(`This room is full. A room allows at most ${this.limit} people.`);
    }
    const sockets = members.get(userId) ?? new Set<string>();
    sockets.add(socketId);
    members.set(userId, sockets);
    this.socketReservations.set(socketId, { documentId, userId });
  }

  release(socketId: string) {
    const reservation = this.socketReservations.get(socketId);
    if (!reservation) return;
    this.socketReservations.delete(socketId);
    const members = this.roomMembers.get(reservation.documentId);
    const sockets = members?.get(reservation.userId);
    sockets?.delete(socketId);
    if (sockets?.size === 0) members?.delete(reservation.userId);
    if (members?.size === 0) this.roomMembers.delete(reservation.documentId);
  }
}
