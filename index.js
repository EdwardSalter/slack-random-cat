const app = require('express')();
const http = require('http');

const config = require('./configuration');

let catApiUrl = config.get("catApiUrl") || 'http://thecatapi.com/api/images/get?format=src';
const catApiKey = config.get("catApiKey");
if (catApiKey) {
  catApiUrl += `&api_key=${catApiKey}`; // TODO: NOT STRING CONCATENATION
}
console.log(`The cat api url is ${catApiUrl}`);

function getRandomCatUrl(err, done) {
  var req = http.get(catApiUrl, function(response) {
        done(response.headers.location);
    });

    req.on('error', (e) => {
      err(e);
    });

    return req;
}

function pipeCatImage(req, res, url) {
  var connector = http.get(url, (resp) => {
    resp.pipe(res);
  });
  connector.on('error', (e) => {
    console.log(`Error occured piping cat image: ${e.message}`);
    res.send('Error');
  });
  req.pipe(connector);
}

app.get('/', function(req, res) {
  getRandomCatUrl((e) => {
    console.log(`Error occured getting image url from cat api: ${e.message}`);
    res.status(500).send('Error');
  },(catImage) => {
    let json = {
      "response_type": "in_channel",
      "attachments": [
          {
              "fallback": "A random cat",
              "pretext": "Your random cat",
              "image_url": catImage
          }
      ]
    };
    res.json(json);
  });
})

app.get('/image', function (req, res) {
  getRandomCatUrl((e) => {
    console.log(`Error occured getting image url from cat api: ${e.message}`);
    res.status(500).send('Error');
  },(catImage) => {
    pipeCatImage(req, res, catImage);
  });
});


const port = config.get("port", null, true);
app.listen(port, function () {
  console.log('slack-random-cat listening on port ' + port);
});
