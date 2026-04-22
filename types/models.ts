import { Timestamp } from "firebase/firestore";

export type UserRole = "senior" | "caregiver" | "organization" | "admin";

export type AccessibilitySettings = {
  fontScale: number;
  highContrast: boolean;
};

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  accessibility: AccessibilitySettings;
  pushToken?: string | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
};

export type DiscussionPost = {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  isFlagged: boolean;
  moderationReason?: string | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
};

export type Conversation = {
  id: string;
  memberIds: string[];
  memberNames: Record<string, string>;
  lastMessagePreview?: string | null;
  lastMessageAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
};

export type DirectMessage = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt?: Timestamp | null;
};

export type RsvpStatus = "yes" | "maybe" | "no";

export type CommunityEvent = {
  id: string;
  title: string;
  description: string;
  location: string;
  startsAt?: Timestamp | null;
  endsAt?: Timestamp | null;
  createdBy: string;
  createdByName: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  rsvpCounts: Record<RsvpStatus, number>;
};

export type EventRsvp = {
  eventId: string;
  userId: string;
  userName: string;
  status: RsvpStatus;
  updatedAt?: Timestamp | null;
};

export type WellbeingTip = {
  id: string;
  title: string;
  body: string;
  category: "safety" | "social" | "health";
  audienceRoles: UserRole[];
  publishedBy: string;
  publishedAt?: Timestamp | null;
};

export type WellbeingCheckIn = {
  id: string;
  userId: string;
  userName: string;
  mood: 1 | 2 | 3 | 4 | 5;
  note: string;
  createdAt?: Timestamp | null;
};

export type EngagementStats = {
  users: number;
  posts: number;
  events: number;
  conversations: number;
  checkIns: number;
};
