import { GoogleGenerativeAI } from "@google/generative-ai";
import { CATEGORIES } from "./constants";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
}, { timeout: 10000 });

/**
 * AI 기반 카테고리 자동 분류
 * URL, title, description을 기반으로 23개 카테고리 중 가장 적합한 것을 반환
 */
export async function classifyCategory(
    url: string,
    title: string | null,
    description: string | null
): Promise<string> {
    if (!process.env.GEMINI_API_KEY) {
        console.warn("[Gemini] GEMINI_API_KEY is not set. Skipping AI classification.");
        return "Etc";
    }

    try {
        const categoryList = CATEGORIES.join(", ");

        const prompt = `You are a content classifier. Classify the following web content into exactly ONE of these categories:
[${categoryList}]

URL: ${url}
Title: ${title || "Unknown"}
Description: ${description || "No description"}

Rules:
- Return ONLY the category name, nothing else.
- The category must be exactly one from the list above.
- If unsure, return "Etc".

Category:`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const category = response.text().trim();

        // Validate against known categories
        if (CATEGORIES.includes(category)) {
            console.log(`[Gemini] Classified as: ${category}`);
            return category;
        }

        // Fuzzy match (case-insensitive)
        const matched = CATEGORIES.find(
            (c) => c.toLowerCase() === category.toLowerCase()
        );
        if (matched) {
            console.log(`[Gemini] Classified as (fuzzy): ${matched}`);
            return matched;
        }

        console.warn(`[Gemini] Unknown category returned: "${category}", defaulting to Etc`);
        return "Etc";
    } catch (error) {
        console.error("[Gemini] Classification error:", error);
        return "Etc";
    }
}

/**
 * AI 기반 콘텐츠 요약
 */
export async function summarizeContent(
    title: string | null,
    description: string | null,
    lang: string = "en"
): Promise<string | null> {
    if (!process.env.GEMINI_API_KEY) {
        return null;
    }

    try {
        const langStr = lang === "ko" ? "Korean" : "English";
        const prompt = `Analyze the following web content and provide a concise one-sentence summary in ${langStr}.
Title: ${title || "Unknown"}
Description: ${description || "No description"}

Summary (one sentence, ${langStr}):`;

        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        console.error("[Gemini] Summarization error:", error);
        return null;
    }
}

/**
 * AI 기반 태그 추출 (최대 5개)
 */
export async function extractTags(
    title: string | null,
    description: string | null,
    lang: string = "en"
): Promise<string[]> {
    if (!process.env.GEMINI_API_KEY) {
        return [];
    }

    try {
        const mixRule = lang === "ko" ? "- Mix of Korean and English is fine" : "- Only use English words";
        const prompt = `Extract up to 5 relevant tags/keywords from the following content.
Title: ${title || "Unknown"}
Description: ${description || "No description"}

Rules:
- Return tags as a comma-separated list
- Tags should be concise, 1-2 words each
${mixRule}
- Return ONLY the comma-separated list, nothing else

Tags:`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const tags = text
            .split(',')
            .map((t) => t.trim())
            .filter((t) => t.length > 0 && t.length < 20)
            .slice(0, 5);

        console.log(`[Gemini] Extracted tags: ${tags.join(', ')}`);
        return tags;
    } catch (error) {
        console.error("[Gemini] Tag extraction error:", error);
        return [];
    }
}
