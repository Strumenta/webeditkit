export const MPSSERVER_PORT = 9000;

const request = require('request');

export function tryToConnect(done, attemptLeft=100) {

  function considerRetrying(attempts) {
    if (attempts > 0) {
      console.log(`sleeping. Attempts left ${attempts - 1}`);
      const delay = require('delay');
      setTimeout(() => {
        tryToConnect(done, attempts - 1);
      }, 10000);
    } else {
      console.log("no more attempt left, failing");
      throw new Error("MPS Server not ready");
    }
  }

  try {
    request(`http://localhost:${MPSSERVER_PORT}`, { json: true }, (err, res, body) => {
      if (err) {
        console.log("  error returned, cannot yet connect");
        considerRetrying(attemptLeft);
      } else {
        if (res.statusCode === 200) {
          console.log("connected to MPS Server. Can start testing");
          done();
        } else {
          console.log("status code", res.statusCode);
          considerRetrying(attemptLeft);
        }
      }
    });
  } catch (e) {
    console.log("FAILED to connect", e);
    considerRetrying(attemptLeft);
  }
}
