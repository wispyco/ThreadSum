require('dotenv').config();
const { TwitterApiReadOnly, Tweetv2TimelineResult } = require('twitter-api-v2');

var client = new TwitterApiReadOnly({
  appKey: process.env.appKey,
  appSecret: process.env.appSecret,
  accessToken: process.env.accessToken,
  accessSecret: process.env.accessSecret
});

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.apiKey,
});
const openai = new OpenAIApi(configuration);

const link = process.env.URL

console.log(link)

var mocha = link.match(/([^\?]+)(\?.*)?/, link)

let id
if (mocha[2]){

   id = mocha[1].match(/status\/(\d+)$/, mocha[1]);
}

else {
   id = link.match(/status\/(\d+)$/, link);

}


console.log("id", id[1])
 
var params = id[1]



const start = async () => {
	const test = await client.appLogin();
  console.log(test)
	await client.v2
		.singleTweet(params, {
			'tweet.fields': ['conversation_id']
		})
		.then(async (tweet) => {
			tweet.data.conversation_id &&
				(await getReplies(tweet.data.conversation_id, 1));
		})
		.catch((err) => console.log(err));
};

async function getReplies(conversationId, page, next) {
	await client.v2
		.get('tweets/search/recent', {
			query: `conversation_id: ${conversationId}`,
			next_token: next
		})
		.then(async (replies) => {
			if (replies.meta.result_count === 0) {
				return console.log('No replies found in the last 7 days');
			}
      
      let array = []
      for (let step=0; step< 10; step++){
        // console.log(replies.data[step].text)
        array.push(replies.data[step].text)
        
      }

        const response1 = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: `summarize all of this twitter conversation ${array}`,
        max_tokens: 200,
        temperature: 0,
      });

      console.log(response1.data.choices)

			// Check if there are more replies to loop through
			if (replies.data.length === 10 && page < 1) {
				await getReplies(conversationId, page + 1, replies.meta.next_token);
			}
		});
}

start()