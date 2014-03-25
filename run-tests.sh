#!/bin/bash
ls test/test-*.js | xargs -L 1 ./node_modules/.bin/mocha -R spec
