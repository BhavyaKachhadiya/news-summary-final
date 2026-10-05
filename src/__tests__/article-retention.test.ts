import { describe, it, expect, vi, beforeEach } from "vitest";
import { deleteExpiredArticles } from "@/services/news.service";
import { Article } from "@/models/Article";

vi.mock("@/lib/mongodb", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/models/Article", () => ({
  Article: {
    deleteMany: vi.fn(),
  },
}));

describe("Article Retention - Deletion of posts older than 3 days", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delete articles where publishedAt or createdAt is older than 3 days", async () => {
    vi.mocked(Article.deleteMany).mockResolvedValueOnce({
      deletedCount: 15,
      acknowledged: true,
    } as any);

    const deleted = await deleteExpiredArticles(3);

    expect(deleted).toBe(15);
    expect(Article.deleteMany).toHaveBeenCalledTimes(1);

    const callArgs = vi.mocked(Article.deleteMany).mock.calls[0][0] as any;
    expect(callArgs).toBeDefined();
    expect(callArgs.$or).toBeDefined();
    expect(callArgs.$or).toHaveLength(2);

    const publishedAtCondition = callArgs.$or[0].publishedAt.$lt;
    const createdAtCondition = callArgs.$or[1].createdAt.$lt;

    expect(publishedAtCondition).toBeInstanceOf(Date);
    expect(createdAtCondition).toBeInstanceOf(Date);

    // Verify cutoff is approximately 3 days in the past (within 2 seconds)
    const expectedCutoff = Date.now() - 3 * 24 * 60 * 60 * 1000;
    expect(Math.abs(publishedAtCondition.getTime() - expectedCutoff)).toBeLessThan(2000);
    expect(Math.abs(createdAtCondition.getTime() - expectedCutoff)).toBeLessThan(2000);
  });
});
