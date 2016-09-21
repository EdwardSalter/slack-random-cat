const app = require('express')();
const http = require('http');

function getRandomCatUrl(err, done) {
  var req = http.get('http://thecatapi.com/api/images/get?format=src', function(response) {
        console.log(response.headers.location);
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
    console.log(`Error occured: ${e.message}`);
    res.send('Error');
  });
  req.pipe(connector);
}

app.get('/', function (req, res) {
  getRandomCatUrl((e) => {
    console.log(`Error occured: ${e.message}`);
    res.send('Error');
  },(catImage) => {
    pipeCatImage(req, res, catImage);
  });
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
