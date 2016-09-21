const app = require('express')();
const http = require('http');

function getRandomCatUrl(done) {
  return http.get('http://thecatapi.com/api/images/get?format=src', function(response) {
        console.log(response.headers.location);
        done(response.headers.location);
    });
}

function pipeCatImage(req, res, url) {
  var connector = http.get(url, (resp) => {
    resp.pipe(res);
  });

  req.pipe(connector);
}

app.get('/', function (req, res) {
  getRandomCatUrl((catImage) => {
    pipeCatImage(req, res, catImage);
  });
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
