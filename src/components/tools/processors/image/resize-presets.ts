export interface ResizePreset {
  id: string;
  name: string;
  category: "social" | "video" | "display";
  width: number;
  height: number;
  description: string;
  aspectRatio: string;
}

export const RESIZE_PRESETS: ResizePreset[] = [
  // Social Media Presets
  {
    id: "instagram-square",
    name: "Instagram Square",
    category: "social",
    width: 1080,
    height: 1080,
    description: "Standard 1:1 Feed Post",
    aspectRatio: "1:1",
  },
  {
    id: "instagram-portrait",
    name: "Instagram Portrait",
    category: "social",
    width: 1080,
    height: 1350,
    description: "4:5 Vertical Feed Post",
    aspectRatio: "4:5",
  },
  {
    id: "instagram-story",
    name: "Instagram Story / Reel",
    category: "social",
    width: 1080,
    height: 1920,
    description: "9:16 Full Screen Vertical",
    aspectRatio: "9:16",
  },
  {
    id: "facebook-post",
    name: "Facebook Post",
    category: "social",
    width: 1200,
    height: 630,
    description: "1.91:1 Feed & Link Share",
    aspectRatio: "1.91:1",
  },
  {
    id: "twitter-post",
    name: "X (Twitter) Post",
    category: "social",
    width: 1600,
    height: 900,
    description: "16:9 In-Feed Photo",
    aspectRatio: "16:9",
  },
  {
    id: "linkedin-post",
    name: "LinkedIn Post",
    category: "social",
    width: 1200,
    height: 627,
    description: "1.91:1 Article / Feed Image",
    aspectRatio: "1.91:1",
  },

  // Video & Streaming Presets
  {
    id: "youtube-thumbnail",
    name: "YouTube Thumbnail",
    category: "video",
    width: 1280,
    height: 720,
    description: "16:9 Standard HD Video Cover",
    aspectRatio: "16:9",
  },
  {
    id: "youtube-banner",
    name: "YouTube Channel Banner",
    category: "video",
    width: 2560,
    height: 1440,
    description: "16:9 TV & Desktop Header",
    aspectRatio: "16:9",
  },

  // Display & Wallpaper Presets
  {
    id: "full-hd",
    name: "Full HD (1080p)",
    category: "display",
    width: 1920,
    height: 1080,
    description: "16:9 Standard Screen Display",
    aspectRatio: "16:9",
  },
  {
    id: "4k-uhd",
    name: "4K UHD (2160p)",
    category: "display",
    width: 3840,
    height: 2160,
    description: "16:9 Ultra HD Wallpaper",
    aspectRatio: "16:9",
  },
  {
    id: "hd-720p",
    name: "HD (720p)",
    category: "display",
    width: 1280,
    height: 720,
    description: "16:9 Compact Web Display",
    aspectRatio: "16:9",
  },
];
