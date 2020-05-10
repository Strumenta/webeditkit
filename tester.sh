#!/bin/bash
FILES=test/*.spec.ts
RESULT=0
for f in $FILES
do
  echo "Processing $f file..."
  node ./node_modules/mocha/bin/mocha -r ts-node/register $f
  PARTIAL_RESULT=$?
  if [ $PARTIAL_RESULT -gt 0 ]; then
  	RESULT=$PARTIAL_RESULT   
  fi
done
exit $RESULT