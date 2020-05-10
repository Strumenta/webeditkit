./gradlew runMpsServerLauncher & #> server_log_out.txt 2>server_log_err.txt &
MPS_SERVER_PID=$!
sleep 4m # we need time to install the stuff
sh run_functional_tests.sh
RESULT=$?
kill -9 $MPS_SERVER_PID
echo "LOG"
cat server_log_out.txt
echo "LOG ERR"
cat server_log_err.txt
exit $RESULT