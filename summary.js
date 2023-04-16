
// const OPENAI_CHAT_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const OPENAI_CHAT_ENDPOINT = 'https://merlin-hackathon-yak3s7dv3a-ue.a.run.app/api/v1/normal';
const axios = require('axios');

/**
 * @param {string} threadPrompt
 * @param {string} thread
 * @param {number} wordLimit
 * @returns {Promise<string>}
 */
	const getChatResponse = async ({threadPrompt, thread, wordLimit}) => {

	const data = {
		"config": {
			"messages": [{
				"role": "user",
				"content": `${threadPrompt} ${thread} ${wordLimit ? `in around ${wordLimit} words` : ''}}`,
			}],
		},
		"providerType": "CHATGPT",
		"mode": "CHAT",
		"params": {
			"model": "gpt-4"
		},
		"query": `${threadPrompt} ${wordLimit ? `in around ${wordLimit} words` : ''}`,
			
	}
	try {
		const response = await axios.post(OPENAI_CHAT_ENDPOINT, data);
		console.error('response-->', response.data);

		return response.data.data.content;
	} catch (error) {
		console.error('ERRROR-->', error);
	}
}

module.exports = { getChatResponse };

// }

// getChatResponse({threadPrompt}).then((r) => {
// 	console.log(r);
// });

