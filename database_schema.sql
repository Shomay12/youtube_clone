-- ============================================================================
-- Insforge Database Structure Schema
-- Database: PostgreSQL (Insforge BaaS)
-- Purpose: Permanent CRM Storage, Channel Analytics, Video Performance & AVD
-- ============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. Table: crm_channel
-- Stores channel metrics, subscriber statistics, 28-day analytics & branding.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm_channel (
    channel_id VARCHAR(50) PRIMARY KEY DEFAULT 'UCqpdVWIzEQUcbf4pAxlneOQ',
    name VARCHAR(255) NOT NULL DEFAULT 'Kids Toon',
    handle VARCHAR(100) DEFAULT '@kidstoon',
    avatar TEXT DEFAULT '/channel-avatar.png',
    banner TEXT DEFAULT 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    country VARCHAR(100) DEFAULT 'United States',
    subscribers BIGINT DEFAULT 412850,
    subscribers_formatted VARCHAR(50) DEFAULT '412.9K',
    subscribers_gained_last_28_days BIGINT DEFAULT 214,
    subscribers_gained_last_28_days_formatted VARCHAR(50) DEFAULT '+214',
    views_last_28_days BIGINT DEFAULT 1250000,
    views_last_28_days_formatted VARCHAR(50) DEFAULT '1.3M',
    watch_time_last_28_days NUMERIC(15, 2) DEFAULT 1383.80,
    watch_time_last_28_days_formatted VARCHAR(50) DEFAULT '1.4K hrs',
    revenue_last_28_days NUMERIC(15, 2) DEFAULT 42050.00,
    revenue_last_28_days_formatted VARCHAR(50) DEFAULT '₹42,050.00',
    total_views BIGINT DEFAULT 21450000,
    total_revenue NUMERIC(15, 2) DEFAULT 721577.00,
    total_revenue_formatted VARCHAR(50) DEFAULT '₹7,21,577.00',
    currency VARCHAR(10) DEFAULT 'INR',
    has_explicit_channel_metrics BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. Table: crm_videos
-- Stores video metrics, average view timing (AVD), watch time, and subscriber gains.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm_videos (
    id VARCHAR(50) PRIMARY KEY,
    channel_id VARCHAR(50) DEFAULT 'UCqpdVWIzEQUcbf4pAxlneOQ',
    title TEXT NOT NULL,
    description TEXT,
    thumbnail TEXT,
    duration VARCHAR(20) DEFAULT '10:18',
    duration_secs INTEGER DEFAULT 618,
    avg_view_duration VARCHAR(20) DEFAULT '1:45',
    avg_view_duration_secs INTEGER DEFAULT 105,
    views BIGINT DEFAULT 0,
    views_formatted VARCHAR(50) DEFAULT '0',
    likes BIGINT DEFAULT 0,
    comments BIGINT DEFAULT 0,
    rpm NUMERIC(10, 2) DEFAULT 33.64,
    cpm NUMERIC(10, 2) DEFAULT 58.00,
    ctr NUMERIC(6, 2) DEFAULT 8.90,
    revenue NUMERIC(15, 2) DEFAULT 0.00,
    revenue_formatted VARCHAR(50) DEFAULT '₹0.00',
    subscribers_gained BIGINT DEFAULT 0,
    subscribers_lost BIGINT DEFAULT 0,
    net_subscribers BIGINT DEFAULT 0,
    watch_time_hrs NUMERIC(15, 2) DEFAULT 0.00,
    impressions BIGINT DEFAULT 0,
    visibility VARCHAR(20) DEFAULT 'Public',
    monetization BOOLEAN DEFAULT true,
    restrictions VARCHAR(50) DEFAULT 'None',
    category VARCHAR(50) DEFAULT 'Entertainment',
    publish_date VARCHAR(30) DEFAULT '2026-02-14',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 3. Table: crm_state
-- Stores entire application state snapshots for instant backup and restoration.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm_state (
    key VARCHAR(50) PRIMARY KEY DEFAULT 'current_state',
    state_data JSONB NOT NULL,
    saved_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- Indexes for High Performance Querying
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_crm_videos_sort ON crm_videos(sort_order);
CREATE INDEX IF NOT EXISTS idx_crm_videos_views ON crm_videos(views DESC);
CREATE INDEX IF NOT EXISTS idx_crm_videos_revenue ON crm_videos(revenue DESC);
CREATE INDEX IF NOT EXISTS idx_crm_videos_channel ON crm_videos(channel_id);

-- ----------------------------------------------------------------------------
-- Triggers for Automatic updated_at Timestamps
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_crm_channel_updated_at ON crm_channel;
CREATE TRIGGER trg_crm_channel_updated_at
    BEFORE UPDATE ON crm_channel
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_crm_videos_updated_at ON crm_videos;
CREATE TRIGGER trg_crm_videos_updated_at
    BEFORE UPDATE ON crm_videos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_crm_state_updated_at ON crm_state;
CREATE TRIGGER trg_crm_state_updated_at
    BEFORE UPDATE ON crm_state
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Seed Data
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Initial Seed Data: Channel
-- ----------------------------------------------------------------------------
INSERT INTO crm_channel (
    channel_id, name, handle, avatar, banner, country,
    subscribers, subscribers_formatted, subscribers_gained_last_28_days, subscribers_gained_last_28_days_formatted,
    views_last_28_days, views_last_28_days_formatted, watch_time_last_28_days, watch_time_last_28_days_formatted,
    revenue_last_28_days, revenue_last_28_days_formatted, total_views, total_revenue, total_revenue_formatted,
    currency, has_explicit_channel_metrics
) VALUES (
    'UCqpdVWIzEQUcbf4pAxlneOQ',
    'Kids Toon',
    '@kidstoon',
    '/channel-avatar.png',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    'United States',
    412850,
    '412.9K',
    214,
    '+214',
    1250000,
    '1.3M',
    1383.80,
    '1.4K hrs',
    42050.00,
    '₹42,050.00',
    21450000,
    721577.00,
    '₹7,21,577.00',
    'INR',
    false
)
ON CONFLICT (channel_id) DO UPDATE SET
    name = EXCLUDED.name,
    subscribers = EXCLUDED.subscribers,
    subscribers_gained_last_28_days = EXCLUDED.subscribers_gained_last_28_days,
    views_last_28_days = EXCLUDED.views_last_28_days,
    watch_time_last_28_days = EXCLUDED.watch_time_last_28_days,
    revenue_last_28_days = EXCLUDED.revenue_last_28_days,
    updated_at = CURRENT_TIMESTAMP;

-- ----------------------------------------------------------------------------
-- Initial Seed Data: Videos with Per-Video Average View Timing (AVD)
-- ----------------------------------------------------------------------------
INSERT INTO crm_videos (
    id, channel_id, title, description, thumbnail, duration, duration_secs,
    avg_view_duration, avg_view_duration_secs, views, views_formatted, likes, comments,
    rpm, cpm, ctr, revenue, revenue_formatted, subscribers_gained, subscribers_lost, net_subscribers,
    watch_time_hrs, impressions, visibility, monetization, restrictions, category, publish_date, sort_order
) VALUES
(
    'VID001', 'UCqpdVWIzEQUcbf4pAxlneOQ',
    'Instagram Viral Motu Patlu Wali Ai Video Kaise Banaye | Trending motu patlu video kaise banaye',
    'Trending Motu Patlu AI Video Generation guide.',
    '/thumbnails/1.webp', '10:18', 618,
    '1:45', 105, 1543000, '1.5M', 70978, 5246,
    34.10, 58.65, 8.90, 52616.30, '₹52,616.30', 21602, 2592, 19010,
    45.00, 17337078, 'Public', true, 'None', 'Entertainment', '2026-02-14', 1
),
(
    'VID002', 'UCqpdVWIzEQUcbf4pAxlneOQ',
    'Long AI Video Kaise Banaye (14 Min Video) | AI Video Kaise Banaye | AI Video Maker',
    'Full 14 minute long AI video creation masterclass.',
    '/thumbnails/2.webp', '14:22', 862,
    '3:45', 225, 892000, '892K', 41032, 3033,
    33.80, 58.14, 7.20, 30149.60, '₹30,149.60', 12488, 1499, 10989,
    55.75, 12388889, 'Public', true, 'None', 'Entertainment', '2026-02-28', 2
),
(
    'VID003', 'UCqpdVWIzEQUcbf4pAxlneOQ',
    'Create Kids Cartoon Nursery Rhymes with AI | AI Video Kaise Banaye | AI Video Maker',
    'Nursery rhymes cartoon video creation using AI tools.',
    '/thumbnails/3.webp', '12:14', 734,
    '2:57', 177, 650000, '650K', 29900, 2210,
    33.80, 58.14, 6.40, 21970.00, '₹21,970.00', 9100, 1092, 8008,
    31.96, 10156250, 'Public', true, 'None', 'Entertainment', '2026-03-02', 3
),
(
    'VID004', 'UCqpdVWIzEQUcbf4pAxlneOQ',
    'AI Blogging Course in 2026 using facebook, Instagram Youtube...',
    'Full course on AI blogging, social media traffic & monetization.',
    '/thumbnails/4.webp', '10:18', 618,
    '3:12', 192, 529000, '529K', 24334, 1799,
    33.80, 58.14, 6.20, 17880.20, '₹17,880.20', 7406, 889, 6517,
    28.21, 8532258, 'Public', true, 'None', 'Education', '2026-03-15', 4
),
(
    'VID005', 'UCqpdVWIzEQUcbf4pAxlneOQ',
    'बिना चेहरा दिखाए YouTube Video कैसे बनाए ? New Channel Ideas | YouTube search',
    'Faceless YouTube channel ideas and automation guide.',
    '/thumbnails/5.webp', '10:18', 618,
    '1:51', 111, 410000, '410K', 18860, 1394,
    33.70, 57.96, 7.80, 13817.00, '₹13,817.00', 5740, 689, 5051,
    12.64, 5256410, 'Public', true, 'None', 'Education', '2026-03-22', 5
),
(
    'VID006', 'UCqpdVWIzEQUcbf4pAxlneOQ',
    'Make AI Videos Using Notebook LM',
    'Learn to build videos with NotebookLM.',
    '/thumbnails/6.webp', '12:14', 734,
    '0:31', 31, 438000, '438K', 20148, 1489,
    34.50, 59.34, 4.90, 15111.00, '₹15,111.00', 6132, 736, 5396,
    3.77, 8938776, 'Public', true, 'None', 'Science & Technology', '2026-04-10', 6
),
(
    'VID007', 'UCqpdVWIzEQUcbf4pAxlneOQ',
    'Raj Shamani Business Idea',
    'Analyzing top business ideas and SaaS strategies.',
    '/thumbnails/7.webp', '08:42', 522,
    '0:46', 46, 2110000, '2.1M', 97060, 7174,
    33.20, 57.10, 9.30, 70052.00, '₹70,052.00', 29540, 3545, 25995,
    26.96, 22688172, 'Public', true, 'None', 'Business', '2026-04-28', 7
),
(
    'VID008', 'UCqpdVWIzEQUcbf4pAxlneOQ',
    'How to Make AI Influencers For FREE | Lip Sync Dancing AI Influencer...',
    'Create AI influencers with lip-sync and dancing animations for free.',
    '/thumbnails/1.webp', '07:56', 476,
    '2:03', 123, 973000, '973K', 44758, 3308,
    33.40, 57.45, 7.10, 32498.20, '₹32,498.20', 13622, 1635, 11987,
    33.24, 13704225, 'Public', true, 'None', 'Entertainment', '2026-06-02', 8
),
(
    'VID009', 'UCqpdVWIzEQUcbf4pAxlneOQ',
    'Open Source AI vs ChatGPT',
    'Detailed benchmark comparison between Llama 3, Mistral, and ChatGPT.',
    '/thumbnails/2.webp', '11:05', 665,
    '4:15', 255, 356000, '356K', 16376, 1210,
    34.80, 59.86, 5.10, 12388.80, '₹12,388.80', 4984, 598, 4386,
    25.22, 6980392, 'Public', true, 'None', 'Science & Technology', '2026-06-20', 9
),
(
    'VID010', 'UCqpdVWIzEQUcbf4pAxlneOQ',
    'My Biggest AI Project Yet',
    'Unveiling autonomous AI agent architecture built over 3 months.',
    '/thumbnails/3.webp', '07:56', 476,
    '3:20', 200, 812000, '812K', 37352, 2761,
    33.60, 57.79, 6.80, 27283.20, '₹27,283.20', 11368, 1364, 10004,
    45.11, 11941176, 'Public', true, 'None', 'Science & Technology', '2026-07-22', 10
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    thumbnail = EXCLUDED.thumbnail,
    duration = EXCLUDED.duration,
    avg_view_duration = EXCLUDED.avg_view_duration,
    avg_view_duration_secs = EXCLUDED.avg_view_duration_secs,
    views = EXCLUDED.views,
    views_formatted = EXCLUDED.views_formatted,
    likes = EXCLUDED.likes,
    comments = EXCLUDED.comments,
    rpm = EXCLUDED.rpm,
    revenue = EXCLUDED.revenue,
    revenue_formatted = EXCLUDED.revenue_formatted,
    subscribers_gained = EXCLUDED.subscribers_gained,
    subscribers_lost = EXCLUDED.subscribers_lost,
    net_subscribers = EXCLUDED.net_subscribers,
    updated_at = CURRENT_TIMESTAMP;
