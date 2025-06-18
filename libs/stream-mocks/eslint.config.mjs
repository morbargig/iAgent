import baseConfig from "../../eslint.base.config.mjs";
import baseConfig from "../../eslint.config.mjs";

export default [
    ...baseConfig,
    ...baseConfig,
    {
        "files": [
            "**/*.json"
        ],
        "rules": {
            "@nx/dependency-checks": [
                "error",
                {
                    "ignoredFiles": [
                        "{projectRoot}/eslint.config.{js,cjs,mjs}"
                    ]
                }
            ]
        },
        "languageOptions": {
            "parser": (await import('jsonc-eslint-parser'))
        }
    }
];
