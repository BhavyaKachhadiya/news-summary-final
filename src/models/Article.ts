import { Schema, model, models, type Model, type Document } from "mongoose";
import type { ArticleDocument as IArticleDocument } from "@/types/news";

export interface ArticleModelDocument extends Omit<IArticleDocument, "_id">, Document {}

const ArticleSchema = new Schema(
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

export const Article: Model<ArticleModelDocument> =
  models.Article || model<ArticleModelDocument>("Article", ArticleSchema);
