import { describe, expect, it } from "vitest";
import { MAX_ROOM_PARTICIPANTS } from "../../shared/collaboration";
import { RoomCapacityRegistry } from "./room-capacity";

describe("RoomCapacityRegistry", () => {
  it("admits five distinct people and rejects a sixth", () => {
    const rooms = new RoomCapacityRegistry();
    for (let index = 1; index <= MAX_ROOM_PARTICIPANTS; index += 1) {
      rooms.reserve("doc-1", `user-${index}`, `socket-${index}`);
    }

    expect(rooms.count("doc-1")).toBe(5);
    expect(() => rooms.reserve("doc-1", "user-6", "socket-6")).toThrow("at most 5 people");
    expect(rooms.count("doc-1")).toBe(5);
  });

  it("counts the same person once across tabs until their final socket leaves", () => {
    const rooms = new RoomCapacityRegistry();
    rooms.reserve("doc-1", "owner", "owner-tab-1");
    rooms.reserve("doc-1", "owner", "owner-tab-2");
    rooms.reserve("doc-1", "guest", "guest-tab-1");

    expect(rooms.count("doc-1")).toBe(2);
    rooms.release("owner-tab-1");
    expect(rooms.count("doc-1")).toBe(2);
    rooms.release("owner-tab-2");
    expect(rooms.count("doc-1")).toBe(1);
  });

  it("keeps capacities independent across rooms and frees seats after disconnect", () => {
    const rooms = new RoomCapacityRegistry();
    for (let index = 1; index <= MAX_ROOM_PARTICIPANTS; index += 1) {
      rooms.reserve("doc-1", `user-${index}`, `socket-${index}`);
    }
    rooms.reserve("doc-2", "user-6", "socket-6");
    rooms.release("socket-3");
    rooms.reserve("doc-1", "user-6", "socket-7");

    expect(rooms.count("doc-1")).toBe(5);
    expect(rooms.count("doc-2")).toBe(1);
  });
});
