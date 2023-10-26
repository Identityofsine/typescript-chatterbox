import { help } from "./help";
import { join } from "./join";
import { leave } from "./leave";
import { ping } from "./ping";
import { play } from "./play";
import { queue } from "./queue";
import { skip } from "./skip";
import { stop } from "./stop";
import { tts } from "./tts";

export const commands = [help, ping, join, leave, play, stop, skip, queue, tts];
