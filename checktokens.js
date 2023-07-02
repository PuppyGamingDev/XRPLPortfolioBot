const axios = require('axios')

async function check () {
    const response = await axios.get("https://s1.xrplmeta.org/tokens")
    console.log(response.data.tokens)
}
check()
