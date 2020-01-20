#!/bin/bash

totalPath=$1
delimiter="/tree/"
totalPath="${totalPath/$delimiter/ }" 

ramaSprint="feature/R12-SP15_sprint15"
repositorio="$(cut -d' ' -f1 <<<$totalPath)"
ramaIssue="$(cut -d' ' -f2 <<<$totalPath)"

echo "---------------- $repositorio $ramaIssue"
echo "---------------- Move to repository $repositorio "
cd ./FrontEnd/$repositorio

echo "---------------------Changing to Sprint branch $ramaSprint"
echo "git checkout $ramaSprint"
git checkout $ramaSprint

echo "-------------------- Reset current branch"
echo "--------git reset --hard"
git reset --hard

echo "-------git pull"
git pull


echo "---------------------Getting last version branch to be merged: $1"
echo "-----------git branch -D $ramaIssue"
git branch -D $ramaIssue

echo "----------git checkout --track origin/$ramaIssue"
git checkout --track origin/$ramaIssue

echo "---------git pull"
git pull

echo "--------git from Sprint branch: $ramaSprint"
git merge $ramaSprint --summary -m "merge to main sprint branch"

echo "--------git status"
git status

read -p "Are you sure you want to push? (y/n): " -n 1 -r < /dev/tty
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Executing push....."
  git push
else
  echo "Aborted push....."
fi

cd ../..
