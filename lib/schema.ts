import { index, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull(),
  avatarUrl: text("avatar_url"),
  // Custom profile fields
  bio: text("bio"),
  customAvatarUrl: text("custom_avatar_url"),
  bannerUrl: text("banner_url"),
  // "user" | "moderator" | "owner"
  role: text("role").notNull().default("user"),
  bannedAt: timestamp("banned_at", { withTimezone: true }),
  bannedReason: text("banned_reason"),
  // Profile music
  musicUrl: text("music_url"),
  musicTitle: text("music_title"),
  // Activity tracking
  lastActiveAt: timestamp("last_active_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

// Follow graph: followerId follows followingId.
export const follows = pgTable(
  "follows",
  {
    followerId: text("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followingId: text("following_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.followerId, table.followingId] }),
    index("follows_following_idx").on(table.followingId),
  ],
)

// Profile visits. viewerKey is the logged-in user id or an anonymous cookie id.
export const profileViews = pgTable(
  "profile_views",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: text("profile_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    viewerKey: text("viewer_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("profile_views_profile_idx").on(table.profileId),
    index("profile_views_created_idx").on(table.createdAt),
  ],
)

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [index("posts_created_at_idx").on(table.createdAt)],
)

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [index("comments_post_id_idx").on(table.postId)],
)

export const postLikes = pgTable(
  "post_likes",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.postId, table.userId] })],
)

// Comments left on a user's profile by other users.
export const profileComments = pgTable(
  "profile_comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // The profile being commented on
    profileId: text("profile_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // The user who wrote the comment
    authorId: text("author_id")
      .notNull()
      .references(() => users.id),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [index("profile_comments_profile_id_idx").on(table.profileId)],
)
