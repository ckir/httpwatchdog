# httpwatchdog
 Yet another process movitor

There are very many and very great solutions for process monitoring out there. So what is the purpose of this one?

In most cases the watchdog somehow calls the monitored process and if it doesn't get the appropriate responce restarts it.

HTTPWatchdog does the opposite. The monitored program has to send http.get requests to HTTPWatchdog. Once the process started if HTTPWatchdog does not recieve any further data from the monitored programs it kill it. Not even restarting it. Thats a job for your regular process manager. I'm using it to discover unresponcive javascript in my selenium tests.

Running it its quite simple. node HTTPWatchdog.js --port=9999 --timeout=300000 Parameters are the port to listen and the time to wait before it kills the process.

An example of an http request is:
curl "http://localhost:8000/?ts=2022-08-18T14%3A56%3A45.244Z&pid=38652"

All included in a single file for convenience. No dependencies.

Enjoy