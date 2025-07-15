import baseConfig from "../../eslint.base.config.mjs";
import mainConfig from "../../eslint.config.mjs";

export default [
    ...baseConfig,
    ...mainConfig,
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
