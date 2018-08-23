import { searchImages } from "./catApiClient";
// import * as http from "http";
import express from "express";
import config from "./configuration";
import { urlencoded } from "body-parser";
import sendSlackResponse from "./SlackResponse";

const app = express();
app.use(urlencoded({ extended: true }));

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
