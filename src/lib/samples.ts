import type { MediaItem, StreamItem } from "./types";

const now = Date.now();

export const SAMPLE_LIBRARY: MediaItem[] = [
  {
    id: "sample_bbb",
    title: "Big Buck Bunny",
    artist: "Blender Foundation",
    kind: "video",
    source: "sample",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnail:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg",
    duration: 596,
    createdAt: now - 86400000 * 4,
    platform: "Direct",
  },
  {
    id: "sample_elephants",
    title: "Elephants Dream",
    artist: "Blender Foundation",
    kind: "video",
    source: "sample",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnail:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg",
    duration: 653,
    createdAt: now - 86400000 * 3,
    platform: "Direct",
  },
  {
    id: "sample_sintel",
    title: "Sintel",
    artist: "Blender Foundation",
    kind: "video",
    source: "sample",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    thumbnail:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg",
    duration: 888,
    createdAt: now - 86400000 * 2,
    platform: "Direct",
  },
  {
    id: "sample_tears",
    title: "Tears of Steel",
    artist: "Blender Foundation",
    kind: "video",
    source: "sample",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    thumbnail:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg",
    duration: 734,
    createdAt: now - 86400000,
    platform: "Direct",
  },
  {
    id: "sample_forbigger",
    title: "For Bigger Blazes",
    artist: "Google",
    kind: "video",
    source: "sample",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnail:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg",
    duration: 15,
    createdAt: now - 3600000,
    platform: "Direct",
  },
];

export const SAMPLE_STREAMS: StreamItem[] = [
  {
    id: "stream_paradise",
    name: "Radio Paradise",
    url: "https://stream.radioparadise.com/aac-320",
    kind: "audio",
    createdAt: now,
  },
  {
    id: "stream_soma",
    name: "SomaFM Groove Salad",
    url: "https://ice1.somafm.com/groovesalad-128-mp3",
    kind: "audio",
    createdAt: now,
  },
  {
    id: "stream_mux",
    name: "Mux HLS Test",
    url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    kind: "hls",
    createdAt: now,
  },
];
