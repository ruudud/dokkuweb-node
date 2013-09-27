#!/usr/bin/env bash
# Script that echos arguments and then STDIN 
echo "${@}"
data=$(cat)
echo $data
exit 0
