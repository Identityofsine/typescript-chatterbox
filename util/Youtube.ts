import ytdl from "@distube/ytdl-core";
import ffpmeg from "fluent-ffmpeg";
import { Readable, Writable, Transform } from "stream";
import debugPrint from "./DebugPrint";
import { DiscordBotError } from "../types/error";
import { CastWriteableToReadable } from "./WriteabletoReadable";

export namespace Youtube {
	interface SearchId {
		kind: string;
		videoId: string;
		channelId: string;
		playlistId: string;
	}

	interface Thumbnail {
		url: string;
		width: number;
		height: number;
	}

	interface Snippet {
		publishedAt: string; // Use a proper date type if possible
		channelId: string;
		title: string;
		description: string;
		thumbnails: Record<string, Thumbnail>;
		channelTitle: string;
		liveBroadcastContent: string;
	}

	interface SearchResult {
		kind: string;
		etag: string;
		id: SearchId;
		snippet: Snippet;
	}

	interface LocalizedText {
		title: string;
		description: string;
	}

	interface VideoSnippet {
		publishedAt: string; // Use a proper date type if possible
		channelId: string;
		title: string;
		description: string;
		thumbnails: Record<string, Thumbnail>;
		channelTitle: string;
		tags: string[];
		categoryId: string;
		liveBroadcastContent: string;
		defaultLanguage: string;
		localized: LocalizedText;
		defaultAudioLanguage: string;
	}

	interface RegionRestriction {
		allowed: string[];
		blocked: string[];
	}

	interface ContentRating {
		acbRating: string;
		// Add other content rating fields as needed
	}

	interface ContentDetails {
		duration: string;
		dimension: string;
		definition: string;
		caption: string;
		licensedContent: boolean;
		regionRestriction: RegionRestriction;
		contentRating: ContentRating;
		// Add other content details fields as needed
	}

	interface Status {
		uploadStatus: string;
		failureReason: string;
		rejectionReason: string;
		privacyStatus: string;
		publishAt: string; // Use a proper date type if possible
		license: string;
		embeddable: boolean;
		publicStatsViewable: boolean;
		madeForKids: boolean;
		selfDeclaredMadeForKids: boolean;
	}

	interface Statistics {
		viewCount: string;
		likeCount: string;
		dislikeCount: string;
		favoriteCount: string;
		commentCount: string;
	}

	interface VideoPlayer {
		embedHtml: string;
		embedHeight: number;
		embedWidth: number;
	}

	interface TopicDetails {
		topicIds: string[];
		relevantTopicIds: string[];
		topicCategories: string[];
	}

	interface RecordingDetails {
		recordingDate: string; // Use a proper date type if possible
	}

	interface VideoFileDetails {
		fileName: string;
		fileSize: number;
		fileType: string;
		container: string;
		videoStreams: {
			widthPixels: number;
			heightPixels: number;
			frameRateFps: number;
			aspectRatio: number;
			codec: string;
			bitrateBps: number;
			rotation: string;
			vendor: string;
		}[];
		audioStreams: {
			channelCount: number;
			codec: string;
			bitrateBps: number;
			vendor: string;
		}[];
		durationMs: number;
		bitrateBps: number;
		creationTime: string; // Use a proper date type if possible
	}

	interface ProcessingProgress {
		partsTotal: number;
		partsProcessed: number;
		timeLeftMs: number;
	}

	interface ProcessingDetails {
		processingStatus: string;
		processingProgress: ProcessingProgress;
		processingFailureReason: string;
		fileDetailsAvailability: string;
		processingIssuesAvailability: string;
		tagSuggestionsAvailability: string;
		editorSuggestionsAvailability: string;
		thumbnailsAvailability: string;
	}

	interface TagSuggestion {
		tag: string;
		categoryRestricts: string[];
	}

	interface Suggestions {
		processingErrors: string[];
		processingWarnings: string[];
		processingHints: string[];
		tagSuggestions: TagSuggestion[];
		editorSuggestions: string[];
	}

	interface LiveStreamingDetails {
		actualStartTime: string; // Use a proper date type if possible
		actualEndTime: string; // Use a proper date type if possible
		scheduledStartTime: string; // Use a proper date type if possible
		scheduledEndTime: string; // Use a proper date type if possible
		concurrentViewers: number;
		activeLiveChatId: string;
	}

	interface Localization {
		title: string;
		description: string;
	}

	interface Video {
		kind: string;
		etag: string;
		id: string;
		snippet: VideoSnippet;
		contentDetails: ContentDetails;
		status: Status;
		statistics: Statistics;
		player: VideoPlayer;
		topicDetails: TopicDetails;
		recordingDetails: RecordingDetails;
		fileDetails: VideoFileDetails;
		processingDetails: ProcessingDetails;
		suggestions: Suggestions;
		liveStreamingDetails: LiveStreamingDetails;
		localizations: Record<string, Localization>;
	}

	interface SearchResponse {
		SEARCH: SearchResult[];
	}

	interface VideoResponse {
		VIDEO: Video[];
	}

	interface VideoInfo {
		title: string;
		description: string;
		duration: number;
	}

	const API_KEY = "AIzaSyDbpxwe3VnHZtKZuPJzXCkQtianD37WcYs"

	//@ts-ignore
	export function getVideoInfo(url: string): Promise<VideoResponse> {

	}
	//@ts-ignore
	export function search(query: string): Promise<SearchResponse> {

	}

	async function downloadYoutubeAudioBuffer(url: string): Promise<Readable> {
		const yt_download = ytdl(url, { filter: 'audioonly', quality: 'highestaudio' });
		const audio_pipe = new Transform();
		await (new Promise((resolve, reject) => {
			debugPrint("[Youtube] Downloading audio buffer from : %s", url);
			yt_download.on('error', reject);
			yt_download.on('data', (chunk) => {
				debugPrint("[Youtube] Downloading audio buffer: " + chunk.length + " bytes");
				audio_pipe.push(chunk);
			})
			yt_download.on('end', () => {
				debugPrint("[Youtube] Downloading audio buffer: Finished");
				audio_pipe.push(null);
				resolve(null);
			});
		}));


		return audio_pipe;

	}

	export type YoutubeResponse = { video_info: VideoInfo, buffer: Buffer }
	export async function getAudioBuffer(url: string): Promise<YoutubeResponse> {
		const yt_buffer = await downloadYoutubeAudioBuffer(url);
		const yt_info_uncasted = await ytdl.getBasicInfo(url);
		const yt_info: VideoInfo = {
			title: yt_info_uncasted.videoDetails.title,
			description: yt_info_uncasted.videoDetails.description,
			duration: Number(yt_info_uncasted.videoDetails.lengthSeconds),
		}

		const audio_prebuffer = [];
		let buffer: Buffer = null;

		const finish_pipe = () => {
			debugPrint("[Youtube][FFPMEG] Buffer transformed successfully");
			buffer = Buffer.concat(audio_prebuffer);
		}

		await (new Promise((resolve, reject) => {
			ffpmeg()
				.input(yt_buffer as Readable)
				.audioChannels(1)
				.toFormat('wav')
				.pipe()
				.on('data', (chunk) => {
					debugPrint("[Youtube][FFPMEG] Buffering: " + chunk.length + " bytes");
					audio_prebuffer.push(chunk);
				})
				.on('close', () => {
					debugPrint("[Youtube][FFPMEG] Closed");
					finish_pipe();
					resolve(null);
				})
				.on('error', (err) => {
					debugPrint("[Youtube][FFPMEG] Error: " + err);
					reject(err);
				});
		}));

		return { video_info: yt_info, buffer: buffer };
	}
}
