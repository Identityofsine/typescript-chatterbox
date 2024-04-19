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
	post_title: string;
	post_url: string;
	post_author: number;
	post_author_image: string;
	post_content: string;
	post_excerpt: string;
	post_timestamp: string;
	post_thumbnail: string | false;
	post_categories: string[];
}

function stripHTML(html: string): string {
	return html.replace(/<\/?[^>]+(>|$)/g, "");
}

async function sendMessage(body: WordPressExpectedInput, type: PostType) {
	const title = body.post_title ?? " ";
	const message = stripHTML(body.post_excerpt ? body.post_excerpt : body.post_content.slice(0, 128) ?? "N/A");
	let image = await loadMedia(body.post_thumbnail ? body.post_thumbnail : "");
	if (image.startsWith('data:')) {
		image = await getTempImage(image);
	}
	const link = "https://fofx.zip/liminality/post/" + body.post_id;
	const author = body.post_author;
	let authorIMG = await loadMedia(body.post_author_image);
	if (authorIMG.startsWith('data:')) {
		authorIMG = await getTempImage(authorIMG);
	}
	const category = body.post_categories?.[0];

	//look for channels with the name 'announcements'
	client.channels.fetch('835670046562058290')
		.then(channel => {
			const embed = new EmbedBuilder()
				.setTitle(`[${type === PostType.CREATE ? 'NEW' : 'UPDATED'}] Post: ${title}`)
				.setDescription(message)
				.setURL(link)
				.setAuthor({ name: `${author}`, iconURL: authorIMG, url: 'https://fofx.zip/liminality/' })
				.addFields({ name: 'Category', value: category ?? "REDACTED", inline: false })
				.setImage(image)
				.setTimestamp(new Date(body.post_timestamp))
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

