require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { getChatResponse } = require('./summary');

const API_KEY = process.env.OPEN_AI_API_KEY;
const API_URL = 'https://api.openai.com/v1/audio/transcriptions';

const VIDEO_SUMMARY = 'Create project. We understand the time and effort it takes to create variants with the base template manually. Let\'s walk through the process. Start by navigating to the Templates section and select the templates we just created. Select the sizes you\'d need for the variants and click on Confirm Selected Sizes. Give the project a name and confirm. Excellent, our project is ready for editing. Want to add more sizes to the project? Click on All Sizes on the top panel, select Add Remove Sizes, and click on Add a New Size. You can choose to add a custom size, select from the list of available sizes, or simply select all. After your selection is made, click on Done and then Confirm Selected Sizes. We now have our base template ready in all the required sizes for our project.';

const getSummaryForVideoTranscript = async (videoTranscript) => {
	const data = {
		threadPrompt: 'Summarise the following audio text from a video and tell what is the video about: ',
		thread: videoTranscript || VIDEO_SUMMARY,
	};
	const summary = await getChatResponse(data);
	return summary;
};

const sendResponseToSlack = async ({responseUrl, threadId, text, responseType = 'in_channel', replaceOriginal = false}) => {
	return new Promise((resolve, reject) => {
		const data = {
			text,
			response_type: responseType,
			replace_original: replaceOriginal,
		};
	
		if (threadId) {
			data.thread_ts = threadId;
		}
	
		try {
			axios.post(responseUrl, {
				...data,
			})
				.then((response) => response.data)
				.then((data) => console.log('DATA--->', data))
				.then(() => {
					resolve({ 
						message: 'suck cess',
					});
				})
				.catch((error) => {
					console.log('error', error.message)
					resolve({ 
						message: 'suck cess',
					});
				});
		} catch (err) {
			console.log('SENDING RESPONSE TO SLACK FAILED: ', err);
			reject(err);
		}
	});
};

const summarizeAsset = async (req, res) => {
	console.log('Body Shop: ', req.body);
	const {
		channel_id,
		trigger_id,
		response_url,
		text: videoUrl = 'https://rocketium.com/images/v2/5ee1a13c9855283dbe2269f2/resized/b7fdcdb4-0f29-4449-8782-cfdd6c0c8bd3_1681637082883.mp4'
	} = req.body;
	const filename = path.basename(videoUrl);
	const filePath = path.join(__dirname, filename);
	const writeStream = fs.createWriteStream(filePath);

	res.json({
		text: 'Hold tight. I am analyzing the video and will get back to you shortly.',
	});
	axios({
		url: videoUrl,
		method: 'GET',
		responseType: 'stream',
	}).then(response => {
		response.data.pipe(writeStream);
		writeStream.on('close', () => {
		const data = new FormData();
		data.append('file', fs.createReadStream(filePath));
		data.append('model', 'whisper-1');
		axios({
			method: 'POST',
			url: API_URL,
			headers: {
				'Authorization': `Bearer ${API_KEY}`,
				...data.getHeaders(),
			},
			data: data,
		}).then(async response => {
			const videoTranscript = response.data.text;
			fs.unlinkSync(filePath);
			const videoSummary = await getSummaryForVideoTranscript(videoTranscript);
			console.log('Final Summary: ', videoSummary);
			const finalSummary = `${videoUrl} \n Here is the summary of the video: \n ${videoSummary}`;
			const { message } = await sendResponseToSlack({
				responseUrl: response_url,
				text: finalSummary,
			});
			if (message === 'suck cess') {
				console.log('SUCCESS');
				res.json({ 
					trigger_id: trigger_id,
				});
			}
		}).catch(error => {
			console.error('ERROR while summarizing asset from AI', error);
			fs.unlinkSync(filePath);
			return null;
		});
		});
	}).catch(error => {
		console.error('ERROR while downloading video', error);
		return null;
	});
};

module.exports = {
	summarizeAsset
};
