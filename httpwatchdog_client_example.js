// This is an example of how to use it in your selenium scripts
//
// remember to add
// chromeOptions.add_argument("--disable-web-security")
// to your chrome options for this to work
//
//

/**
 * Sends http get requests to httpwatchdog server
 * @param {function} the fetch function to use for requests
 * @param {numeric} the port number of the httpwatchdog server
 * @param {numeric} number the pid of the process to be killed from the httpwatchdog server
 * @param {object} optional the interval of the heartbit requests
 * @param {numeric} optional the interval of the heartbit requests
 * @private
 */
class HttpwatchdogClient {
    constructor(fetchFunction, httpwatchdogPort, pid, beatExtras = {}, heartbeatInterval = 10000) {
        this.fetchFuntion = fetchFunction;
        this.watchdogUrl = 'http://127.0.0.1:' + httpwatchdogPort;
        this.pid = pid;
        this.beatExtras = beatExtras;
        this.heartbeatInterval = heartbeatInterval;
        setInterval(this.beat.bind(this), this.heartbeatInterval);
        console.log("HeartBeat started", this.watchdogUrl, this.pid = pid, this.heartbeatInterval);
    }

    async beat() {
        const getParameters = {
            ts: new Date().toISOString(),
            pid: this.pid            
        }
        Object.keys(this.beatExtras).forEach(key => {
            getParameters[key] = this.beatExtras[key];
          });
        this.fetchFuntion(this.watchdogUrl + '?' + new URLSearchParams(getParameters)).then(function(response) {
            if (!response.ok) {
                throw Error(response.statusText);
            }
            return response;
        }).then(function(response) {
            console.log("Heartbeat ok");
        }).catch(function(error) {
            console.log("Heartbeat error", error);
        });
    }
}
//debugger;
const hb =  new HttpwatchdogClient(window.fetch.bind(window), 9999, 99999999, {e1:"a", e2:0}, 20000);