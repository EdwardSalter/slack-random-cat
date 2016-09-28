const app = require('express')();
const http = require('http');
const url = require('url');
const querystring = require('querystring');
const appendQuery = require('append-query');
const config = require('./configuration');
const xml = require('xml2js');

let catApiUrl = config.get("catApiUrl") || 'http://thecatapi.com/api/';
const catApiKey = config.get("catApiKey");
console.log(`The cat api base url is ${catApiUrl}`);


function getApiUrl(path, queryParams) {
    let fullPath = url.resolve(catApiUrl, path);
    if (catApiKey) {
        fullPath = appendQuery(fullPath, { api_key: catApiKey });
    }
    if (queryParams) {
        fullPath = appendQuery(fullPath, queryParams);
    }
    return fullPath;
}

function getRandomCatUrl(err, done) {
    let imageUrl = getApiUrl('images/get');
    console.log(`Making request to ${imageUrl}`);

    let req = http.get(imageUrl, function(response) {
        done(response.headers.location);
    });

    req.on('error', (e) => {
      err(e);
    });

    return req;
}

function getCatCategories(err, done) {
    let categoryUrl = getApiUrl('categories/list');
    console.log(`Making request to ${categoryUrl}`);

    let options = url.parse(categoryUrl);
    options.headers = {
        accept: 'applicaiton/json'
    };
    let req = http.get(options, function(response) {
        var body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {
            xml.parseString(body, (err, parsedXml) => {
                done(parsedXml.response.data[0].categories[0].category.map((category) => {
                    return category.name[0];
                }));
            });
        });
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
    let body = req.query;

    var command = body.text ? body.text.split(" ")[0].toLowerCase() : null;

    switch (command) {
        case 'categories':
            getCatCategories((e) => {
              console.log(`Error occured getting category list from cat api: ${e.message}`);
              res.status(500).send('Error');
          }, (categories) => {
              let json = {
                "response_type": "ephemeral",
                "text": `The categories you can choose are: ${categories.join(', ')}`
              };
              res.json(json);
          })
            break;

        default:
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
            break;
    }
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
