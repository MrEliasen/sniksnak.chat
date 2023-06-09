/** @type {import("prettier").Config} */
const config = {
    plugins: [require.resolve("prettier-plugin-tailwindcss")],
    semi: true,
    singleQuote: false,
    trailingComma: "all",
    tabWidth: 4,
};

module.exports = config;
