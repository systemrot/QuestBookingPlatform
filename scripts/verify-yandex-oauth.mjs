import "dotenv/config";

async function main() {
  const response = await fetch("http://localhost:3000/api/auth/providers");
  const providers = await response.json();
  const ids = Object.keys(providers);
  console.log("providers:", ids.join(", "));
  if (!ids.includes("yandex")) {
    throw new Error("Yandex provider is not registered");
  }
  console.log("OK: Yandex OAuth is configured locally");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
