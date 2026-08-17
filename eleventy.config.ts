import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import EleventyVitePlugin from "@11ty/eleventy-plugin-vite";
import tailwindcss from "@tailwindcss/vite";

type EleventyConfig = {
  addPlugin: (plugin: unknown, options?: unknown) => void;
  addPassthroughCopy: (path: string | Record<string, string>) => void;
  addFilter: (name: string, fn: (...args: never[]) => unknown) => void;
  addWatchTarget: (path: string) => void;
  addDataExtension: (ext: string, options: unknown) => void;
  setInputDirectory: (dir: string) => void;
  setOutputDirectory: (dir: string) => void;
  setIncludesDirectory: (dir: string) => void;
  setDataDirectory: (dir: string) => void;
  setTemplateFormats: (formats: string[]) => void;
  setServerOptions: (options: { port?: number }) => void;
  addTransform: (
    name: string,
    fn: (this: { page: { outputPath?: string | false } }, content: string) => string,
  ) => void;
};

// Set by the GitHub Pages workflow to "/<repo-name>" for a project page
// (served at username.github.io/repo-name/). Empty for local dev/build and
// for a custom-domain or user/org page, both of which serve from "/".
const PATH_PREFIX = (process.env.PATH_PREFIX ?? "").replace(/\/+$/, "");

export default function (eleventyConfig: EleventyConfig) {
  // Directory layout. Eleventy 3 honours these setters; the legacy
  // `return { dir: … }` form is silently ignored alongside a plugin config.
  eleventyConfig.setInputDirectory("src");
  eleventyConfig.setOutputDirectory("_site");
  eleventyConfig.setIncludesDirectory("_includes");
  eleventyConfig.setDataDirectory("_data");
  eleventyConfig.setTemplateFormats(["njk", "md", "html"]);
  // Distinct from osprey-point's 8080 so both can run at once during dev.
  eleventyConfig.setServerOptions({ port: 8081 });

  // Vite owns the asset pipeline: it bundles the CSS/TS referenced from the
  // generated HTML and serves it with HMR during `npm run dev`.
  eleventyConfig.addPlugin(EleventyVitePlugin, {
    tempFolderName: ".11ty-vite",
    viteOptions: {
      clearScreen: false,
      appType: "mpa",
      base: PATH_PREFIX ? `${PATH_PREFIX}/` : "/",
      plugins: [tailwindcss()],
      server: {
        middlewareMode: true,
      },
      build: {
        mode: "production",
        emptyOutDir: true,
        rolldownOptions: {
          output: {
            assetFileNames: "assets/[name].[hash][extname]",
            chunkFileNames: "assets/[name].[hash].js",
            entryFileNames: "assets/[name].[hash].js",
          },
        },
      },
    },
  });

  // Source assets land in the output untouched; Vite picks them up from there.
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addWatchTarget("src/assets");

  // Tells GitHub Pages not to run the output through Jekyll (which would
  // otherwise ignore any dotfile/underscore-prefixed path).
  eleventyConfig.addPassthroughCopy({ "src/.nojekyll": ".nojekyll" });

  // Every template writes root-absolute paths (href="/menu/", not a `url`
  // filter), which only works when the site is served from "/". A GitHub
  // Pages project page is served from "/<repo-name>/" instead, so rewrite
  // them at build time rather than touching every template. Vite-managed
  // asset URLs (under /assets/) are excluded — its own `base` option above
  // already prefixes those correctly, and rewriting them here too, before
  // Vite's post-build HTML pass runs, would make Vite unable to find its own
  // entry points.
  if (PATH_PREFIX) {
    eleventyConfig.addTransform("path-prefix", function (content: string) {
      if (this.page.outputPath === false) return content;
      if (!this.page.outputPath?.endsWith(".html")) return content;
      return content.replace(
        /\b(href|src|action)="(\/(?!\/|assets\/)[^"]*)"/g,
        (_match, attr: string, path: string) => `${attr}="${PATH_PREFIX}${path}"`,
      );
    });
  }

  // Global data files are TypeScript. Node 24 strips the types on import, so
  // there is no separate compile step — `npm run typecheck` is the only checker.
  eleventyConfig.addDataExtension("ts", {
    parser: async (_contents: string, path: string) => {
      // Cache-bust so `--serve` picks up edits to data files between rebuilds.
      const href = pathToFileURL(resolve(path)).href;
      const mod = await import(`${href}?v=${Date.now()}`);
      return mod.default;
    },
    read: false,
  });

  eleventyConfig.addFilter("currency", (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value),
  );

  // These two have no setter equivalent in Eleventy 3 — the returned object is
  // still how they are configured.
  return {
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
