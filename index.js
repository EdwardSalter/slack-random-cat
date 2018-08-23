"use strict";

function _interopDefault(ex) {
  return ex && typeof ex === "object" && "default" in ex ? ex["default"] : ex;
}

var config = _interopDefault(require("node-user-config"));
var url = require("url");
var fetch = _interopDefault(require("node-fetch"));
var Promise = _interopDefault(require("bluebird"));
var express = _interopDefault(require("express"));
var bodyParser = require("body-parser");

const catApiKey = config.get("catApiKey");

const baseUrl = "https://api.thecatapi.com/v1/";

const defaultSearchParams = {
  size: "med",
  mime_types: "jpg,png,gif",
  format: "json",
  has_breeds: false,
  order: "RANDOM",
  page: 0,
  limit: 5
};

/**
 * Search for images
 * @param {Object} [params]                                     Search parameters
 * @param {('thumb'|'small'|'med'|'full')} [params.size="med"]  Size of the image to return
 * @param {string} [params.mime_types="jpg,png,gif"]            Comma separated list of mime types to search for
 * @param {('json'|'src')} [params.format="json"]               Whether to return the image as a url or JSON
 * @param {boolean} [params.has_breeds=false]                   Only return images that have breed information
 * @param {('RANDOM'|'ASC'|'DESC')} [params.order="RANDOM"]     The order in which to return results
 * @param {number} [params.page=0]                              The page number to return
 * @param {number} [params.limit=5]                             The number of results to return
 */
function searchImages(params) {
  const searchParams = new url.URLSearchParams(
    Object.assign({}, defaultSearchParams, params)
  );
  const url$$1 = new url.URL("images/search", baseUrl);
  url$$1.search = searchParams.toString();

  return fetch(url$$1.toString(), {
    headers: {
      "x-api-key": catApiKey
    }
  }).then(r => r.json());
}

Promise.config({
  cancellation: true
});

function postDelayedMessage(responseUrl, message) {
  return fetch(responseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(message)
  });
}

/**
 * Send a slack response with a timeout
 * @param {Promise} messagePromise Resolves to a message object to be sent to slack
 * @param {string} responseUrl     The URL to send a delayed response too if the main message request times out
 * @returns {Promise.Object}  A promise that resolves to a message to send immediately
 * @async
 * @res
 */
async function sendSlackResponse(messagePromise, responseUrl) {
  const timeout = Promise.delay(2500).then(() => {
    console.log("Message timeout has been exceeded");
    return {
      response_type: "ephemeral",
      text: "Your cat is still loading. It will be sent to the channel shortly."
    };
  });

  const sendMessage = message => {
    // If the timeout has expired, the message will have already been sent
    if (!timeout.isFulfilled()) {
      timeout.cancel();
      console.log(
        "Message promise returned within timeout period, sending the result message"
      );
      return message;
    }

    console.log(
      "The request has taken too long so must be sent via the response_url"
    );

    return postDelayedMessage(responseUrl, message);
  };
  //
  // // TODO: RETURN OBJECT WITH IMMEDIATERESPONSE, FUTURERESPONSE?
  messagePromise = messagePromise
    .catch(e => {
      console.error("Caught an error in the message promise", e);

      return {
        response_type: "ephemeral",
        text: "Something has gone wrong. Try again maybe?"
      };
    })
    .then(sendMessage);

  return Promise.race([timeout, messagePromise]);
}

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// function pipeCatImage(req, res, url) {
//   console.log(url);
//   const connector = http.get(url, resp => {
//     resp.pipe(res);
//   });
//   connector.on("error", e => {
//     console.log(`Error occurred piping cat image: ${e.message}`);
//     res.send("Error");
//   });
//   req.pipe(connector);
// }

async function getImage() {
  const images = await searchImages({ size: "small" });
  console.debug("Got images back");
  const message = formatImageMessage(images[0]);
  return message;
}

// Slack command
app.post("/", async function(req, res) {
  const message = await sendSlackResponse(getImage(), req.body.response_url);

  console.debug("Got a message to send", message);

  res.json(message);
});

function formatImageMessage(image) {
  return {
    response_type: "in_channel",
    attachments: [
      {
        fallback: "A random cat",
        pretext: "Your random cat",
        image_url: image.url
      }
    ]
  };
}

// app.post("/image/:id?", function(req, res) {
//   getRandomCat(
//     null,
//     req.params.id,
//     e => {
//       console.log(`Error occured getting image url from cat api: ${e.message}`);
//       res.status(500).send(e.message);
//     },
//     catImage => {
//       pipeCatImage(req, res, catImage.url);
//     }
//   );
// });

// app.post("/", function(req, res) {
//   getRandomCat(
//     null,
//     null,
//     e => {
//       console.log(`Error occured getting image url from cat api: ${e.message}`);
//       res.status(500).send(e.message);
//     },
//     catImage => {
//       const fullUrl =
//         req.protocol + "://" + req.get("host") + "/image/" + catImage.id;
//       let json = {
//         message: '<img src="' + fullUrl + '" />',
//         notify: true,
//         message_format: "html"
//       };
//
//       res.json(json);
//     }
//   );
// });

const port = config.get("port", null, false) || 3000;
app.listen(port, function() {
  console.log("slack-random-cat listening on port " + port);
});
