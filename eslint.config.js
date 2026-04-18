import markdown from "@eslint/markdown";

export default [
  {
    ignores: [".reference/**"],
  },
  ...markdown.configs.recommended,
  {
    files: ["**/*.md"],
    language: "markdown/gfm",
  },
];

