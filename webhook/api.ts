import axios from "axios";
import fs from "fs";
import https from "https";
const END_POINT = "https://a.liminal/wp-json/wp/v2/";

const crt_dir = process.env.SSL_DIR as string ?? "";
const https_agent = new https.Agent({
	ca: fs.readFileSync(crt_dir),
}); // This is for self-signed certificate, change to env please

export const axios_instance = axios.create({
	httpsAgent: https_agent,
});

const headers = {
	"Content-Type": "application/json",
}

export async function get<T>(endPoint: string, params: object = {}): Promise<T | undefined> {
	try {
		return (await axios_instance.get(`${END_POINT}${endPoint}`, {
			headers: headers,
			params: { ...params }
		})).data;
	}
	catch (e) {
		return undefined;
	}
}



/*
post_id 	The post id of the created post.
post 	The whole post object with all of its values
post_meta 	An array of the whole post meta data.
post_thumbnail 	The full featured image/thumbnail URL in the full size.
post_permalink 	The permalink of the currently given post.
taxonomies 	(Array) An array containing the taxonomy data of the assigned taxonomies. Custom Taxonomies are supported too.
*/

export type User = {
	id: number; // Unique identifier for the user.
	username?: string; // Login name for the user. (Context: edit)
	name?: string; // Display name for the user. (Context: embed, view, edit)
	first_name?: string; // First name for the user. (Context: edit)
	last_name?: string; // Last name for the user. (Context: edit)
	email?: string; // The email address for the user. (Context: edit)
	url?: string; // URL of the user. (Context: embed, view, edit)
	description?: string; // Description of the user. (Context: embed, view, edit)
	link?: string; // Author URL of the user. (Context: embed, view, edit)
	locale?: string; // Locale for the user. (Context: edit)
	nickname?: string; // The nickname for the user. (Context: edit)
	slug?: string; // An alphanumeric identifier for the user. (Context: embed, view, edit)
	registered_date?: string; // Registration date for the user. (Context: edit)
	roles?: string[]; // Roles assigned to the user. (Context: edit)
	password?: string; // Password for the user (never included).
	capabilities?: Record<string, any>; // All capabilities assigned to the user. (Read only, Context: edit)
	extra_capabilities?: Record<string, any>; // Any extra capabilities assigned to the user. (Read only, Context: edit)
	avatar_urls?: Record<string, string>; // Avatar URLs for the user. (Read only, Context: embed, view, edit)
	meta?: Record<string, any>; // Meta fields. (Context: view, edit)
};

export interface Category {
	id: number;
	count: number;
	description: string;
	link: string;
	name: string;
	slug: string;
	taxonomy: string;
	parent: number;
	meta: any[]; // You might want to replace `any[]` with a more specific type if you have information about the structure of `meta`
	_links: {
		self: {
			href: string;
		}[];
		collection: {
			href: string;
		}[];
		about: {
			href: string;
		}[];
		"wp:post_type": {
			href: string;
		}[];
		curies: {
			name: string;
			href: string;
			templated: boolean;
		}[];
	};
}

export async function getAuthor(id: string): Promise<User | undefined> {
	const response = await get<User[]>(`users?include[]=${id ?? 0}`);

	let user = response?.[0];
	if (!user) return undefined;
	if (!user.avatar_urls) return user;

	return user;
}

export async function getCategory(id: string): Promise<Category | undefined> {
	const response = await get<Category[]>(`categories?include[]=${id ?? 0}`);

	let category = response?.[0];
	if (!category) return undefined;

	return category as Category;
}

