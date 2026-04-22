import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { DiscussionPost, UserProfile } from "@/types/models";
import { moderateText } from "@/utils/moderation";

const postsCollection = collection(db, "posts");
const reportsCollection = collection(db, "moderationReports");

export function subscribeDiscussionPosts(
  onNext: (posts: DiscussionPost[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const postsQuery = query(
    postsCollection,
    orderBy("createdAt", "desc"),
    limit(80),
  );

  return onSnapshot(
    postsQuery,
    (snapshot) => {
      const posts = snapshot.docs.map((entry) => ({
        id: entry.id,
        ...(entry.data() as Omit<DiscussionPost, "id">),
      }));

      onNext(posts);
    },
    (error) => {
      onError?.(error as Error);
    },
  );
}

export async function createDiscussionPost(
  author: UserProfile,
  body: string,
): Promise<void> {
  const trimmedBody = body.trim();

  if (!trimmedBody) {
    throw new Error("Post text cannot be empty.");
  }

  const moderation = moderateText(trimmedBody);

  const postRef = await addDoc(postsCollection, {
    authorId: author.uid,
    authorName: author.displayName,
    body: trimmedBody,
    isFlagged: moderation.isFlagged,
    moderationReason: moderation.reason ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  if (!moderation.isFlagged) {
    return;
  }

  await addDoc(reportsCollection, {
    entityType: "post",
    entityId: postRef.id,
    reporterId: "automated-filter",
    reason: moderation.reason,
    status: "open",
    createdAt: serverTimestamp(),
  });
}

export async function flagDiscussionPost(
  postId: string,
  reporterId: string,
  reason = "Community member flagged this post for moderator review.",
): Promise<void> {
  await updateDoc(doc(db, "posts", postId), {
    isFlagged: true,
    moderationReason: reason,
    updatedAt: serverTimestamp(),
  });

  await addDoc(reportsCollection, {
    entityType: "post",
    entityId: postId,
    reporterId,
    reason,
    status: "open",
    createdAt: serverTimestamp(),
  });
}

export async function clearPostFlag(postId: string): Promise<void> {
  await updateDoc(doc(db, "posts", postId), {
    isFlagged: false,
    moderationReason: null,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDiscussionPost(postId: string): Promise<void> {
  await deleteDoc(doc(db, "posts", postId));
}
