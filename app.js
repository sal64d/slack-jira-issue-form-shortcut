const { App } = require("@slack/bolt");
const https = require("node:https");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  appToken: process.env.SLACK_APP_TOKEN,
  port: process.env.PORT || 3000,
});

app.view("create_view", async ({ ack, body, view, client, logger }) => {
  try {
    await ack();

    const user = body["user"]["id"];

    const title = view["state"]["values"]["block_1"]["title_input"].value;
    const summ = view["state"]["values"]["block_2"]["summ_input"].value;

    console.log(title, summ);

    createJiraTicket(title, summ);

    await client.chat.postMessage({
      channel: user,
      text: "Ticket Created",
    });
  } catch (e) {
    logger.error(e);
  }
});

app.shortcut("create", async ({ shortcut, ack, client, logger }) => {
  console.log("open");
  try {
    await ack();

    const result = await client.views.open({
      trigger_id: shortcut.trigger_id,
      view: {
        callback_id: "create_view",
        title: {
          type: "plain_text",
          text: "Create Issue",
        },
        submit: {
          type: "plain_text",
          text: "Create",
        },
        blocks: [
          {
            type: "input",
            block_id: "block_1",
            element: {
              type: "plain_text_input",
              action_id: "title_input",
              placeholder: {
                type: "plain_text",
                text: "Your Response",
              },
            },
            label: {
              type: "plain_text",
              text: "Title",
            },
          },
          {
            type: "input",
            block_id: "block_2",
            element: {
              type: "plain_text_input",
              action_id: "summ_input",
              multiline: true,
              placeholder: {
                type: "plain_text",
                text: "Your Response",
              },
            },
            label: {
              type: "plain_text",
              text: "Summary",
            },
          },
        ],
        type: "modal",
      },
    });

    logger.info(result);
  } catch (e) {
    logger.error(e);
  }
});

function createJiraTicket(title, summ) {
  const postData = JSON.stringify({
    fields: {
      description: {
        content: [
          {
            content: [
              {
                text: summ,
                type: "text",
              },
            ],
            type: "paragraph",
          },
        ],
        type: "doc",
        version: 1,
      },
      issuetype: {
        id: "10001",
      },
      labels: ["bugfix", "blitz_test"],
      project: {
        id: "10000",
      },
      summary: title,
    },
    update: {},
  });

  let auth = process.env.JIRA_EMAIL + ":" + process.env.JIRA_TOKEN;
  auth = Buffer.from(auth).toString("base64");

  const options = {
    hostname: process.env.JIRA_HOST,
    port: 443,
    path: "/rest/api/3/issue",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(postData),
      "Authorization": "Basic " + auth,
    },
  };

  const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    res.setEncoding("utf8");
    res.on("data", (chunk) => {
      console.log(`BODY: ${chunk}`);
    });
    res.on("end", () => {
      console.log("No more data in response.");
    });
  });

  req.on("error", (e) => {
    console.error(`problem with request: ${e.message}`);
  });

  // Write data to request body
  req.write(postData);
  req.end();
}

(async () => {
  await app.start();
  console.log("Listening...");
})();
