import { type Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

export default {
    content: ["./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            maxWidth: {
                quater: "25%",
                half: "50",
                most: "75%",
            },
            colors: {
                snakred: {
                    50: "#fdf2f2",
                    100: "#f9d9d9",
                    200: "#f4b0b0",
                    300: "#ef8888",
                    400: "#ea5f5f",
                    500: "#f84a4a", // Base color
                    600: "#e63e3e",
                    700: "#d23535",
                    800: "#b72b2b",
                    900: "#9a2222",
                    DEFAULT: "#f84a4a", // Base color
                },
                logo: {
                    50: "#f7ebff",
                    100: "#edccff",
                    200: "#e29dff",
                    300: "#d77dff",
                    400: "#cc5eff",
                    500: "#cc66ff", // Base color
                    600: "#c759ff",
                    700: "#bd4bff",
                    800: "#b44eff",
                    900: "#aa41ff",
                    DEFAULT: "#cc66ff", // Base color
                },
            },
        },
    },
    plugins: [
        plugin(function ({ addUtilities }) {
            addUtilities({
                ".no-scrollbar::-webkit-scrollbar": {
                    display: "none",
                },
                ".no-scrollbar": {
                    "-ms-overflow-style": "none",
                    "scrollbar-width": "none",
                },
            });
        }),
        require("@tailwindcss/forms"),
    ],
} satisfies Config;
