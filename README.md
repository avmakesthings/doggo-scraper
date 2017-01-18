# doggo-scraper
Get the premium doggos

# Usage
node run-scraper.js

# API Credentials
Can be put into "../fb-api-keys/doggo-scraper.json", example:
{appId: 213142, appSecret: 9239423992}

Alternately, credentials can be inserted as env variables into the node process, examples:

using personal API token: 
FB_API_TOKEN=234239042390423904230 node run-scraper.js

using app ID and app secret:
FB FB_APP_ID=213142 FB_APP_SECRET:9239423992 node run-scraper.js