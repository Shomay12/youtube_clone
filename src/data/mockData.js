export const mockVideos = [
  {
    id: "v1",
    title: "Building a SaaS from scratch in 24 hours",
    description: "Watch me build a full SaaS product in 24 hours! #programming #saas",
    thumbnail: "/thumbnails/1.webp",
    visibility: "Public",
    restrictions: "None",
    date: "2026-07-25",
    views: 12400,
    comments: 42,
    likes: 850,
    duration: "10:04",
    playlist: "Challenges",
    audience: "Not made for kids",
    tags: "saas, programming, challenge"
  },
  {
    id: "v2",
    title: "React best practices for 2026",
    description: "The absolute best practices you must follow when writing React.",
    thumbnail: "/thumbnails/2.webp",
    visibility: "Public",
    restrictions: "None",
    date: "2026-07-20",
    views: 8420,
    comments: 112,
    likes: 1200,
    duration: "15:20",
    playlist: "Tutorials",
    audience: "Not made for kids",
    tags: "react, javascript, webdev"
  },
  {
    id: "v3",
    title: "My dev setup tour",
    description: "Check out my new desk setup for coding.",
    thumbnail: "/thumbnails/3.webp",
    visibility: "Private",
    restrictions: "Copyright claim",
    date: "2026-07-15",
    views: 4310,
    comments: 20,
    likes: 310,
    duration: "08:45",
    playlist: "Vlogs",
    audience: "Not made for kids",
    tags: "setup, desk, developer"
  },
  {
    id: "v4",
    title: "Why I stopped using TailwindCSS",
    description: "Controversial opinion on utility CSS classes.",
    thumbnail: "/thumbnails/4.webp",
    visibility: "Unlisted",
    restrictions: "None",
    date: "2026-07-10",
    views: 15600,
    comments: 890,
    likes: 2100,
    duration: "12:15",
    playlist: "Opinions",
    audience: "Not made for kids",
    tags: "css, tailwind, webdev"
  }
];

export const mockComments = [
  {
    id: "c1",
    author: "John Doe",
    authorAvatar: "https://ui-avatars.com/api/?name=J&background=random",
    time: "2 hours ago",
    text: "This tutorial was exactly what I needed! Thanks for making it so clear.",
    videoId: "v1",
    videoTitle: "Building a SaaS from scratch in 24 hours",
    status: "Published",
    likes: 12
  },
  {
    id: "c2",
    author: "Sarah Smith",
    authorAvatar: "https://ui-avatars.com/api/?name=S&background=random",
    time: "5 hours ago",
    text: "Could you share the github repo link?",
    videoId: "v1",
    videoTitle: "Building a SaaS from scratch in 24 hours",
    status: "Published",
    likes: 4
  },
  {
    id: "c3",
    author: "SpamBot99",
    authorAvatar: "https://ui-avatars.com/api/?name=S&background=random",
    time: "1 day ago",
    text: "Make $5000 a day clicking this link!",
    videoId: "v2",
    videoTitle: "React best practices for 2026",
    status: "Held for review",
    likes: 0
  }
];

export const mockChannelInfo = {
  name: "Quaxiom SaaS",
  subscribers: 8492,
  avatar: "https://ui-avatars.com/api/?name=Channel&background=ff0000&color=fff&rounded=true&size=112",
  viewsLast28Days: 45200,
  watchTimeLast28Days: 3100
};

// Analytics mock data for charts
export const mockAnalyticsData = [
  { name: 'Jul 21', views: 4000, watchTime: 240, subscribers: 24 },
  { name: 'Jul 22', views: 3000, watchTime: 139, subscribers: 22 },
  { name: 'Jul 23', views: 2000, watchTime: 980, subscribers: 22 },
  { name: 'Jul 24', views: 2780, watchTime: 390, subscribers: 20 },
  { name: 'Jul 25', views: 1890, watchTime: 480, subscribers: 21 },
  { name: 'Jul 26', views: 2390, watchTime: 380, subscribers: 25 },
  { name: 'Jul 27', views: 3490, watchTime: 430, subscribers: 21 },
];
