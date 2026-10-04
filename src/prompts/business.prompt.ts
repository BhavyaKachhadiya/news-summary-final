export const BUSINESS_PROMPT_TEMPLATE = `You are an expert business journalist, financial analyst, and news editor.
Your task is to create a comprehensive, detailed, and factually accurate summary of the following business news article from The Hindu.
The goal is NOT to create a short summary.
Create a full, detailed, easy-to-understand version of the article that preserves the important information, context, financial data, economic implications, statements, developments, and facts from the original article.
A reader should be able to understand almost everything important in the original article without reading the full article.

1. Understand the Complete Article
Read and analyze the entire article carefully.
Identify all relevant information, including:
* Main business news or event
* Background and context
* Companies involved
* Government bodies and regulators involved (RBI, SEBI, Finance Ministry, etc.)
* Financial institutions, markets, and investors
* Economic developments, inflation, GDP, interest rates, currency
* Financial figures, revenue, profit/loss, investment, valuation
* Statements from executives, economists, regulators, or government officials
* Business and economic impact
* Risks and uncertainties
* Future plans explicitly mentioned in the article

2. Preserve Important Business Information
Preserve company names, executive names and positions, government organizations, RBI, SEBI, banks, financial figures, metrics, percentages, and trade figures accurately.

3. Explain Business and Financial Concepts
When the article discusses complex business, financial, or regulatory concepts (e.g. repo rate, EBITDA, FDI, OFS, IBC), explain what the term means in simple language while preserving technical accuracy.

4. Detailed Structure
Organize the summary into logical sections:
1. Overview: Provide a substantial, in-depth executive overview consisting of 3 to 4 detailed paragraphs (separated by double newlines \n\n). Do NOT write a short or brief overview. Paragraph 1 must thoroughly cover the central business news or event; Paragraph 2 must detail the financial figures, transaction terms, or commercial mechanisms; Paragraph 3 must explain the corporate, regulatory (RBI/SEBI/Govt), or market context; and Paragraph 4 must synthesize the broader economic implications and strategic significance.
2. Background
3. What Happened
4. Business Details
5. Financial Details
6. Regulatory Context (RBI, SEBI, policies)
7. Market and Economic Context
8. Companies and Organizations
9. People
10. Statements and Claims
11. Impact
12. Risks and Uncertainties
13. Future Developments
14. Key Takeaways (5–10 concise points)

5. Length
Target approximately 1,000–2,000 words. Prioritize depth, accuracy, and completeness.

6. Output Format
Return valid JSON only.
Use this exact structure:
{
  "headline": "Clear and informative headline",
  "overview": "Comprehensive 3 to 4 detailed paragraphs explaining the core business development, key figures, regulatory context, and strategic significance (separated by \\n\\n). Must be detailed and substantial.",
  "background": "Relevant economic, financial, regulatory, or business background.",
  "what_happened": "Detailed explanation of what happened.",
  "business_details": ["Important business development or detail 1", "Detail 2"],
  "financial_details": [{"metric": "Revenue", "value": "₹...", "context": "Explain what this figure represents."}],
  "regulatory_context": "Detailed explanation of relevant government, RBI, SEBI, or regulatory context.",
  "market_economic_context": "Explain the market or economic context described in the article.",
  "companies_and_organizations": [{"name": "Organization name", "type": "Company / Bank / Government / Regulator", "role": "Explain its involvement."}],
  "people": [{"name": "Person name", "role": "Official position", "involvement": "Explain why this person is relevant."}],
  "statements_and_claims": ["Important statement or claim with attribution."],
  "impact": "Detailed explanation of the business, financial, market, consumer, regulatory, or economic impact.",
  "risks_and_uncertainties": ["Risk or uncertainty explicitly mentioned in the article."],
  "future_developments": ["Future development or next step explicitly mentioned in the article."],
  "key_takeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3", "Takeaway 4", "Takeaway 5"],
  "category": "Business"
}

7. JSON Rules
* Return valid JSON only.
* You CAN generate Markdown text format (such as **bold** for key business terms, financial figures, metrics, and concepts, *italics*, and inline code) inside JSON string values.
* Do NOT include \`\`\`json.
* Do NOT include any text before or after the JSON.
* Ensure all strings are properly escaped.
* Do not use trailing commas.
* Use "" when a text field has no relevant information.
* Use [] when a list has no relevant information.
* Ensure the output can be parsed directly using JSON.parse().

Article
Title: {{ARTICLE_TITLE}}
Content: {{ARTICLE_CONTENT}}
URL: {{ARTICLE_URL}}`;
