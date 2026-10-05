import { Schema, model, models, type Model, type HydratedDocument } from "mongoose";
import type { ArticleDocument as IArticleDocument } from "@/types/news";

export type ArticleModelFields = Omit<IArticleDocument, "_id">;

export type ArticleModelDocument = HydratedDocument<ArticleModelFields>;

const ArticleSchema = new Schema<ArticleModelFields>(
  {
    source: {
      type: String,
      required: true,
      default: "The Hindu",
      index: true,
    },
    sourceUrl: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    guid: {
      type: String,
      default: null,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    content: {
      type: String,
      default: "",
    },
    imageUrl: {
      type: String,
      default: null,
      trim: true,
    },
    category: {
      type: String,
      enum: ["technology", "business"],
      required: true,
      index: true,
    },
    author: {
      type: String,
      default: "",
      trim: true,
    },
    publishedAt: {
      type: Date,
      required: true,
      index: true,
    },
    fetchedAt: {
      type: Date,
      default: Date.now,
    },
    summarizedAt: {
      type: Date,
      default: null,
    },
    summaryStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true,
    },
    summaryStartedAt: {
      type: Date,
      default: null,
      index: true,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    summary: {
      type: Schema.Types.Mixed,
      default: null,
    },
    summaryError: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for category + reverse chronological order
ArticleSchema.index({
  category: 1,
  publishedAt: -1,
});

// Index for status queries
ArticleSchema.index({
  summaryStatus: 1,
  publishedAt: -1,
});

// Compound index for source + category + publishedAt
ArticleSchema.index({
  source: 1,
  category: 1,
  publishedAt: -1,
});

// Compound index for detecting stuck jobs
ArticleSchema.index({
  summaryStatus: 1,
  summaryStartedAt: 1,
});

// Index on publishedAt for quick chronological and date-range queries
ArticleSchema.index({
  publishedAt: -1,
});

// TTL index on createdAt: automatically delete documents 3 days (259,200 seconds) after creation
ArticleSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 3 * 24 * 60 * 60 }
);

// Mongoose Model with HydratedDocument support
export const Article: Model<ArticleModelFields> =
  models.Article || model<ArticleModelFields>("Article", ArticleSchema);
