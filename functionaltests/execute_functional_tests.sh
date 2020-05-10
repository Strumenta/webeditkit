./gradlew runMpsServerLauncher > server_log_out.txt 2>server_log_err.txt &
MPS_SERVER_PID=$!
sh run_functional_tests.sh
RESULT=$?
kill $MPS_SERVER_PID
exit $RESULT