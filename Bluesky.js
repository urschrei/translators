{
	"translatorID": "3bba003a-ad42-457e-9ea1-547df39d9d00",
	"label": "Bluesky",
	"creator": "Stephan Hügel",
	"target": "^https://bsky\\.app/",
	"minVersion": "5.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2024-12-12 23:07:38"
}

/*
	***** BEGIN LICENSE BLOCK *****

	Copyright © 2024 Stephan Hügel <urschrei@gmail.com>

	This file is part of Zotero.

	Zotero is free software: you can redistribute it and/or modify
	it under the terms of the GNU Affero General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	Zotero is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
	GNU Affero General Public License for more details.

	You should have received a copy of the GNU Affero General Public License
	along with Zotero. If not, see <http://www.gnu.org/licenses/>.

	***** END LICENSE BLOCK *****
*/

function detectWeb(doc, url) {
	if (url.includes('/post/')) {
		return 'forumPost';
	}
	return false;
}

async function doWeb(doc, url) {
	await scrapeAPI(doc, url);
}

async function scrapeAPI(doc, url) {
	const handle = /(?:\/profile\/)(([^/]+))/;
	const postId = /(?:\/post\/)([a-zA-Z0-9]+)/;

	let foundHandle = url.match(handle)[1];
	let foundPostId = url.match(postId)[1];

	let apiUrl = `https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?uri=at://${foundHandle}/app.bsky.feed.post/${foundPostId}`;
	let data = await ZU.requestJSON(apiUrl);
	if (data.thread && data.thread.post) {
		let post = data.thread.post;
		let item = new Zotero.Item("forumPost");
		// Main post details

		// remove newlines and extra whitespace
		let titleCleaned = post.record.text.replace(/\s+/g, ' ');
		// Ensure that full post text is always available
		item.abstractNote = titleCleaned;
		// Tidy if necessary
		if (titleCleaned.length < 140) {
			item.title = titleCleaned;
		}
		else {
			item.title = ZU.ellipsize(titleCleaned, 140, true);
		}
		item.forumTitle = "Bluesky";
		item.type = "Skeet";
		item.url = url;
		item.date = post.record.createdAt || post.author.createdAt;
		item.language = post.record.langs ? post.record.langs.join(", ") : "en";
		
		// Add author information
		if (post.author) {
			let authorName = post.author.displayName || post.author.handle;
			item.creators.push(Zotero.Utilities.cleanAuthor(authorName, "author"));
		}

		// Add metadata for likes, reposts, etc.
		if (post.likeCount !== undefined) item.extra = `Likes: ${post.likeCount}`;
		if (post.repostCount !== undefined) item.extra += ` | Reposts: ${post.repostCount}`;
		if (post.quoteCount !== undefined) item.extra += ` | Quotes: ${post.quoteCount}`;

		// Handle embedded quote records (if any)
		if (post.embed && post.embed.record && post.embed.record.value) {
			let embeddedPost = post.embed.record.value;
			item.notes.push(`This post is quoting a post by @${post.embed.record.author.handle}: "${embeddedPost.text}"`);
		}

		// Handle replies (if any)
		if (data.thread.replies && data.thread.replies.length > 0) {
			const date = new Date();
			const utcStr = date.toUTCString();
			item.notes.push(`This post had ${data.thread.replies.length} direct replies as of ${utcStr}`);
		}
		item.attachments.push({ document: doc, title: "Snapshot" });
		item.complete();
	}
	else {
		Zotero.debug("There was an error saving the Skeet");
	}
}

/** BEGIN TEST CASES **/
var testCases = [
	{
		"type": "web",
		"url": "https://bsky.app/profile/watershedlab.bsky.social/post/3lcl3glmdx226",
		"defer": true,
		"items": [
			{
				"itemType": "forumPost",
				"title": "My first and only job in media was as a reporter on a small newspaper in England in 2002. My salary was £8700. Per year.",
				"creators": [
					{
						"firstName": "Dan",
						"lastName": "Shugar",
						"creatorType": "author"
					}
				],
				"date": "2024-12-05T16:25:35.749Z",
				"abstractNote": "My first and only job in media was as a reporter on a small newspaper in England in 2002. My salary was £8700. Per year.",
				"extra": "Likes: 8 | Reposts: 0 | Quotes: 0",
				"forumTitle": "Bluesky",
				"language": "en",
				"postType": "Skeet",
				"url": "https://bsky.app/profile/watershedlab.bsky.social/post/3lcl3glmdx226",
				"attachments": [
					{
						"title": "Snapshot",
						"mimeType": "text/html"
					}
				],
				"tags": [],
				"notes": [
					"This post is quoting a post by @ericwickham.ca: \"Told the guy replacing my car window how much I made at my first job in radio and I feel like it deeply changed what he thought about people in media.\"",
					"This post had 1 direct replies as of Mon, 09 Dec 2024 16:47:41 GMT"
				],
				"seeAlso": []
			}
		]
	}
]
/** END TEST CASES **/
