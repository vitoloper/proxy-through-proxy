var http = require('http');
var httpProxy = require('http-proxy');
var httpProxyAgent = require('http-proxy-agent');
var httpsProxyAgent = require('https-proxy-agent');

// Environment variables used to configure the application
// Examples:
// PTP_PORT = 8090
// PTP_PROXY_HOST = proxy.mycompany.com
// PTP_PROXY_PORT = 8080
// PTP_TARGET = https://www.target.com
// PTP_TARGET_PROTO = HTTPS
const serverPort = parseInt(process.env.PTP_PORT) || 8090
const proxyHost = process.env.PTP_PROXY_HOST || 'proxy.mycompany.com';
const proxyPort = parseInt(process.env.PTP_PROXY_PORT) || 8080;
const target = process.env.PTP_TARGET || 'http://www.target.com';
const targetProtocol = process.env.PTP_TARGET_PROTO || 'http';
const hostHeader = process.env.PTP_HOST_HEADER;

// Create a proxy server
var proxy = httpProxy.createProxyServer({});

// Log requests
proxy.on('proxyReq', function(proxyReq, req, res, options) {
    console.log(new Date().toISOString(), '-', `Received request from ${req.connection.remoteAddress}`);
});

// Create a proxy agent
var agent;

if (targetProtocol.toLowerCase() === 'https') {
    agent = new httpsProxyAgent({host: proxyHost, port: proxyPort});
    console.log('HTTPS proxy agent created');
} else {
    agent = new httpProxyAgent({host: proxyHost, port: proxyPort});
    console.log('HTTP proxy agent created')
}

// Create a custom server and use 'proxy.web' to proxy a web request to the target
var server = http.createServer(function(req, res) {
    // NOTE: we have to modify the HTTP request headers here, otherwise an error will occur
    // (the node-agent/http-proxy interaction causes an error if we modify the headers in
    // proxyReq.on)
    if (hostHeader)
        req.headers['host'] = hostHeader;
    proxy.web(req, res, {target: target, agent: agent});
});

console.log(`proxy host: ${proxyHost}`);
console.log(`proxy port: ${proxyPort}`);
console.log(`target: ${target}`);
console.log(`target protocol: ${targetProtocol}`);

// Start the custom server
console.log(`*** Listening on port ${serverPort} ***`);
server.listen(serverPort);
