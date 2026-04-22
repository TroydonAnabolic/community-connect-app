import {
    addDoc,
    collection,
    doc,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    Timestamp,
    where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { Conversation, DirectMessage, UserProfile } from "@/types/models";

const usersCollection = collection(db, "users");
const conversationsCollection = collection(db, "conversations");

function timestampToMillis(value?: Timestamp | null) {
  return value?.toMillis() ?? 0;
}

function buildConversationId(uidA: string, uidB: string) {
  return [uidA, uidB].sort().join("__");
}

export async function createOrOpenConversation(
  memberA: UserProfile,
  memberB: UserProfile,
): Promise<string> {
  const conversationId = buildConversationId(memberA.uid, memberB.uid);

  await setDoc(
    doc(db, "conversations", conversationId),
    {
      memberIds: [memberA.uid, memberB.uid],
      memberNames: {
        [memberA.uid]: memberA.displayName,
        [memberB.uid]: memberB.displayName,
      },
      lastMessagePreview: null,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return conversationId;
}

export function subscribeConversationsForUser(
  uid: string,
  onNext: (conversations: Conversation[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const conversationsQuery = query(
    conversationsCollection,
    where("memberIds", "array-contains", uid),
    limit(80),
  );

  return onSnapshot(
    conversationsQuery,
    (snapshot) => {
      const conversations = snapshot.docs
        .map((entry) => ({
          id: entry.id,
          ...(entry.data() as Omit<Conversation, "id">),
        }))
        .sort(
          (left, right) =>
            timestampToMillis(right.updatedAt ?? right.lastMessageAt) -
            timestampToMillis(left.updatedAt ?? left.lastMessageAt),
        );

      onNext(conversations);
    },
    (error) => {
      onError?.(error as Error);
    },
  );
}

export function subscribeMessages(
  conversationId: string,
  onNext: (messages: DirectMessage[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const messagesQuery = query(
    collection(db, "conversations", conversationId, "messages"),
    orderBy("createdAt", "asc"),
    limit(200),
  );

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      const messages = snapshot.docs.map((entry) => ({
        id: entry.id,
        ...(entry.data() as Omit<DirectMessage, "id">),
      }));

      onNext(messages);
    },
    (error) => {
      onError?.(error as Error);
    },
  );
}

export async function sendDirectMessage(
  conversationId: string,
  sender: UserProfile,
  text: string,
): Promise<void> {
  const trimmedText = text.trim();

  if (!trimmedText) {
    return;
  }

  await addDoc(collection(db, "conversations", conversationId, "messages"), {
    senderId: sender.uid,
    senderName: sender.displayName,
    text: trimmedText,
    createdAt: serverTimestamp(),
  });

  await setDoc(
    doc(db, "conversations", conversationId),
    {
      updatedAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
      lastMessagePreview: trimmedText.slice(0, 120),
    },
    { merge: true },
  );
}

export function subscribeDirectoryUsers(
  currentUid: string,
  onNext: (users: UserProfile[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const usersQuery = query(usersCollection, limit(120));

  return onSnapshot(
    usersQuery,
    (snapshot) => {
      const users = snapshot.docs
        .map((entry) => entry.data() as UserProfile)
        .filter((user) => user.uid !== currentUid)
        .sort((left, right) =>
          left.displayName.localeCompare(right.displayName),
        );

      onNext(users);
    },
    (error) => {
      onError?.(error as Error);
    },
  );
}
