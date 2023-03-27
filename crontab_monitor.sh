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
# * */2 * * * sh /Users/chao.wei/dev/GitHome/work/Vue-Pro/pashanhu/crontab_monitor.sh >> /Users/chao.wei/dev/GitHome/work/Vue-Pro/pashanhu/logs/cron_log.txt
rootPath="/Users/chao.wei/dev/GitHome/work/Vue-Pro/pashanhu/"
IFS_old=$IFS
IFS=$'\n'

myExecptionFile=$rootPath"execption.txt"

if [ -f "$myExecptionFile" ]; then

    execption_time=''
    for line in $(cat $myExecptionFile); do
        execption_time=$line
    done
    IFS=$IFS_old

    curent_time=$(date '+%Y-%m-%d %H:%M:%S')

    current=$(date -j -f "%Y-%m-%d %H:%M:%S" "$curent_time" +%s)
    old=$(date -j -f "%Y-%m-%d %H:%M:%S" "$execption_time" +%s)

    # time_dif=$(((current - old) / (60 * 60)))
    time_dif=`echo "scale=2; ($current - $old) / (60 * 60)" | bc`
    time=$(date "+%Y-%m-%d %H:%M:%S")
    logfile=$rootPath"logs/"$time"_output.txt"

    if [ $(echo "$time_dif >= 1.6"|bc) = 1 ]; then
        echo $time_dif" >1.6_"$time
        # sleep 2
        # rm -f $myExecptionFile
        echo $(date -v+20H +"%Y-%m-%d %H:%M:%S") > $myExecptionFile
        # /usr/local/bin/node /Users/chao.wei/.npm-global/bin/pm2 start /Users/chao.wei/dev/GitHome/work/Vue-Pro/pashanhu/mongo-spider.js  -l $logfile
        # node mongo-spider.js >>$logfile
        # /usr/bin/nohup /usr/local/bin/node /Users/chao.wei/dev/GitHome/work/Vue-Pro/pashanhu/mongo-spider-new.js>>$logfile &

        # latest spider
        # /usr/local/bin/node /Users/chao.wei/dev/GitHome/work/Vue-Pro/pashanhu/mongo-spider-new.js &> $logfile

        /usr/local/bin/node /Users/chao.wei/dev/GitHome/work/Vue-Pro/pashanhu/xiaomuchong-spider.js &> $logfile


    else
        echo $time_dif" <1.6h_"$time
    fi

else
    time=$(date "+%Y-%m-%d %H:%M:%S")
    echo "no $myExecptionFile file_"$time

fi

exit

# var1="2018-09-01 23:30:30"
# var2="2018-09-01 24:34:30"

# # Convert to epoch time and calculate difference.
# difference=$(( $(date -j -f "%Y-%m-%d %H:%M:%S" "$var1" "+%s") - $(date -d -j -f '+%Y-%m-%d %H:%M:%S' "$var2" "+%s") ))

# # Divide the difference by 3600 to calculate hours.
# echo "scale=2 ; $difference/3600" | bc
# echo `date -d "2015-06-11 12:39" +%s`

# end=$(date -j -f "%b %d %Y %H:%M:%S" "Dec 25 2017 08:00:00" +%s)
# now=$(date +%s)
# printf '%d seconds left till target date\n' "$(( (current-old)/(60 * 60) ))"
# printf '%d days left till target date\n' "$(( (end-now)/86400 ))"
