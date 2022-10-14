const axios = require('axios');
const converter = require('./converter');

const checklyApiKey = process.env.CHECKLY_API_KEY;
const checklyAccountId = process.env.CHECKLY_ACCOUNT_ID;

// Axios base config
const instance = axios.create({
    baseURL: 'https://api.checklyhq.com',
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

module.exports = {
	consumeCollection: consumeCollection,
	consumeEnvironment: consumeEnvironment,
};
