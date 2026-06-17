import { readFile } from "node:fs/promises";
import { parse } from "csv-parse/sync";
import { client } from "../lib/openai.js";
import {
  qdrant,
  FRUITS_COLLECTION,
  EMBEDDING_DIM,
  EMBEDDING_MODEL,
} from "../lib/qdrant.js";

const CSV_PATH = "data/fruits.csv";
const BATCH_SIZE = 100;

function rowToText(row) {
  return [
    row.f_id,
    row.name,
    row.introduction,
    row.feature,
    row.production_season,
  ]
    .filter(Boolean)
    .join(" | ");
}

async function recreateCollection() {
  const exists = await qdrant.collectionExists(FRUITS_COLLECTION);
  if (exists.exists) {
    await qdrant.deleteCollection(FRUITS_COLLECTION);
  }
  await qdrant.createCollection(FRUITS_COLLECTION, {
    vectors: { size: EMBEDDING_DIM, distance: "Cosine" },
  });
}

async function embedBatch(texts) {
  const res = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  });
  return res.data.map((d) => d.embedding);
}

async function main() {
  const csv = await readFile(CSV_PATH, "utf8");
  const rows = parse(csv, { columns: true, skip_empty_lines: true });
  console.log(`讀到 ${rows.length} 筆資料`);

  await recreateCollection();
  console.log(`已建立 collection: ${FRUITS_COLLECTION}`);

  let processed = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const texts = batch.map(rowToText);
    const vectors = await embedBatch(texts);

    const points = batch.map((row, idx) => ({
      id: i + idx,
      vector: vectors[idx],
      payload: {
        f_id: row.f_id,
        name: row.name,
        introduction: row.introduction,
        feature: row.feature,
        production_season: row.production_season,
      },
    }));

    await qdrant.upsert(FRUITS_COLLECTION, { wait: true, points });
    processed += batch.length;
    console.log(`進度：${processed} / ${rows.length}`);
  }

  console.log("完成！");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});