#cd example-wek-project
#sh scripts/build.sh
#cd ..

MPSSERVER_PORT=9000 MPSSERVER_AUTOSAVE="false" ./gradlew launchMpsServer &
MPS_SERVER_PID=$!
sleep 5m # we need time to install the stuff
sh run_functional_tests.sh
RESULT=$?
kill -9 $MPS_SERVER_PID
# echo "LOG"
# cat server_log_out.txt
# echo "LOG ERR"
# cat server_log_err.txt
exit $RESULT