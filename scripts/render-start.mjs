const args = process.argv.slice(2);

for (let index = 0; index < args.length; index += 1) {
  const current = args[index];
  const next = args[index + 1];

  if (current === "--port" && next) {
    process.env.PORT = next;
    index += 1;
  }

  if (current === "--host" && next) {
    process.env.HOST = next;
    process.env.NITRO_HOST = next;
    index += 1;
  }
}

process.env.HOST ||= "0.0.0.0";
process.env.NITRO_HOST ||= process.env.HOST;

await import("../.output/server/index.mjs");