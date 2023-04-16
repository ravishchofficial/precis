const { WebClient } = require('@slack/web-api');
const { createEventAdapter } = require('@slack/events-api');
const axios = require('axios');
const { getChatResponse } = require('./summary');

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

const webClient = new WebClient(SLACK_BOT_TOKEN);

async function summarizeThread(req, res) {
	const body = JSON.parse(req.body.payload);
	const threadId = body.message.thread_ts || body.message.ts;
	// console.log(body.message?.files);
    const threadInfo = await webClient.conversations.replies({ channel: body.channel.id, ts: threadId });
	const msg = threadInfo.messages.map((message) => message.text).join('\n');

	const summary = await getChatResponse({thread: msg, threadPrompt: 'Summarise the following conversation:'});

	axios.post(body.response_url, {
		text: summary,
		response_type: "in_channel",
		replace_original: false,
		thread_ts: threadId,
	})
		.then((response) => response.data)
		.then((data) => console.log('DATA--->', data))
		.then(() => {
			res.json({ 
				trigger_id: body.trigger_id,
			});
		})
		.catch((error) => {
			console.log('error', error.message)
			res.json({ 
				trigger_id: body.trigger_id,
			});
		});
}

module.exports = {
	summarizeThread
};