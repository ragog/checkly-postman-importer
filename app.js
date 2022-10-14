const yargs = require('yargs');
const fs = require('fs');
const { option } = require('yargs');
const importer = require('./importer');

(async () => {
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
	await importer.consume(collectionJson);
})();
