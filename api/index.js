// index.js
const express = require('express');
const app = express();
const request = require('request');

app.use(express.json());

const config = {
  clientId: process.env.GITHUB_APP_KEY,
  clientSecret: process.env.GITHUB_APP_SECRET,
  redirectUri: process.env.GITHUB_REDIRECT_URI,
  allowedOrigins: ['https://gitnotes.tiensonqin.now.sh'],
};

const githubLoginHandler = function (req, res) {
  // Retrieve the request, more details about the event variable later
  const headers = req.headers;

  const oauthUrl = `https://github.com/login/oauth/authorize?response_type=code&client_id=${config.clientId}&redirect_uri=${config.redirectUri}&scope=user%3Aemail%2Crepo`;

  res.redirect(301, oauthUrl);
};

const githubOauthHandler = function (req, res) {
  // Retrieve the request, more details about the event variable later
  const headers = req.headers;
  const body = req.body;
  const origin = headers.origin || headers.Origin;
  console.log(origin);

  // Check for malicious request
  if (!config.allowedOrigins.includes(origin)) {
    throw new Error(`${headers.origin} is not an allowed origin.`);
  }

  const url = 'https://github.com/login/oauth/access_token';
  const options = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      code: body.code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
    }),
  };

  // Request to GitHub with the given code
  request(url, options, function(err, response) {
    if (err) {
      res.send({ success: false, error: err });
      return;
    }

    const body = JSON.parse(response.body);

    if (body.error) {
      res.send({ success: false, error: body });
      return;
    }

    res.send({
      success: true,
      // Access token should be stored in response.body
      body: body,
    });
  });
};

app.get('/login/github', githubLoginHandler);
app.get('/api/oauth/github', githubOauthHandler);

app.listen(3001, () => console.log("Github Oauth app listening on port 3001!"));
