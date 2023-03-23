const { App } =  require("@slack/bolt");

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    appToken: process.env.SLACK_APP_TOKEN,
    port: process.env.PORT || 3000,
});

app.shortcut('open_modal', async ({ shortcut, ack, client, logger }) => {
    try {

        await ack();

        const result = await client.views.open({
            trigger_id: shortcut.trigger_id,
            view: {
                type: "modal",
                title: {
                    type: "plain_text",
                    text: "My App"
                },
                close: {
                    type: "plain_text",
                    text: "Close"
                },
                blocks: [
                    {
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: "About the simplest modal you could conceive of :smile:"
                        }
                    },
                    {
                        type: "context",
                        elements: [
                            {
                                type: "mrkdwn",
                                text: "Psssst this modal was designed using"
                            }
                        ]
                    }
                ]
            }
        });

        logger.info(result);

    } catch(e){
        logger.error(error);
    }
});

(async () => {
    await app.start();
    console.log('Listening...');
})();
