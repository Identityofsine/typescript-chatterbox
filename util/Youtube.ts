import ytdl from "@distube/ytdl-core";
import { Readable, Writable, Transform } from "stream";
import debugPrint from "./DebugPrint";
import { PCM } from "./PCM";

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

	export interface SearchResult {
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

	export async function search(query: string): Promise<SearchResult[]> {
		const url = "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=" + query + "&key=" + API_KEY;

		const response = await fetch(url);
		const json = await response.json();
		return json.items as SearchResult[];
	}

	async function downloadYoutubeAudioBuffer(url: string): Promise<Readable> {
		const yt_download = ytdl(url, { filter: 'audioonly', quality: 'highestaudio' });
		const audio_pipe = new Transform();
		await (new Promise((resolve, reject) => {
			debugPrint("info", "[Youtube] Downloading audio buffer from : %s", url);
			yt_download.on('error', reject);
			yt_download.on('data', (chunk) => {
				debugPrint("info", "[Youtube] Downloading audio buffer: " + chunk.length + " bytes");
				audio_pipe.push(chunk);
				resolve(null);
			})
			yt_download.on('end', () => {
				debugPrint("info", "[Youtube] Downloading audio buffer: Finished");
				audio_pipe.push(null);
			});
		}));


		return audio_pipe;

	}


	export async function validYoutubeVideo(url: string): Promise<boolean> {
		return ytdl.validateURL(url);
	}

	export async function getYoutubeVideoInfo(url: string): Promise<VideoInfo> {
		if (!await validYoutubeVideo(url)) throw new Error("Invalid Youtube URL");

		const yt_info_uncasted = await ytdl.getBasicInfo(url);
		const yt_info: VideoInfo = {
			title: yt_info_uncasted.videoDetails.title,
			description: yt_info_uncasted.videoDetails.description,
			duration: Number(yt_info_uncasted.videoDetails.lengthSeconds),
		}
		return yt_info;
	}

	export type YoutubeResponse = { video_info: VideoInfo, buffer: Buffer }
	export async function getAudioBuffer(url: string): Promise<YoutubeResponse> {

		try {
			const yt_buffer = await downloadYoutubeAudioBuffer(url);
			const yt_info = await getYoutubeVideoInfo(url);
			const yt_pcm = await PCM.ffpmegToPCM(yt_buffer);

			return { video_info: yt_info, buffer: yt_pcm };

		}
		catch (err) {
			debugPrint("error", "[Youtube] Error: " + err);
			throw err;
		}

	}
}
