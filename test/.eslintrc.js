module.exports = {
    "env": {
        "browser": true,
        "node": true
    },
    "extends": [ '../.eslintrc.js' ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "project": "tsconfig.test.json",
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint",
        "jsdoc",
        "prefer-arrow"
    ]
};