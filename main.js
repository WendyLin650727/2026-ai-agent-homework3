import { input } from "@inquirer/prompts";
import { searchFruits } from "./lib/qdrant.js";
import { spinner } from "./utils/spinner.js";

try {
  while (true) {
    const query = (
      await input({ message: "請輸入要搜尋的水果(芒果、鳳梨、釋迦、蓮霧、芭樂，以上5種水果擇一)：" })
    ).trim();
    
    if (query === "") continue;
    if (query.toLowerCase() === "exit") {
      console.log("再會~");
      break;
    }

    const spin = spinner("搜尋中...").start();
    const results = await searchFruits(query, 5);
    spin.stop();

    

    for (const [i, r] of results.entries()) {
      //console.log(`\n${i + 1}. ${r.name} (${r.introduction}, ${r.production_season})`);
      //console.log(`   分數：${r.score.toFixed(3)}`);
      console.log(` 水果名：${r.name}`);
      console.log(`   描述：${r.introduction}`);
      console.log(`   特色：${r.feature}`);
      console.log(`   產季：${r.production_season}`);
    }
    console.log();
  }
} catch (err) {
  if (err.name === "ExitPromptError") {
    console.log("\n再會~");
  } else {
    throw err;
  }
}