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

app.post('/webhook/wp', (req, res) => {
	const { title, image, link, message, type, author, authorIMG, abstract } = req.body as WordPressInput;
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
				.setAuthor({ name: author, iconURL: authorIMG, url: 'https://fofx.zip/liminality/' })
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

