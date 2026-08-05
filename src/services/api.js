import { mockVideos, mockComments, mockChannelInfo, mockAnalyticsData } from '../data/mockData';

// Simulate a slight network delay
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const apiService = {
  getVideos: async () => {
    await delay();
    return [...mockVideos];
  },
  
  getVideoById: async (id) => {
    await delay();
    const video = mockVideos.find(v => v.id === id);
    if (!video) throw new Error("Video not found");
    return { ...video };
  },

  updateVideo: async (id, updates) => {
    await delay();
    const index = mockVideos.findIndex(v => v.id === id);
    if (index === -1) throw new Error("Video not found");
    
    // In a real app we'd update the backend. For this mock, we just update the in-memory array.
    mockVideos[index] = { ...mockVideos[index], ...updates };
    return mockVideos[index];
  },

  deleteVideo: async (id) => {
    await delay();
    const index = mockVideos.findIndex(v => v.id === id);
    if (index > -1) {
      mockVideos.splice(index, 1);
    }
    return true;
  },

  getComments: async () => {
    await delay();
    return [...mockComments];
  },

  getChannelInfo: async () => {
    await delay();
    return { ...mockChannelInfo };
  },

  getAnalytics: async () => {
    await delay();
    return [...mockAnalyticsData];
  }
};
