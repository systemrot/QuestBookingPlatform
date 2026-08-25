import "dotenv/config";
import { upsertUserFromOAuth } from "../src/lib/oauth-user";

async function main() {
  const result = await upsertUserFromOAuth({
    email: "oauth-smoke-test@yandex.ru",
    name: "OAuth Smoke",
    phoneRaw: "+74951234567",
  });
  console.log("result:", result);
}

main().catch((error) => {
  console.error("FAILED:", error);
  process.exit(1);
});
