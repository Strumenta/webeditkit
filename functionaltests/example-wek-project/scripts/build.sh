#!/usr/bin/env bash
npm i
TSDIR=src
BUILDDIR=public/js/build
BROWSERIFY_OPTS="--debug -t browserify-css"
mkdir -p $BUILDDIR
npx browserify $TSDIR/index.ts $BROWSERIFY_OPTS -p [ tsify ] > $BUILDDIR/index.js
