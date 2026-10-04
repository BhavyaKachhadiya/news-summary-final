import { NewsCategory } from "@/config/feeds";
import { TECHNOLOGY_PROMPT_TEMPLATE } from "./technology.prompt";
import { BUSINESS_PROMPT_TEMPLATE } from "./business.prompt";

export interface ArticlePromptInput {
  title: string;
  content: string;
  url: string;
}

export function getSummaryPrompt(
  category: NewsCategory,
  article: ArticlePromptInput
): string {
  let template: string;

  switch (category) {
    case "technology":
      template = TECHNOLOGY_PROMPT_TEMPLATE;
      break;
    case "business":
      template = BUSINESS_PROMPT_TEMPLATE;
      break;
    default: {
      const _exhaustiveCheck: never = category;
      throw new Error(`Unsupported category: ${_exhaustiveCheck}`);
    }
  }

  return template
    .replace("{{ARTICLE_TITLE}}", article.title || "Untitled")
    .replace("{{ARTICLE_CONTENT}}", article.content || "No content provided.")
    .replace("{{ARTICLE_URL}}", article.url || "N/A");
}
