# slack-random-cat
Display a random cat image in your slack channel!

This acts as a very small NodeJS application designed to be used as an integration to Slack.
Set up a custon integration in slack to point to a hosted solution of slack-random-cat to get a random cat image posted to your channel.

You can define different deployment variables by copying `user.config.example.json` to `user.config.json` and adjusting the values.  
You can also rely on envrionment variables if the `user.config.json` file is not found.
