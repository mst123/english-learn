import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";

const DATE_DIR_REGEX = /^\d{4}-\d{2}$/;
const DATE_FILE_REGEX = /^\d{1,2}\.html$/;

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDirRecursive(from, to);
    else fs.copyFileSync(from, to);
  }
}

function copyDateHtmlAndAssetsToDist(rootDir, outDir) {
  for (const item of fs.readdirSync(rootDir, { withFileTypes: true })) {
    if (!item.isDirectory() || !DATE_DIR_REGEX.test(item.name)) continue;

    const srcMonthDir = path.join(rootDir, item.name);
    const destMonthDir = path.join(outDir, item.name);
    fs.mkdirSync(destMonthDir, { recursive: true });

    for (const file of fs.readdirSync(srcMonthDir, { withFileTypes: true })) {
      if (!file.isFile() || !DATE_FILE_REGEX.test(file.name)) continue;
      fs.copyFileSync(
        path.join(srcMonthDir, file.name),
        path.join(destMonthDir, file.name),
      );
    }
  }

  const assestsDir = path.join(rootDir, "assests");
  if (fs.existsSync(assestsDir)) {
    copyDirRecursive(assestsDir, path.join(outDir, "assests"));
  }
}

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
  let viteConfig;

  function withBase(paths) {
    const raw = viteConfig?.base ?? "/";
    const base = raw.endsWith("/") ? raw.slice(0, -1) : raw;
    if (!base) return paths;
    return {
      title: paths.title,
      directPath: `${base}${paths.directPath}`,
      shortPath: `${base}${paths.shortPath}`,
      filePath: `${base}${paths.filePath}`,
    };
  }

  return {
    name: "english-learn-friendly-routes",
    configResolved(config) {
      viteConfig = config;
    },
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
    closeBundle() {
      if (viteConfig.command !== "build") return;

      const outDir = viteConfig.build.outDir;
      const rootDir = viteConfig.root;
      copyDateHtmlAndAssetsToDist(rootDir, outDir);

      const entries = collectEntries(rootDir).map((e) => withBase(e));
      const outFile = path.join(outDir, "entries.json");
      fs.mkdirSync(path.dirname(outFile), { recursive: true });
      fs.writeFileSync(outFile, JSON.stringify(entries), "utf8");
    },
  };
}

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/english-learn/" : "/",
  plugins: [englishLearnPlugin()],
  server: {
    port: 8088,
    host: "0.0.0.0",
  },
}));
