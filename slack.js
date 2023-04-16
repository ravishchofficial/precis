const { WebClient } = require('@slack/web-api');
const { createEventAdapter } = require('@slack/events-api');
const axios = require('axios');
const { getChatResponse } = require('./summary');

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

const webClient = new WebClient(SLACK_BOT_TOKEN);

async function summarizeThread(req, res) {
	const body = JSON.parse(req.body.payload);
	const threadId = body.message.thread_ts || body.message.ts;
	console.log('threadId', threadId, body);
	// console.log(body.message?.files);
	const threadInfo = await webClient.conversations.replies({
		channel: body.channel.id,
		ts: threadId,
	});

	axios.post(body.response_url, {
		text: 'Please wait, while we work on this. Summarizing...',
		response_type: 'in_channel',
		replace_original: false,
		thread_ts: threadId,
	});

	const filteredMsg = threadInfo.messages.filter(
		(message) => message.subtype !== 'bot_message'
	);

	const msg = filteredMsg
		.map((message) => {
			return message.text;
		})
		.join('\n');

	console.log('Message', msg);
	const summary = await getChatResponse({
		thread: msg,
		threadPrompt:
			'Summarise the following conversation and list down all the important keywords with their one liner meanings',
	});

	axios
		.post(body.response_url, {
			text: summary,
			response_type: 'in_channel',
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
			console.log('error', error.message);
			res.json({
				trigger_id: body.trigger_id,
			});
		});
}

async function askQuestion(req, res) {
	const body = req.body;

	const words = body.text.split('?');

	// code for last 16 char of the string
	const last16 = words[1].slice(-16);
	const decId = last16.slice(0, 10) + '.' + last16.slice(10);

	console.log('decId', decId, words);
	// console.log('body', body);
	const threadInfo = await webClient.conversations.replies({
		channel: body.channel_id,
		ts: decId,
	});
	res.json({
		text: 'Please wait, while we find the answer to your question... :sunglasses:',
	});

	const filteredMsg = threadInfo.messages.filter(
		(message) => message.subtype !== 'bot_message'
	);

	const msg = filteredMsg
		.map((message) => {
			return message.text;
		})
		.join('\n');
	const summary = await getChatResponse({
		thread: msg,
		threadPrompt: words[0] + '?',
	});

	axios
		.post(body.response_url, {
			text: 'Q: ' + body.text + '\n' + summary,
			response_type: 'in_channel',
			replace_original: false,
			thread_ts: decId,
		})
		.then((response) => response.data)
		.then((data) => console.log(data))
		.then(() => {})
		.catch((error) => {
			console.log('error', error.message);
		});
}

module.exports = {
	summarizeThread,
	askQuestion,
};
