import { and, count, countDistinct, desc, eq, gte, inArray, isNull, sql } from "drizzle-orm"
import { getDb } from "@/lib/db"
import { comments, follows, postLikes, posts, profileComments, profileViews, users } from "@/lib/schema"
import { EMPTY_STATS, type UserStats } from "@/lib/progression"

export type UserRole = "user" | "moderator" | "owner"

export type CommunityPost = {
  id: string
  body: string
  createdAt: string
  author: {
    id: string
    username: string
    avatarUrl: string | null
  }
  likeCount: number
  commentCount: number
  likedByMe: boolean
}

export type CommunityComment = {
  id: string
  body: string
  createdAt: string
  author: {
    id: string
    username: string
    avatarUrl: string | null
  }
}

export type UserProfile = {
  id: string
  username: string
  avatarUrl: string | null
  customAvatarUrl: string | null
  bannerUrl: string | null
  bio: string | null
  role: UserRole
  bannedAt: string | null
  bannedReason: string | null
  musicUrl: string | null
  musicTitle: string | null
  lastActiveAt: string | null
  createdAt: string
}

export type ProfileComment = {
  id: string
  body: string
  createdAt: string
  author: {
    id: string
    username: string
    avatarUrl: string | null
    role: UserRole
  }
}

function ownerId() {
  return process.env.OWNER_DISCORD_ID?.trim() || null
}

/** The effective avatar to display: the custom uploaded one wins over the Discord one. */
export function displayAvatar(user: { avatarUrl: string | null; customAvatarUrl: string | null }) {
  return user.customAvatarUrl ?? user.avatarUrl ?? null
}

export async function upsertDiscordUser(input: {
  id: string
  username: string
  avatarUrl: string | null
}) {
  const db = getDb()
  // The configured owner is always granted the owner role on login.
  const isOwner = ownerId() === input.id

  await db
    .insert(users)
    .values({
      id: input.id,
      username: input.username,
      avatarUrl: input.avatarUrl,
      role: isOwner ? "owner" : "user",
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        username: input.username,
        avatarUrl: input.avatarUrl,
        // Promote to owner automatically; never demote an existing higher role otherwise.
        ...(isOwner ? { role: "owner" as const } : {}),
      },
    })
}

export async function getUserRole(userId: string): Promise<UserRole> {
  if (ownerId() && ownerId() === userId) return "owner"
  const db = getDb()
  const [row] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1)
  return (row?.role as UserRole) ?? "user"
}

export function canModerate(role: UserRole) {
  return role === "owner" || role === "moderator"
}

export async function isBanned(userId: string): Promise<boolean> {
  const db = getDb()
  const [row] = await db.select({ bannedAt: users.bannedAt }).from(users).where(eq(users.id, userId)).limit(1)
  return Boolean(row?.bannedAt)
}

export async function listPosts(viewerId?: string): Promise<CommunityPost[]> {
  const db = getDb()

  const rows = await db
    .select({
      id: posts.id,
      body: posts.body,
      createdAt: posts.createdAt,
      authorId: users.id,
      authorUsername: users.username,
      authorAvatarUrl: users.avatarUrl,
      authorCustomAvatarUrl: users.customAvatarUrl,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(isNull(posts.deletedAt))
    .orderBy(desc(posts.createdAt))
    .limit(50)

  if (rows.length === 0) return []

  const postIds = rows.map((row) => row.id)

  const [likeCounts, commentCounts, viewerLikes] = await Promise.all([
    db
      .select({ postId: postLikes.postId, value: count() })
      .from(postLikes)
      .where(inArray(postLikes.postId, postIds))
      .groupBy(postLikes.postId),
    db
      .select({ postId: comments.postId, value: count() })
      .from(comments)
      .where(and(inArray(comments.postId, postIds), isNull(comments.deletedAt)))
      .groupBy(comments.postId),
    viewerId
      ? db
          .select({ postId: postLikes.postId })
          .from(postLikes)
          .where(and(inArray(postLikes.postId, postIds), eq(postLikes.userId, viewerId)))
      : Promise.resolve([]),
  ])

  const likesByPost = new Map(likeCounts.map((row) => [row.postId, Number(row.value)]))
  const commentsByPost = new Map(commentCounts.map((row) => [row.postId, Number(row.value)]))
  const likedSet = new Set(viewerLikes.map((row) => row.postId))

  return rows.map((row) => ({
    id: row.id,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    author: {
      id: row.authorId,
      username: row.authorUsername,
      avatarUrl: displayAvatar({ avatarUrl: row.authorAvatarUrl, customAvatarUrl: row.authorCustomAvatarUrl }),
    },
    likeCount: likesByPost.get(row.id) ?? 0,
    commentCount: commentsByPost.get(row.id) ?? 0,
    likedByMe: likedSet.has(row.id),
  }))
}

export async function createPost(authorId: string, body: string) {
  const db = getDb()
  const [post] = await db
    .insert(posts)
    .values({ authorId, body })
    .returning({ id: posts.id, createdAt: posts.createdAt })

  return post
}

export async function listComments(postId: string): Promise<CommunityComment[]> {
  const db = getDb()

  const rows = await db
    .select({
      id: comments.id,
      body: comments.body,
      createdAt: comments.createdAt,
      authorId: users.id,
      authorUsername: users.username,
      authorAvatarUrl: users.avatarUrl,
      authorCustomAvatarUrl: users.customAvatarUrl,
    })
    .from(comments)
    .innerJoin(users, eq(comments.authorId, users.id))
    .where(and(eq(comments.postId, postId), isNull(comments.deletedAt)))
    .orderBy(comments.createdAt)

  return rows.map((row) => ({
    id: row.id,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    author: {
      id: row.authorId,
      username: row.authorUsername,
      avatarUrl: displayAvatar({ avatarUrl: row.authorAvatarUrl, customAvatarUrl: row.authorCustomAvatarUrl }),
    },
  }))
}

export async function createComment(postId: string, authorId: string, body: string) {
  const db = getDb()

  const [existing] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.id, postId), isNull(posts.deletedAt)))
    .limit(1)

  if (!existing) return null

  const [comment] = await db
    .insert(comments)
    .values({ postId, authorId, body })
    .returning({ id: comments.id, createdAt: comments.createdAt })

  return comment
}

