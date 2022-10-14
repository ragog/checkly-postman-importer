const axios = require('axios');
const converter = require('./converter');

async function consume(collectionJson) {
	const checklyApiKey = process.env.CHECKLY_API_KEY;
	const checklyAccountId = process.env.CHECKLY_ACCOUNT_ID;

	const collectionJsonObj = JSON.parse(collectionJson);
	const postmanFolders = collectionJsonObj.item;

	console.log('Importing collection ' + collectionJsonObj.info.name);

	// Axios base config
	const instance = axios.create({
		baseURL: 'https://api.checklyhq.com',
		headers: {
			Authorization: `Bearer ${checklyApiKey}`,
			'X-Checkly-Account': checklyAccountId,
			'Content-Type': 'application/json',
		},
	});

	// Postman Folders -> Checkly Groups
	for (let postmanFolder of postmanFolders) {
		console.log(`Adding group ${postmanFolder.name}`);

		const postmanTests = postmanFolder.item;

		const checklyGroup = converter.transformFolder(postmanFolder);

		const response = await instance({
			method: 'post',
			url: '/v1/check-groups',
			data: checklyGroup,
		});

		const groupId = response.data.id;

		// Postman Tests -> Checkly Checks
		for (let postmanTest of postmanTests) {
			console.log(`> Adding check ${postmanTest.name}`);

			const checklyCheck = converter.transformTest(postmanTest, groupId);

			await instance({
				method: 'post',
				url: '/v1/checks',
				data: checklyCheck,
			});
		}
	}
}

module.exports = {
	consume: consume,
};
