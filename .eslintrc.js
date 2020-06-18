module.exports = {
    "env": {
        "browser": true,
        "node": true
    },
    "extends": [
        'eslint:recommended',
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "prettier",
        "prettier/@typescript-eslint"
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "project": "tsconfig.json",
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint",
        "jsdoc",
        "prefer-arrow"
    ],
    "rules": {
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/ban-ts-comment": "off",
        "@typescript-eslint/ban-types" : "warn",
        "@typescript-eslint/no-unsafe-call": "warn",
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/no-unsafe-assignment": "warn",
        "@typescript-eslint/no-unsafe-return": "warn",
        "@typescript-eslint/no-floating-promises": "warn",
        "@typescript-eslint/restrict-plus-operands": "warn",
        "@typescript-eslint/no-var-requires": "warn",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/restrict-template-expressions": "warn",
        "prefer-const": "warn",
        "no-var": "error",
        "@typescript-eslint/no-this-alias": "off"
    }
};
