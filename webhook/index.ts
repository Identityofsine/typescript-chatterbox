import express from 'express';
import client from '../discord';
import { DMChannel, EmbedBuilder, TextChannel } from 'discord.js';

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

type WordPressInput = {
	title: string;
	message: string;
	abstract: string;
	image: string;
	author: string;
	authorIMG: string;
	link: string;
	type: PostType;
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
	};
	post_meta: Record<string, string>;
	post_thumbnail: string;
	post_permalink: string;
	taxonomies: Record<string, string>;
}

/*
post_id 	The post id of the created post.
post 	The whole post object with all of its values
post_meta 	An array of the whole post meta data.
post_thumbnail 	The full featured image/thumbnail URL in the full size.
post_permalink 	The permalink of the currently given post.
taxonomies 	(Array) An array containing the taxonomy data of the assigned taxonomies. Custom Taxonomies are supported too.
*/

app.post('/webhook/wp/create', (req, res) => {
	const body = req.body as WordPressExpectedInput;
	const title = body.post.post_title;
	const message = body.post.post_content;
	const abstract = body.post.post_excerpt;
	const image = body.post_thumbnail;
	const link = "https://fofx.zip/limiality/" + body.taxonomies.category;
	const author = body.post.post_author;
	const authorIMG = body.post_meta.author_image;
	const type = PostType.CREATE;

	if (!(title && image && link && message && author && authorIMG && abstract)) {
		console.log(title, image, link, message, author, authorIMG);
		res.status(400).send('Missing required fields');
		return;
	}
	//look for channels with the name 'announcements'
	client.channels.fetch('835670046562058290')
		.then(channel => {
			const embed = new EmbedBuilder()
				.setTitle(`[${type === PostType.CREATE ? 'NEW' : 'UPDATED'}] Post: ${title}`)
				.setDescription(message)
				.setURL(link)
				.setAuthor({ name: `${author}`, iconURL: authorIMG, url: 'https://fofx.zip/liminality/' })
				.addFields({ name: 'Abstract', value: abstract, inline: false })
				.setImage(image)
				.setTimestamp()
				.setFooter({ text: 'Liminality', iconURL: 'https://fofx.zip/fx-favicon.svg' })
				;

			channel.isTextBased() && (channel as TextChannel).send({ embeds: [embed] });
		})
		.catch(err => {
			console.error(err);
		});
	res.send('Message sent to channel');
});

app.listen(8337, () => {
	console.log('Webhook Server is running on port 8337');
});

export default app;

