// @ts-nocheck
const http = require("http");
const https = require("https");
const { createProxyMiddleware } = require("http-proxy-middleware");

// Using keepAlive drastically improves the response times for this proxy,
// especially when being hammered with many requests at once such as the initial
// load of the viewer.
// https://github.com/nodejitsu/node-http-proxy/issues/1058
const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

const gwvUrl = process.env.REACT_APP_GWV_URL;

module.exports = function (app) {
    app.use(
        "/viewer",
        createProxyMiddleware({
            target: gwvUrl,
            agent: gwvUrl.startsWith("https") ? httpsAgent : httpAgent,
            changeOrigin: true,
            pathRewrite: {
                // Strip /viewer from path so it isn't forwarded to the target
                // /viewer/index.html => /index.html => https://apps.geocortex.com/webviewer/index.html
                "^/viewer": "/",
            },
        })
    );
};
