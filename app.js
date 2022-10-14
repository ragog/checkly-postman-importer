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
	if (options.e) {
		let environmentJson = fs.readFileSync(options.e);
		await importer.consumeEnvironment(environmentJson)
	}

	// Collection import
	let collectionJson = fs.readFileSync(collectionPath);
	await importer.consumeCollection(collectionJson);
})();
