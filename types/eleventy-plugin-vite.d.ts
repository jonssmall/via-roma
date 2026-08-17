// The Eleventy Vite plugin ships no type declarations. It is only ever passed
// to `addPlugin`, so an opaque default export is enough.
declare module "@11ty/eleventy-plugin-vite" {
  const plugin: unknown;
  export default plugin;
}
