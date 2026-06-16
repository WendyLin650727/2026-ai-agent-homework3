import { z } from "zod";
import { defineTool } from "../utils/func-tool.js";
import { searchFruits } from "../lib/qdrant.js";

async function search({ query, limit = 5 }) {
  return await searchFruits(query, limit);
}

export const netflixTool = defineTool({
  name: "search_fruits",
  description:
    "在水果資料庫中以語意搜尋相關資訊，可用於尋找水果的特色與產季等",
  fn: search,
  parameters: z.object({
    query: z.string().describe("查詢內容，可以是水果名稱、介紹、特色、產季或關鍵字"),
    limit: z.number().default(5).describe("回傳筆數上限，預設 5"),
  }),
});