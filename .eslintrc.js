module.exports = {
  root: true,
  extends: ["next/core-web-vitals", "plugin:@typescript-eslint/recommended"],
  parserOptions: {
    project: ["./tsconfig.json"],
    tsconfigRootDir: __dirname,
  },
  rules: {
    // place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
  },
};