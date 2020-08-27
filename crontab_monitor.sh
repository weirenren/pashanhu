#!bin/bash    # 告诉系统用bash 执行
# count=0 #变量与=之间不能有空格
# for line in `cat ./execption.txt` # 逐行读取文件
# do          # 循环 与done 一起
#   echo $line  #输出 $加变量表示变量的值
# #   count=`expr $count + 1` # 加号与前后两个变量必须有空格 ，count自增
# done
# for line in `cat ./execption.txt`
# do
#     echo $line
# done

# curent_time=`date '+%Y-%m-%d %H:%M:%S'`
# # echo $curent_time

IFS_old=$IFS
IFS=$'\n'

execption_time=''
for line in  `cat  ./execption.txt`;do
execption_time=$line
done;
IFS=$IFS_old

echo $execption_time
curent_time=`date '+%Y-%m-%d %H:%M:%S'`
echo $curent_time

current=$(date -j -f "%Y-%m-%d %H:%M:%S" "$curent_time" +%s)
old=$(date -j -f "%Y-%m-%d %H:%M:%S" "$execption_time" +%s)
 
time_dif=$(( (current-old)/(60 * 60) ))

if [ $time_dif -gt 1.9 ]
then
    echo $time_dif
fi

# var1="2018-09-01 23:30:30"
# var2="2018-09-01 24:34:30"

# # Convert to epoch time and calculate difference.
# difference=$(( $(date -j -f "%Y-%m-%d %H:%M:%S" "$var1" "+%s") - $(date -d -j -f '+%Y-%m-%d %H:%M:%S' "$var2" "+%s") ))

# # Divide the difference by 3600 to calculate hours.
# echo "scale=2 ; $difference/3600" | bc
# echo `date -d "2015-06-11 12:39" +%s`

# end=$(date -j -f "%b %d %Y %H:%M:%S" "Dec 25 2017 08:00:00" +%s)
# now=$(date +%s)
printf '%d seconds left till target date\n' "$(( (current-old)/(60 * 60) ))"
# printf '%d days left till target date\n' "$(( (end-now)/86400 ))"