'use strict';
const http = require('node:http');
const url = require('node:url');
const util = require('node:util');
const childProcess = require('node:child_process');
const spawn = childProcess.spawn;
const exec = childProcess.exec;

let pids = {};
const host = '127.0.0.1';

// Checks for --port and if it has a value
const portIndex = process.argv.indexOf('--port');
let portValue;

if (portIndex > -1) {
  // Retrieve the value after --port
  portValue = process.argv[portIndex + 1];
}

const port = (portValue || 9999);

// Checks for --timeout and if it has a value
const timeoutIndex = process.argv.indexOf('--timeout');
let timeoutValue;

if (timeoutIndex > -1) {
  // Retrieve the value after --timeout
  timeoutValue = process.argv[timeoutIndex + 1];
}

const timeout = (timeoutValue || 5 * 60 * 1000);

function treekill(pid, signal, callback) {
    if (typeof signal === 'function' && callback === undefined) {
        callback = signal;
        signal = undefined;
    }

    pid = parseInt(pid);
    if (Number.isNaN(pid)) {
        if (callback) {
            return callback(new Error("pid must be a number"));
        } else {
            throw new Error("pid must be a number");
        }
    }

    let tree = {};
    let pidsToProcess = {};
    tree[pid] = [];
    pidsToProcess[pid] = 1;

    switch (process.platform) {
        case 'win32':
            exec('taskkill /pid ' + pid + ' /T /F', callback);
            break;
        case 'darwin':
            buildProcessTree(pid, tree, pidsToProcess, function(parentPid) {
                return spawn('pgrep', ['-P', parentPid]);
            }, function() {
                killAll(tree, signal, callback);
            });
            break;
            // case 'sunos':
            //     buildProcessTreeSunOS(pid, tree, pidsToProcess, function () {
            //         killAll(tree, signal, callback);
            //     });
            //     break;
        default: // Linux
            buildProcessTree(pid, tree, pidsToProcess, function(parentPid) {
                return spawn('ps', ['-o', 'pid', '--no-headers', '--ppid', parentPid]);
            }, function() {
                killAll(tree, signal, callback);
            });
            break;
    }
};

function killAll(tree, signal, callback) {
    let killed = {};
    try {
        Object.keys(tree).forEach(function(pid) {
            tree[pid].forEach(function(pidpid) {
                if (!killed[pidpid]) {
                    killPid(pidpid, signal);
                    killed[pidpid] = 1;
                }
            });
            if (!killed[pid]) {
                killPid(pid, signal);
                killed[pid] = 1;
            }
        });
    } catch (err) {
        if (callback) {
            return callback(err);
        } else {
            throw err;
        }
    }
    if (callback) {
        return callback();
    }
}

function killPid(pid, signal) {
    try {
        process.kill(parseInt(pid, 10), signal);
    } catch (err) {
        if (err.code !== 'ESRCH') throw err;
    }
}

function buildProcessTree(parentPid, tree, pidsToProcess, spawnChildProcessesList, cb) {
    let ps = spawnChildProcessesList(parentPid);
    let allData = '';
    ps.stdout.on('data', function(data) {
        data = data.toString('ascii');
        allData += data;
    });

    let onClose = function(code) {
        delete pidsToProcess[parentPid];

        if (code != 0) {
            // no more parent processes
            if (Object.keys(pidsToProcess).length == 0) {
                cb();
            }
            return;
        }

        allData.match(/\d+/g).forEach(function(pid) {
            pid = parseInt(pid, 10);
            tree[parentPid].push(pid);
            tree[pid] = [];
            pidsToProcess[pid] = 1;
            buildProcessTree(pid, tree, pidsToProcess, spawnChildProcessesList, cb);
        });
    };

    ps.on('close', onClose);
}

const server = http.createServer((req, res) => {
    const queryObject = url.parse(req.url, true).query;
    if (!"ts" in queryObject) {
        res.end();
    }
    if (!"pid" in queryObject) {
        res.end();
    }
    if (queryObject['pid'] in pids) {
        clearTimeout(pids[queryObject['pid']]);
    }
    pids[queryObject['pid']] = setTimeout((pid) => {
        let killed = true;
        treekill(pid, 'SIGKILL', function(err) {
            console.log(`Error killing process ${pid} at ${new Date().toISOString()}`);
            killed = false;
        });
        delete queryObject['pid'];
        if (killed) {console.log(`Process ${pid} killed at ${new Date().toISOString()}`);}
    }, timeout, queryObject['pid']);
    let timetokill = new Date(Date.now() + timeout).toISOString();
    console.log(`Process ${queryObject['pid']} will be killed at ${timetokill} unless new data arrive`);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({}));
});
server.on('clientError', (err, socket) => {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

server.listen(port, host, () => {
    console.log(`HTTPWatchdog is running on http://${host}:${port} timeout ${timeout} ms`);
});