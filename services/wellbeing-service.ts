import {
    addDoc,
    collection,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { UserProfile, WellbeingTip } from "@/types/models";

const tipsCollection = collection(db, "wellbeingTips");
const checkInsCollection = collection(db, "checkIns");

export const fallbackTips: Array<
  Pick<WellbeingTip, "title" | "body" | "category">
> = [
  {
    title: "Secure your front door routine",
    body: "Keep keys in one trusted location and double-check your lock each evening.",
    category: "safety",
  },
  {
    title: "Call one person today",
    body: "A short social call can significantly reduce isolation and boost mood.",
    category: "social",
  },
  {
    title: "Gentle movement break",
    body: "Take a 5-minute stretch break and hydrate to support mobility and energy.",
    category: "health",
  },
];

export function subscribeWellbeingTips(
  role: UserProfile["role"],
  onNext: (tips: WellbeingTip[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const tipsQuery = query(
    tipsCollection,
    orderBy("publishedAt", "desc"),
    limit(60),
  );

  return onSnapshot(
    tipsQuery,
    (snapshot) => {
      const tips = snapshot.docs
        .map((entry) => ({
          id: entry.id,
          ...(entry.data() as Omit<WellbeingTip, "id">),
        }))
        .filter((tip) => tip.audienceRoles.includes(role));

      onNext(tips);
    },
    (error) => {
      onError?.(error as Error);
    },
  );
}

export async function submitWellbeingCheckIn(
  user: UserProfile,
  mood: 1 | 2 | 3 | 4 | 5,
  note: string,
): Promise<void> {
  await addDoc(checkInsCollection, {
    userId: user.uid,
    userName: user.displayName,
    mood,
    note: note.trim(),
    createdAt: serverTimestamp(),
  });
}

export async function publishWellbeingTip(
  publisher: UserProfile,
  payload: {
    title: string;
    body: string;
    category: "safety" | "social" | "health";
    audienceRoles: Array<UserProfile["role"]>;
  },
): Promise<void> {
  await addDoc(tipsCollection, {
    title: payload.title.trim(),
    body: payload.body.trim(),
    category: payload.category,
    audienceRoles: payload.audienceRoles,
    publishedBy: publisher.uid,
    publishedAt: serverTimestamp(),
  });
}
