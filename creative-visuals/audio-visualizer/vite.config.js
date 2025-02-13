import { defineConfig } from "vite";

export default defineConfig(async () => {
  const config = {
    plugins: [],
    build: {
      target: "esnext",
      sourcemap: false, // Disable sourcemaps for better protection
    },
  };
  return config;
});
