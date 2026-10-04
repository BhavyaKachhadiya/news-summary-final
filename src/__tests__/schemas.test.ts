import { describe, it, expect } from "vitest";
import { validateSummary } from "@/schemas";
import { cleanJsonResponse } from "@/services/gemini.service";

describe("Summary Validation Schemas & JSON Cleaning", () => {
  it("should validate a conforming Technology summary", () => {
    const validTechData = {
      headline: "Google Announces New Gemini Quantum Breakthrough",
      overview: "Google DeepMind researchers have unveiled quantum error correction algorithms.",
      background: "Quantum computing has historically suffered from high qubit decoherence rates.",
      what_happened: "The team demonstrated fault-tolerant logic gates with fidelity exceeding 99.9%.",
      key_details: [
        "Fidelity exceeded 99.9% across 100 physical qubits",
        "Published in peer-reviewed scientific journals",
      ],
      technology_explained:
        "Surface code error correction groups multiple physical qubits into a single logical qubit.",
      people: [
        {
          name: "Demis Hassabis",
          role: "CEO of Google DeepMind",
          involvement: "Announced the milestone in London",
        },
      ],
      companies_and_organizations: [
        {
          name: "Google DeepMind",
          involvement: "Primary research division conducting the experiments",
        },
      ],
      statements_and_claims: ["This represents a key transition point towards practical quantum advantage."],
      impact: "Accelerates timelines for quantum drug discovery and cryptographic resilience.",
      future_developments: ["Scaling towards 1,000 logical qubits by 2028."],
      key_takeaways: [
        "Record 99.9% gate fidelity achieved",
        "Fault tolerance demonstrated experimentally",
      ],
      category: "Technology",
    };

    const res = validateSummary("technology", validTechData);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.category).toBe("Technology");
      expect(res.data.headline).toBe(validTechData.headline);
    }
  });

  it("should fail validation for Technology summary when required fields are missing", () => {
    const invalidData = {
      headline: "Short headline",
      // missing overview & what_happened
      category: "Technology",
    };

    const res = validateSummary("technology", invalidData);
    expect(res.success).toBe(false);
  });

  it("should validate a conforming Business summary with financial details", () => {
    const validBizData = {
      headline: "RBI Keeps Repo Rate Unchanged at 6.5% Amid Inflation Watch",
      overview: "The Monetary Policy Committee decided to maintain the benchmark lending rate.",
      background: "Retail inflation has hovered near the upper tolerance limit of 4-6%.",
      what_happened: "Governor announced the unanimous decision following a three-day MPC meeting in Mumbai.",
      business_details: [
        "Unanimous decision by 6-member MPC",
        "GDP growth forecast retained at 7.0% for FY25",
      ],
      financial_details: [
        {
          metric: "Repo Rate",
          value: "6.50%",
          context: "Benchmark policy rate maintained for the 7th consecutive meeting",
        },
        {
          metric: "FY25 GDP Projection",
          value: "7.0%",
          context: "Projected annual gross domestic product growth rate",
        },
      ],
      regulatory_context: "RBI monetary policy guidelines and banking liquidity stance remained 'withdrawal of accommodation'.",
      market_economic_context: "Stock benchmarks Sensex and Nifty rallied 300 points following the rate announcement.",
      companies_and_organizations: [
        {
          name: "Reserve Bank of India",
          type: "Regulator / Central Bank",
          role: "Formulates monetary and banking policy",
        },
      ],
      people: [
        {
          name: "Shaktikanta Das",
          role: "RBI Governor",
          involvement: "Chaired the Monetary Policy Committee",
        },
      ],
      statements_and_claims: ["The fight against inflation is far from over, and vigilance remains paramount."],
      impact: "Home loans and commercial borrowing rates are expected to stay stable.",
      risks_and_uncertainties: ["Geopolitical conflicts driving crude oil price shocks."],
      future_developments: ["Next MPC review scheduled for October 2026."],
      key_takeaways: [
        "Repo rate steady at 6.5%",
        "GDP growth forecast held at 7.0%",
        "Inflation outlook monitored closely",
      ],
      category: "Business",
    };

    const res = validateSummary("business", validBizData);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.category).toBe("Business");
    }
  });

  it("should cleanly strip markdown code fences from Gemini JSON strings", () => {
    const fencedJson = "```json\n{\"headline\": \"Test\", \"overview\": \"Overview text\"}\n```";
    const cleaned = cleanJsonResponse(fencedJson);

    expect(cleaned).toBe('{"headline": "Test", "overview": "Overview text"}');
    expect(JSON.parse(cleaned).headline).toBe("Test");
  });

  it("should strip explanatory text surrounding the JSON object", () => {
    const raw = "Here is your requested JSON response:\n{\"headline\": \"AI Milestone\"}\nHope this helps!";
    const cleaned = cleanJsonResponse(raw);

    expect(cleaned).toBe('{"headline": "AI Milestone"}');
    expect(JSON.parse(cleaned).headline).toBe("AI Milestone");
  });
});
