/* eslint-disable */
const { config } = require("@internxt/css-config");

module.exports = {
    ...config,
    important: true,
    content: [
        ...config.content,
        "./node_modules/@internxt/ui/dist/**/*.{js,ts,jsx,tsx}",
        "./react/**/*.{js,ts,jsx,tsx}",
    ],
    corePlugins: {
        preflight: true,
    },
};
