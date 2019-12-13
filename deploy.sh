#!/bin/sh

yarn clean && yarn release

cd public && now -n gitnotes
cd ..