export async function toggleLike(postId: string, userId: string) {
  const db = getDb()

  const [existingPost] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.id, postId), isNull(posts.deletedAt)))
    .limit(1)

  if (!existingPost) return null

  const [existingLike] = await db
    .select({ postId: postLikes.postId })
    .from(postLikes)
    .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)))
    .limit(1)

  if (existingLike) {
    await db.delete(postLikes).where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)))
  } else {
    await db.insert(postLikes).values({ postId, userId })
  }

  const [result] = await db
    .select({ value: count() })
    .from(postLikes)
    .where(eq(postLikes.postId, postId))

  return {
    liked: !existingLike,
    likeCount: Number(result?.value ?? 0),
  }
}

/* -------------------------------------------------------------------------- */
/*                                  Profiles                                  */
/* -------------------------------------------------------------------------- */

export async function getProfileByUsername(username: string): Promise<UserProfile | null> {
  const db = getDb()
  const [row] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.username}) = lower(${username})`)
    .limit(1)

  if (!row) return null
  return mapProfile(row)
}

export async function getProfileById(id: string): Promise<UserProfile | null> {
  const db = getDb()
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1)
  if (!row) return null
  return mapProfile(row)
}

function mapProfile(row: typeof users.$inferSelect): UserProfile {
  const ownerOverride = ownerId() && ownerId() === row.id
  return {
    id: row.id,
    username: row.username,
    avatarUrl: row.avatarUrl,
    customAvatarUrl: row.customAvatarUrl,
    bannerUrl: row.bannerUrl,
    bio: row.bio,
    role: (ownerOverride ? "owner" : (row.role as UserRole)) ?? "user",
    bannedAt: row.bannedAt ? row.bannedAt.toISOString() : null,
    bannedReason: row.bannedReason,
    musicUrl: row.musicUrl,
    musicTitle: row.musicTitle,
    lastActiveAt: row.lastActiveAt ? row.lastActiveAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  }
}

export async function updateProfile(
  userId: string,
  patch: {
    bio?: string | null
    customAvatarUrl?: string | null
    bannerUrl?: string | null
    musicUrl?: string | null
    musicTitle?: string | null
  },
) {
  const db = getDb()
  await db
    .update(users)
    .set({
      ...(patch.bio !== undefined ? { bio: patch.bio } : {}),
      ...(patch.customAvatarUrl !== undefined ? { customAvatarUrl: patch.customAvatarUrl } : {}),
      ...(patch.bannerUrl !== undefined ? { bannerUrl: patch.bannerUrl } : {}),
      ...(patch.musicUrl !== undefined ? { musicUrl: patch.musicUrl } : {}),
      ...(patch.musicTitle !== undefined ? { musicTitle: patch.musicTitle } : {}),
    })
    .where(eq(users.id, userId))
}

/* -------------------------------------------------------------------------- */
/*                          Stats / Follows / Views                           */
/* -------------------------------------------------------------------------- */

/** Update the user's last-active timestamp. Call on meaningful activity. */
export async function touchActivity(userId: string) {
  const db = getDb()
  await db.update(users).set({ lastActiveAt: new Date() }).where(eq(users.id, userId))
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const db = getDb()
  const [row] = await db
    .select({ f: follows.followerId })
    .from(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
    .limit(1)
  return Boolean(row)
}

/** Toggle follow. Returns the new state and the target's follower count. */
export async function toggleFollow(followerId: string, followingId: string) {
  if (followerId === followingId) return null
  const db = getDb()
  const already = await isFollowing(followerId, followingId)
  if (already) {
    await db
      .delete(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
  } else {
    await db.insert(follows).values({ followerId, followingId }).onConflictDoNothing()
  }
  const [row] = await db
    .select({ value: count() })
    .from(follows)
    .where(eq(follows.followingId, followingId))
  return { following: !already, followers: Number(row?.value ?? 0) }
}

type FollowUser = { id: string; username: string; avatarUrl: string | null }

export async function listFollowers(userId: string): Promise<FollowUser[]> {
  const db = getDb()
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      avatarUrl: users.avatarUrl,
      customAvatarUrl: users.customAvatarUrl,
    })
    .from(follows)
    .innerJoin(users, eq(follows.followerId, users.id))
    .where(eq(follows.followingId, userId))
    .orderBy(desc(follows.createdAt))
    .limit(200)
  return rows.map((r) => ({
    id: r.id,
    username: r.username,
    avatarUrl: displayAvatar({ avatarUrl: r.avatarUrl, customAvatarUrl: r.customAvatarUrl }),
  }))
}

export async function listFollowing(userId: string): Promise<FollowUser[]> {
  const db = getDb()
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      avatarUrl: users.avatarUrl,
      customAvatarUrl: users.customAvatarUrl,
    })
    .from(follows)
    .innerJoin(users, eq(follows.followingId, users.id))
    .where(eq(follows.followerId, userId))
    .orderBy(desc(follows.createdAt))
    .limit(200)
  return rows.map((r) => ({
    id: r.id,
    username: r.username,
    avatarUrl: displayAvatar({ avatarUrl: r.avatarUrl, customAvatarUrl: r.customAvatarUrl }),
  }))
}

/** Record a profile view, de-duplicated per viewer within 6 hours. */
export async function recordProfileView(profileId: string, viewerKey: string) {
  if (!viewerKey) return
  const db = getDb()
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000)
  const [recent] = await db
    .select({ id: profileViews.id })
    .from(profileViews)
    .where(
      and(
        eq(profileViews.profileId, profileId),
        eq(profileViews.viewerKey, viewerKey),
        gte(profileViews.createdAt, sixHoursAgo),
      ),
    )
    .limit(1)
  if (recent) return
  await db.insert(profileViews).values({ profileId, viewerKey })
}

/** Compute the full activity stats for a user profile. */
export async function getUserStats(profile: UserProfile): Promise<UserStats> {
  const db = getDb()
  const userId = profile.id
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [
    postCountRows,
    commentCountRows,
    likesRows,
    followerRows,
    followingRows,
    totalViewRows,
    uniqueViewRows,
    weeklyViewRows,
  ] = await Promise.all([
    db.select({ v: count() }).from(posts).where(and(eq(posts.authorId, userId), isNull(posts.deletedAt))),
    db.select({ v: count() }).from(comments).where(and(eq(comments.authorId, userId), isNull(comments.deletedAt))),
    db
      .select({ v: count() })
      .from(postLikes)
      .innerJoin(posts, eq(postLikes.postId, posts.id))
      .where(and(eq(posts.authorId, userId), isNull(posts.deletedAt))),
    db.select({ v: count() }).from(follows).where(eq(follows.followingId, userId)),
    db.select({ v: count() }).from(follows).where(eq(follows.followerId, userId)),
    db.select({ v: count() }).from(profileViews).where(eq(profileViews.profileId, userId)),
    db.select({ v: countDistinct(profileViews.viewerKey) }).from(profileViews).where(eq(profileViews.profileId, userId)),
    db
      .select({ v: count() })
      .from(profileViews)
      .where(and(eq(profileViews.profileId, userId), gte(profileViews.createdAt, weekAgo))),
  ])

  const joinDate = new Date(profile.createdAt)
  const lastActive = profile.lastActiveAt ? new Date(profile.lastActiveAt) : joinDate
  const daysActive = Math.max(
    1,
    Math.ceil((lastActive.getTime() - joinDate.getTime()) / (24 * 60 * 60 * 1000)),
  )

  return {
    ...EMPTY_STATS,
    posts: Number(postCountRows[0]?.v ?? 0),
    comments: Number(commentCountRows[0]?.v ?? 0),
    likesReceived: Number(likesRows[0]?.v ?? 0),
    marketplaceSales: 0,
    profileViews: Number(totalViewRows[0]?.v ?? 0),
    uniqueVisitors: Number(uniqueViewRows[0]?.v ?? 0),
    weeklyViews: Number(weeklyViewRows[0]?.v ?? 0),
    followers: Number(followerRows[0]?.v ?? 0),
    following: Number(followingRows[0]?.v ?? 0),
    daysActive,
    joinDate: profile.createdAt,
    lastActive: profile.lastActiveAt,
  }
}

export async function listProfileComments(profileId: string): Promise<ProfileComment[]> {
  const db = getDb()
  const rows = await db
    .select({
      id: profileComments.id,
      body: profileComments.body,
      createdAt: profileComments.createdAt,
      authorId: users.id,
      authorUsername: users.username,
      authorAvatarUrl: users.avatarUrl,
      authorCustomAvatarUrl: users.customAvatarUrl,
      authorRole: users.role,
    })
    .from(profileComments)
    .innerJoin(users, eq(profileComments.authorId, users.id))
    .where(and(eq(profileComments.profileId, profileId), isNull(profileComments.deletedAt)))
    .orderBy(desc(profileComments.createdAt))
    .limit(100)

  return rows.map((row) => ({
    id: row.id,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    author: {
      id: row.authorId,
      username: row.authorUsername,
      avatarUrl: displayAvatar({ avatarUrl: row.authorAvatarUrl, customAvatarUrl: row.authorCustomAvatarUrl }),
      role: (ownerId() === row.authorId ? "owner" : (row.authorRole as UserRole)) ?? "user",
    },
  }))
}

export async function createProfileComment(profileId: string, authorId: string, body: string) {
  const db = getDb()
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.id, profileId)).limit(1)
  if (!existing) return null

  const [comment] = await db
    .insert(profileComments)
    .values({ profileId, authorId, body })
    .returning({ id: profileComments.id, createdAt: profileComments.createdAt })

  return comment
}

/* -------------------------------------------------------------------------- */
/*                                 Moderation                                 */
/* -------------------------------------------------------------------------- */

export async function softDeletePost(postId: string) {
  const db = getDb()
  await db.update(posts).set({ deletedAt: new Date() }).where(eq(posts.id, postId))
}

export async function softDeleteComment(commentId: string) {
  const db = getDb()
  await db.update(comments).set({ deletedAt: new Date() }).where(eq(comments.id, commentId))
}

export async function softDeleteProfileComment(commentId: string) {
  const db = getDb()
  await db.update(profileComments).set({ deletedAt: new Date() }).where(eq(profileComments.id, commentId))
}

export async function setBan(targetUserId: string, banned: boolean, reason: string | null) {
  const db = getDb()
  // Never allow banning the configured owner.
  if (ownerId() && ownerId() === targetUserId) return false
  await db
    .update(users)
    .set({
      bannedAt: banned ? new Date() : null,
      bannedReason: banned ? reason : null,
    })
    .where(eq(users.id, targetUserId))
  return true
}

export async function setRole(targetUserId: string, role: UserRole) {
  const db = getDb()
  if (ownerId() && ownerId() === targetUserId) return false
  await db.update(users).set({ role }).where(eq(users.id, targetUserId))
  return true
}

export async function ensureSchema() {
  const db = getDb()
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      avatar_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_avatar_url TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS banner_url TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_reason TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS music_url TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS music_title TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

    CREATE TABLE IF NOT EXISTS posts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      author_id TEXT NOT NULL REFERENCES users(id),
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMPTZ
    );

    CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts (created_at DESC);

    CREATE TABLE IF NOT EXISTS comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      author_id TEXT NOT NULL REFERENCES users(id),
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMPTZ
    );

    CREATE INDEX IF NOT EXISTS comments_post_id_idx ON comments (post_id);

    CREATE TABLE IF NOT EXISTS post_likes (
      post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (post_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS profile_comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      profile_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      author_id TEXT NOT NULL REFERENCES users(id),
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMPTZ
    );

    CREATE INDEX IF NOT EXISTS profile_comments_profile_id_idx ON profile_comments (profile_id);

    CREATE TABLE IF NOT EXISTS follows (
      follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      following_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (follower_id, following_id)
    );

    CREATE INDEX IF NOT EXISTS follows_following_idx ON follows (following_id);

    CREATE TABLE IF NOT EXISTS profile_views (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      profile_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      viewer_key TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS profile_views_profile_idx ON profile_views (profile_id);
    CREATE INDEX IF NOT EXISTS profile_views_created_idx ON profile_views (created_at);
  `)
}
