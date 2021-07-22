// Imports environment variables from a Postman file
// Note: will not import variables with an empty value field

const axios = require('axios');
const fs = require('fs');

(async () => {

    let rawdata = fs.readFileSync('data/postman_environment.json');
    const jsonObj = JSON.parse(rawdata);
    
    const envVariables = jsonObj.values

    for (let envVariable of envVariables) {
        
        if (envVariable.value) {
            await axios({
                method: 'post',
                url: 'https://api-test.checklyhq.com/v1/variables',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer '
                },
                data: {
                    key: envVariable.key,
                    value: envVariable.value,
                    locked: false
                }
            });
        }

    }
})()