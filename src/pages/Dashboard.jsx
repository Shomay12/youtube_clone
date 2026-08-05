import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { videos = [], comments = [], channelInfo = {}, analytics = {}, spreadsheetWarnings = [], showToast } = useStore();

  const latestVideo = (videos && videos.length > 0) ? videos[0] : {};
  const recentComments = (comments || []).filter(c => c && c.status !== 'Held for review').slice(0, 4);

  // Realtime chart data from spreadsheet
  const realtimeData = analytics?.charts?.realtime || [];
  const totalRealtimeViews = realtimeData.reduce((acc, curr) => acc + (curr?.views || 0), 0);
  const recentSubscribers = analytics?.subscribers || [];

  useEffect(() => {
    console.info('[Spreadsheet] Dashboard Rendered', { videos: videos.length });
  }, [videos.length]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header-row">
        <h1 className="dashboard-title">Channel dashboard</h1>
        <div className="dashboard-header-actions">
          <button className="dash-icon-btn" title="Upload video" onClick={() => showToast("Click CREATE at top-right to upload", "info")}>
            <span className="material-symbols-outlined">upload</span>
          </button>
          <button className="dash-icon-btn" title="Go live" onClick={() => showToast("Simulated Live Stream initiated", "info")}>
            <span className="material-symbols-outlined">sensors</span>
          </button>
        </div>
      </div>
      
      {spreadsheetWarnings && spreadsheetWarnings.length > 0 && (
        <div style={{ backgroundColor: 'rgba(255, 171, 0, 0.1)', border: '1px solid #ffab00', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#ffc400', fontSize: '13px' }}>
          <strong>Spreadsheet CMS Status Notice:</strong>
          <ul style={{ margin: '4px 0 0 20px', padding: 0 }}>
            {spreadsheetWarnings.map((warn, i) => (
              <li key={i}>{warn}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="dashboard-grid">
        {/* Card 1: Latest Video Performance */}
        <div className="dashboard-card latest-video-card">
          <div className="card-header">
            <h2>Latest video performance</h2>
          </div>
          <div className="card-content">
            {latestVideo && latestVideo.id ? (
              <>
                <div className="video-thumbnail" onClick={() => navigate(`/channel/UCqpdVWIzEQUcbf4pAxlneOQ/video/${latestVideo.id}`)}>
                  <img src={latestVideo.thumbnail} alt="Video thumbnail" />
                  <div className="video-duration">{latestVideo.duration}</div>
                </div>
                <div className="video-stats-summary">
                  <p className="video-title" onClick={() => navigate(`/channel/UCqpdVWIzEQUcbf4pAxlneOQ/video/${latestVideo.id}`)}>{latestVideo.title}</p>
                  <div className="stat-row">
                    <span className="stat-label">Published date:</span>
                    <span className="stat-value">{latestVideo.date}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Views</span>
                    <span className="stat-value">{latestVideo.viewsFormatted || latestVideo.views?.toLocaleString() || '0'} <span className="material-symbols-outlined trend-up">arrow_upward</span></span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Likes</span>
                    <span className="stat-value">{latestVideo.likes?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Comments</span>
                    <span className="stat-value">{latestVideo.comments?.toLocaleString() || '0'}</span>
                  </div>
                </div>
              </>
            ) : (
              <p style={{ color: 'var(--text-secondary)', padding: '24px 0' }}>No recent video uploads found for this channel.</p>
            )}
          </div>
          {latestVideo && latestVideo.id && (
            <div className="card-footer">
              <Link to={`/channel/UCqpdVWIzEQUcbf4pAxlneOQ/analytics`}>GO TO VIDEO ANALYTICS</Link>
              <Link to="/channel/UCqpdVWIzEQUcbf4pAxlneOQ/comments">SEE COMMENTS ({latestVideo.comments?.toLocaleString() || 0})</Link>
            </div>
          )}
        </div>

        {/* Card 2: Channel Analytics (Large Creator Scale) */}
        <div className="dashboard-card analytics-card">
          <div className="card-header">
            <h2>Channel analytics</h2>
          </div>
          <div className="card-content">
            <div className="current-subs">
              <h3>Current subscribers</h3>
              <div className="sub-count">{channelInfo?.subscribersFormatted || channelInfo?.subscribers?.toLocaleString() || '0'}</div>
              <div className="sub-change">{channelInfo?.subscribersGainedLast28DaysFormatted || "+0"} in last 28 days</div>
            </div>
            
            <div className="summary-section">
              <h3>Summary</h3>
              <p className="summary-period">Last 28 days</p>
              
              <div className="stat-row">
                <span className="stat-label">Views</span>
                <span className="stat-value">{channelInfo?.viewsLast28DaysFormatted || '0'} <span className="material-symbols-outlined trend-up">arrow_upward</span></span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Watch time (hours)</span>
                <span className="stat-value">{channelInfo?.watchTimeLast28DaysFormatted || '0 hrs'} <span className="material-symbols-outlined trend-up">arrow_upward</span></span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Estimated revenue</span>
                <span className="stat-value">{channelInfo?.revenueLast28DaysFormatted || '$0'} <span className="material-symbols-outlined trend-up">arrow_upward</span></span>
              </div>
            </div>
            
            <div className="top-videos-section">
              <h3>Top videos</h3>
              <p className="summary-period">Last 48 hours · Views</p>
              
              {(videos || []).slice(0, 3).map(v => (
                <div className="top-video-item" key={v.id} onClick={() => navigate(`/channel/UCqpdVWIzEQUcbf4pAxlneOQ/video/${v.id}`)}>
                  <span className="video-name">{v.title}</span>
                  <span className="video-views">{v.viewsFormatted}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card-footer">
            <Link to="/channel/UCqpdVWIzEQUcbf4pAxlneOQ/analytics/tab-overview/period-last-28-days">GO TO CHANNEL ANALYTICS</Link>
          </div>
        </div>

        {/* Card 3: Published videos */}
        <div className="dashboard-card published-card">
          <div className="card-header">
            <h2>Published videos</h2>
          </div>
          <div className="card-content">
            {videos.slice(0, 4).map(video => <div className="published-video-row" key={video.id} onClick={() => navigate(`/channel/UCqpdVWIzEQUcbf4pAxlneOQ/video/${video.id}`)}>
              <img src={video.thumbnail} alt="" />
              <div><b>{video.title}</b><span>▥&nbsp; {video.viewsFormatted || video.views?.toLocaleString() || '0'} &nbsp;&nbsp; ▢&nbsp; {video.comments?.toLocaleString() || 0}</span></div>
            </div>)}
          </div>
          <div className="card-footer">
            <Link to="/channel/UCqpdVWIzEQUcbf4pAxlneOQ/content/videos">Go to videos</Link>
          </div>
        </div>

        {/* Card 4: Latest Comments */}
        <div className="dashboard-card comments-card">
          <div className="card-header">
            <h2>Recent comments</h2>
          </div>
          <div className="card-content">
            <p className="summary-period">Channel comments I haven&apos;t responded to</p>
            
            {recentComments.map(c => (
              <div className="comment-item" key={c.id} onClick={() => navigate('/channel/UCqpdVWIzEQUcbf4pAxlneOQ/comments')}>
                <img src={c.authorAvatar} alt="User" className="comment-avatar" />
                <div className="comment-details">
                  <div className="comment-meta">
                    <span className="comment-author">{c.author}</span>
                    <span className="comment-time">{c.time}</span>
                  </div>
                  <p className="comment-text">{c.text}</p>
                  <div className="comment-video">{c.videoTitle}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="card-footer">
            <Link to="/channel/UCqpdVWIzEQUcbf4pAxlneOQ/comments">GO TO COMMENTS</Link>
          </div>
        </div>

        {/* Card 5: Recent Subscribers */}
        <div className="dashboard-card subscribers-card">
          <div className="card-header">
            <h2>Recent subscribers</h2>
          </div>
          <div className="card-content">
            <p className="summary-period">Last 90 days</p>
            <div className="recent-sub-list">
              {recentSubscribers.length > 0 ? (
                recentSubscribers.slice(0, 3).map((sub, idx) => (
                  <div className="sub-item" key={idx}>
                    <img src={sub.avatar || 'https://ui-avatars.com/api/?name=User&background=random'} alt="Sub" className="sub-avatar" />
                    <div className="sub-info">
                      <span className="sub-name">{sub.name}</span>
                      <span className="sub-count-meta">{sub.subscribers ? `${sub.subscribers.toLocaleString()} subscribers` : sub.date}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', padding: '12px 0' }}>No recent subscriber details found.</p>
              )}
            </div>
          </div>
          <div className="card-footer">
            <span className="footer-action-link" onClick={() => showToast("Showing all recent subscribers", "info")}>SEE ALL</span>
          </div>
        </div>

        {/* Card 6: Ideas for You (Super Thanks Eligibility) */}
        <div className="dashboard-card ideas-card">
          <div className="card-header">
            <h2>Ideas for you</h2>
          </div>
          <div className="card-content">
            <h4>You&apos;re eligible for Super Thanks</h4>
            <p className="news-desc" style={{ margin: '8px 0 16px 0' }}>
              Increase your earnings potential and better connect with fans. Purchasers get a comment that stands out - don&apos;t forget to recognize them!
            </p>
            <button className="yt-sync-btn" onClick={() => showToast("Super Thanks enabled for channel!", "success")}>
              Enable now
            </button>
          </div>
        </div>

        {/* Card 7: Creator Insider */}
        <div className="dashboard-card news-card">
          <div className="card-header">
            <h2>Creator Insider</h2>
          </div>
          <div className="card-content">
            <div className="news-item">
              <img src="https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=400&q=80" alt="News" className="news-thumb" />
              <h4>YouTube News: Shows & Brand Deals</h4>
              <p className="news-desc">YouTube now lets you create structured shows with seasons and episodes and join brand deal open calls right from the YouTube Studio earn tab</p>
            </div>
          </div>
          <div className="card-footer">
            <a href="https://youtube.com" target="_blank" rel="noreferrer">Watch on YouTube</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
