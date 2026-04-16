import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";

const DATE_DIR_REGEX = /^\d{4}-\d{2}$/;
const DATE_FILE_REGEX = /^\d{1,2}\.html$/;

function collectEntries(rootDir) {
  const result = [];
  const items = fs.readdirSync(rootDir, { withFileTypes: true });

  for (const item of items) {
    if (!item.isDirectory() || !DATE_DIR_REGEX.test(item.name)) continue;

    const dateDir = path.join(rootDir, item.name);
    const files = fs.readdirSync(dateDir, { withFileTypes: true });
    for (const file of files) {
      if (!file.isFile() || !DATE_FILE_REGEX.test(file.name)) continue;

      const day = file.name.replace(".html", "").padStart(2, "0");
      const month = item.name;
      result.push({
        title: `${month}-${day}`,
        directPath: `/${month}/${day}`,
        shortPath: `/${month}-${day}`,
        filePath: `/${month}/${file.name}`,
      });
    }
  }

  return result.sort((a, b) => a.title.localeCompare(b.title));
}

function resolveFriendlyPath(pathname) {
  const nested = pathname.match(/^\/(\d{4}-\d{2})\/(\d{1,2})$/);
  if (nested) {
    const [, month, day] = nested;
    return `/${month}/${day}.html`;
  }

  const short = pathname.match(/^\/(\d{4}-\d{2})-(\d{1,2})$/);
  if (short) {
    const [, month, day] = short;
    return `/${month}/${day}.html`;
  }

  return null;
}

function englishLearnPlugin() {
  return {
    name: "english-learn-friendly-routes",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || "/";
        const pathname = url.split("?")[0];

        if (pathname === "/api/entries") {
          const entries = collectEntries(server.config.root);
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify(entries));
          return;
        }

        const rewritten = resolveFriendlyPath(pathname);
        if (rewritten) {
          req.url = rewritten;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [englishLearnPlugin()],
  server: {
    port: 8088,
    host: "0.0.0.0",
  },
});
