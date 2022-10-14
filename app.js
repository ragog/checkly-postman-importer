const axios = require('axios');
const yargs = require('yargs');
const fs = require('fs');
const { option } = require('yargs');
const transform = require('./transform');

(async () => {
	const checklyApiKey = process.env.CHECKLY_API_KEY;
	const checklyAccountId = process.env.CHECKLY_ACCOUNT_ID;

	// Command line arguments
	const options = yargs
		.usage('Usage: -c <path_to_postman_collection>')
		.option('p', {
			alias: 'path',
			describe: 'Path to the Postman collection you want to import',
			type: 'string',
			demandOption: true,
		})
		.option('e', {
			alias: 'envvar',
			describe: 'Path to the Postman environment variable json you want to import',
			type: 'string',
			demandOption: false,
		}).argv;

	const collectionPath = options.p;

	// Environment variable file import (Optional)
	if (option.e) {
		let environmentVarsJson = fs.readFileSync(option.e);
		const environmentVarsJsonObj = JSON.parse(environmentVarsJson);
		const envVariables = environmentVarsJsonObj.values;

		// NOTE: skips variables with empty value
		for (let envVariable of envVariables) {
			if (envVariable.value) {
				await instance({
					method: 'post',
					url: '/v1/variables',
					data: {
						key: envVariable.key,
						value: envVariable.value,
						locked: false,
					},
				});
			}
		}
	}

	// Collection import
	let collectionJson = fs.readFileSync(collectionPath);
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

		const checklyGroup = transform.transformFolder(postmanFolder)

		const response = await instance({
			method: 'post',
			url: '/v1/check-groups',
			data: checklyGroup,
		});

		const groupId = response.data.id;

		// Postman Tests -> Checkly Checks
		for (let postmanTest of postmanTests) {
			console.log(`> Adding check ${postmanTest.name}`);

			const checklyCheck = transform.transformTest(postmanTest, groupId)

			await instance({
				method: 'post',
				url: '/v1/checks',
				data: checklyCheck,
			});
		}
	}
})();

