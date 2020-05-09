#!/bin/bash
FILES=test/*.spec.ts
for f in $FILES
do
  echo "Processing $f file..."
  mocha -r ts-node/register $f
done