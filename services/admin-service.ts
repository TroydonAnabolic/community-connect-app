import {
    collection,
    getCountFromServer,
    limit,
    onSnapshot,
    query,
    where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { DiscussionPost, EngagementStats } from "@/types/models";

export function subscribeFlaggedPosts(
  onNext: (posts: DiscussionPost[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const flaggedQuery = query(
    collection(db, "posts"),
    where("isFlagged", "==", true),
    limit(100),
  );

  return onSnapshot(
    flaggedQuery,
    (snapshot) => {
      const posts = snapshot.docs
        .map((entry) => ({
          id: entry.id,
          ...(entry.data() as Omit<DiscussionPost, "id">),
        }))
        .sort((left, right) => {
          const leftTime = left.createdAt?.toMillis() ?? 0;
          const rightTime = right.createdAt?.toMillis() ?? 0;
          return rightTime - leftTime;
        });

      onNext(posts);
    },
    (error) => {
      onError?.(error as Error);
    },
  );
}

export async function fetchEngagementStats(): Promise<EngagementStats> {
  const [users, posts, events, conversations, checkIns] = await Promise.all([
    getCountFromServer(collection(db, "users")),
    getCountFromServer(collection(db, "posts")),
    getCountFromServer(collection(db, "events")),
    getCountFromServer(collection(db, "conversations")),
    getCountFromServer(collection(db, "checkIns")),
  ]);

  return {
    users: users.data().count,
    posts: posts.data().count,
    events: events.data().count,
    conversations: conversations.data().count,
    checkIns: checkIns.data().count,
  };
}
