require('dotenv').config();
const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const { summarizeThread } = require('./slack');
const { summarizeAsset } = require('./asset.js');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({limit : "160mb", parameterLimit: 10000}));

app.get('/', (req, res) => {
	res.send('Hello World!');
});

app.post('/summarize-thread', summarizeThread);

app.post('/summarize', summarizeAsset);

app.post('/slack/event', (req, res) => {
	console.log('event received', req.body);
	res.json({ challenge: req.body.challenge });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});
