#!/usr/bin/env bash
set -euo pipefail

export TMPDIR=/tmp
export TEMP=/tmp
export TMP=/tmp

npx prisma studio --browser none
