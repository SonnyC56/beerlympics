import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      // Apostrophes/quotes in body copy render fine; this rule is purely stylistic.
      "react/no-unescaped-entities": "off",
    },
  },
  {
    ignores: ["convex/_generated/**", ".next/**", "node_modules/**"],
  },
];

export default eslintConfig;
