#!/usr/bin/env sh

if [ -z "$1" ]
then
  echo "No argument for version found. Usage: ./scripts/release.sh [patch | minor | major | vX.X.X]"

  exit 1
fi

npm version $1

version=$(npm pkg get version | tr -d '""')
echo "Releasing version v$version"

git push origin main
git push origin v$version
