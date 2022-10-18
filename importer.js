const axios = require('axios');
const converter = require('./converter');

const checklyApiKey = process.env.CHECKLY_API_KEY;
const checklyAccountId = process.env.CHECKLY_ACCOUNT_ID;
const checklyBaseUrl = process.env.CHECKLY_BASE_URL;

// Axios base config
const instance = axios.create({
	baseURL: checklyBaseUrl ? checklyBaseUrl : 'https://api.checklyhq.com',
	headers: {
		Authorization: `Bearer ${checklyApiKey}`,
		'X-Checkly-Account': checklyAccountId,
		'Content-Type': 'application/json',
	},
});

async function consumeCollection(collectionJson) {
	const collectionJsonObj = JSON.parse(collectionJson);
	const postmanFolders = collectionJsonObj.item;

	console.log('Importing collection ' + collectionJsonObj.info.name);

	const variables = collectionJsonObj.variable;

    await importVariables(variables)

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

async function consumeEnvironment(environmentJson) {
	const environmentVarsJsonObj = JSON.parse(environmentJson);
	const envVariables = environmentVarsJsonObj.values;

	console.log('Importing environment ' + environmentVarsJsonObj.name);

	await importVariables(envVariables)
}

async function importVariables(variables){
    if (variables?.length) {
        for (let variable of variables) {
            if (variable.value) {
                console.log(`Adding variable '${variable.key}'.`)
                await instance({
                    method: 'post',
                    url: '/v1/variables',
                    data: { key: variable.key, value: variable.value },
                });
            } else {
                console.log(`Variable '${variable.key}' has no value - skipping.`)
            }
            
        }
    }
}

module.exports = {
	consumeCollection: consumeCollection,
	consumeEnvironment: consumeEnvironment,
};
