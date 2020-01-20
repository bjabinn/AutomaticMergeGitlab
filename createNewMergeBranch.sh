#!/bin/bash
totalPath=$1
delimiter="/tree/"
totalPath="${totalPath/$delimiter/ }" 

ramaSprint="feature/R12-SP15_sprint15"
repositorio="$(cut -d' ' -f1 <<<$totalPath)"
ramaMerge="$(cut -d' ' -f2 <<<$totalPath)"

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
echo "-----------git branch -D $1"
git branch -D $ramaMerge

echo "---------------------Changing to Merge branch $ramaMerge"
echo "git checkout $ramaMerge"
git checkout $ramaMerge

echo "--------git merge from developer_everis favoring $ramaMerge version"
git merge -s recursive -X ours developer_everis -m "merge from developer everis"

echo "--------git status"
git status

read -p "Are you sure you want to push merge branch? (y/n): " -n 1 -r < /dev/tty
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Executing push....."
  git push
else
  echo "Aborted push....."
fi