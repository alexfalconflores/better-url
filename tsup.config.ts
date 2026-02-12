import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"], // Cambia esto según la ubicación de tu archivo principal
  format: ["esm", "cjs"], // Formatos de salida (ESM y CommonJS)
  dts: true, // Genera los archivos de declaración .d.ts
  sourcemap: true, // Genera mapas de origen
  clean: true, // Limpia la carpeta de salida antes de generar
  outDir: "dist", // Carpeta de salida

  splitting: false,
  target: "es2020",
  minify: false,
});
