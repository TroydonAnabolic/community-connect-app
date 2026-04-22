import * as Calendar from "expo-calendar";
import {
    Timestamp,
    addDoc,
    collection,
    doc,
    getDoc,
    limit,
    onSnapshot,
    orderBy,
    query,
    runTransaction,
    serverTimestamp,
} from "firebase/firestore";
import { Platform } from "react-native";

import { db } from "@/lib/firebase";
import {
    CommunityEvent,
    EventRsvp,
    RsvpStatus,
    UserProfile,
} from "@/types/models";

const eventsCollection = collection(db, "events");

export type CreateEventPayload = {
  title: string;
  description: string;
  location: string;
  startsAt: Date;
  endsAt: Date;
};

export function subscribeEvents(
  onNext: (events: CommunityEvent[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const eventsQuery = query(
    eventsCollection,
    orderBy("startsAt", "asc"),
    limit(100),
  );

  return onSnapshot(
    eventsQuery,
    (snapshot) => {
      const events = snapshot.docs.map((entry) => ({
        id: entry.id,
        ...(entry.data() as Omit<CommunityEvent, "id">),
      }));

      onNext(events);
    },
    (error) => {
      onError?.(error as Error);
    },
  );
}

export async function createEvent(
  organizer: UserProfile,
  payload: CreateEventPayload,
): Promise<void> {
  const title = payload.title.trim();

  if (!title) {
    throw new Error("Event title cannot be empty.");
  }

  await addDoc(eventsCollection, {
    title,
    description: payload.description.trim(),
    location: payload.location.trim(),
    startsAt: Timestamp.fromDate(payload.startsAt),
    endsAt: Timestamp.fromDate(payload.endsAt),
    createdBy: organizer.uid,
    createdByName: organizer.displayName,
    rsvpCounts: {
      yes: 0,
      maybe: 0,
      no: 0,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function respondToEvent(
  eventId: string,
  user: UserProfile,
  status: RsvpStatus,
): Promise<void> {
  const eventRef = doc(db, "events", eventId);
  const rsvpRef = doc(db, "events", eventId, "rsvps", user.uid);

  await runTransaction(db, async (transaction) => {
    const [eventSnapshot, rsvpSnapshot] = await Promise.all([
      transaction.get(eventRef),
      transaction.get(rsvpRef),
    ]);

    if (!eventSnapshot.exists()) {
      throw new Error("Event no longer exists.");
    }

    const eventData = eventSnapshot.data() as Partial<CommunityEvent>;

    const counts: Record<RsvpStatus, number> = {
      yes: eventData.rsvpCounts?.yes ?? 0,
      maybe: eventData.rsvpCounts?.maybe ?? 0,
      no: eventData.rsvpCounts?.no ?? 0,
    };

    const existingRsvp = rsvpSnapshot.exists()
      ? (rsvpSnapshot.data() as Partial<EventRsvp>)
      : null;
    const previousStatus = existingRsvp?.status;

    if (previousStatus) {
      counts[previousStatus] = Math.max(0, counts[previousStatus] - 1);
    }

    counts[status] += 1;

    transaction.set(
      rsvpRef,
      {
        eventId,
        userId: user.uid,
        userName: user.displayName,
        status,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    transaction.update(eventRef, {
      rsvpCounts: counts,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function getUserEventRsvpStatus(
  eventId: string,
  userId: string,
): Promise<RsvpStatus | null> {
  const snapshot = await getDoc(doc(db, "events", eventId, "rsvps", userId));

  if (!snapshot.exists()) {
    return null;
  }

  return (snapshot.data() as EventRsvp).status;
}

export async function addEventToCalendar(event: CommunityEvent): Promise<void> {
  if (Platform.OS === "web") {
    throw new Error("Calendar integration is not available on web.");
  }

  const permission = await Calendar.requestCalendarPermissionsAsync();

  if (permission.status !== "granted") {
    throw new Error("Calendar permission was not granted.");
  }

  const calendars = await Calendar.getCalendarsAsync(
    Calendar.EntityTypes.EVENT,
  );
  const writableCalendar =
    calendars.find((entry) => entry.allowsModifications) ?? calendars[0];

  if (!writableCalendar) {
    throw new Error("No writable calendar was found on this device.");
  }

  const startDate = event.startsAt?.toDate() ?? new Date();
  const endDate =
    event.endsAt?.toDate() ?? new Date(startDate.getTime() + 60 * 60 * 1000);

  await Calendar.createEventAsync(writableCalendar.id, {
    title: event.title,
    notes: event.description,
    startDate,
    endDate,
    location: event.location,
  });
}
