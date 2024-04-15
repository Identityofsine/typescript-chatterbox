import express from 'express';
import client from '../discord';
import { DMChannel, EmbedBuilder, TextChannel } from 'discord.js';
import { get, getAuthor, getCategory, getPost } from './api';
import { getTempImage } from './tempimg';
import { loadMedia } from './loadmedia';

const app = express();

app.use(express.json());

app.get('/activity', (req, res) => {
	const message = (req.query.message as string) ?? 'Hello World!';
	client.user.setActivity(message);
	res.send('Activity set to ' + message);
});


enum PostType {
	UPDATE = 0x00,
	CREATE = 0x10,
}

type WordPressExpectedInput = {
	post_id: number;
	post: {
		post_title: string;
		post_author: number;
		post_content: string;
		post_excerpt: string;
		post_thumbnail: string;
		post_permalink: string;
		post_modified: string,
	};
	post_meta: Record<string, string>;
	post_thumbnail: string;
	post_permalink: string;
	taxonomies: {
		category: Record<string, any>
	};
}
function getFirstCategory(taxonomies: WordPressExpectedInput['taxonomies']['category']): string {
	return taxonomies[Object.keys(taxonomies)[0]].term_id;
}

function stripHTML(html: string): string {
	return html.replace(/<\/?[^>]+(>|$)/g, "");
}

async function sendMessage(body: WordPressExpectedInput, type: PostType) {
	const title = body.post.post_title ?? " ";
	const post = await getPost(`${body.post_id}`);
	const message = stripHTML(post?.excerpt?.rendered ?? "N/A");
	let image = await loadMedia(body.post_thumbnail);
	if (image.startsWith('data:')) {
		image = await getTempImage(image);
	}
	const link = "https://fofx.zip/limiality/post/" + body.post_id;
	const author = await (getAuthor(`${body.post.post_author}`));
	let authorIMG = await loadMedia(author.avatar_urls?.[96]);
	if (authorIMG.startsWith('data:')) {
		authorIMG = await getTempImage(authorIMG);
	}
	const category = await getCategory(getFirstCategory(body.taxonomies.category));
	//look for channels with the name 'announcements'
	client.channels.fetch('835670046562058290')
		.then(channel => {
			const embed = new EmbedBuilder()
				.setTitle(`[${type === PostType.CREATE ? 'NEW' : 'UPDATED'}] Post: ${title}`)
				.setDescription(message)
				.setURL(link)
				.setAuthor({ name: `${author.name}`, iconURL: authorIMG, url: 'https://fofx.zip/liminality/' })
				.addFields({ name: 'Category', value: category.name ?? "REDACTED", inline: false })
				.setImage(image)
				.setTimestamp(new Date(body.post.post_modified))
				.setFooter({ text: 'Liminality', iconURL: 'https://avatars.githubusercontent.com/u/67929513?v=4' })
				;
			channel.isTextBased() && (channel as TextChannel).send({ embeds: [embed] });
		})
		.catch(err => {
			console.error(err);
		});

}

app.post('/webhook/wp/create', async (req, res) => {
	try {
		await sendMessage(req.body, PostType.CREATE)
		res.send('Message sent to channel');
	} catch (e) {
		res.send('Error: ' + e);
	}
});

app.post('/webhook/wp/update', async (req, res) => {
	try {
		await sendMessage(req.body, PostType.UPDATE)
		res.send('Message sent to channel');
	} catch (e) {
		console.error(e);
		res.send('Error: ' + e);
	}
});

app.listen(8337, () => {
	console.log('Webhook Server is running on port 8337');
});

export default app;

