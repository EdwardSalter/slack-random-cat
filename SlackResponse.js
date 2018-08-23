import Promise from "bluebird";
import fetch from "node-fetch";

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
export default async function sendSlackResponse(messagePromise, responseUrl) {
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
