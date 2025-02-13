import { defineConfig } from "vite";
import obfuscatorPlugin from "vite-plugin-javascript-obfuscator";

export default defineConfig(async ({ command, mode }) => {
  const config = {
    plugins: [
      obfuscatorPlugin({
        include: ["src/**/*.js"], // Adjust to match your file structure
        exclude: ["/node_modules"],
        options: {
          compact: true,
          controlFlowFlattening: true,
          deadCodeInjection: true,
          stringArray: true,
          stringArrayThreshold: 0.75,
          rotateStringArray: true,
          selfDefending: true,
          debugProtection: true,
        },
      }),
    ],
    build: {
      minify: "terser", // Ensures code is minified after obfuscation
      target: "esnext",
      sourcemap: false, // Disable sourcemaps for better protection
    },
  };
  return config;
});
