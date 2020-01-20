#!/bin/bash
echo " -------------------------------------------------------- "
echo " ---------- replaceVersion PROCESS (BEGIN) -------------- "
echo " -------------------------------------------------------- "

project_name=$1
initial_version=$2
final_version=$3

workPath='./FrontEnd'
gitRepository="$workPath/$project_name"

varNameFilesList=$project_name'_ocurrences_'$initial_version'.log'
varNameFilesList2=$project_name'_ocurrences_'$final_version'.log'

echo -n "--------- saving ocurrences of string $initial_version found in $project_name repository" 
grep -rnw $gitRepository -e $initial_version > $workPath/$varNameFilesList
echo " -> (DONE: $varNameFilesList)"

cat $workPath/$varNameFilesList | while read totalPath
do
	file="$(cut -d':' -f1 <<<$totalPath)"
	
	if [[ $file =~ ".git" ]] 
	then
		echo "--------- ignored git file $file"
	else
		echo -n "--------- replacing $initial_version to $final_version in file $file"

		sed -i "s/$initial_version/$final_version/g" $file
		echo " -> (DONE)"
	fi
done < $workPath/$varNameFilesList

echo -n "--------- saving ocurrences of string $final_version found in $project_name repository after version replacement" 
grep -rnw $gitRepository -e $final_version > $workPath/$varNameFilesList2
echo " -> (DONE: $varNameFilesList2)"
echo " -------------------------------------------------------- "
echo " ---------- replaceVersion PROCESS (END) -------------- " 
echo " -------------------------------------------------------- "

 