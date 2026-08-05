import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import './Comments.css';

const Comments = () => {
  const { 
    comments, addCommentReply, toggleCommentHeart, toggleCommentLike, 
    deleteComment, hideUserFromChannel, showToast 
  } = useStore();

  const [activeTab, setActiveTab] = useState('Published');
  const [filterText, setFilterText] = useState('');
  const [replyInputId, setReplyInputId] = useState(null);
  const [replyText, setReplyText] = useState('');

  const filteredComments = comments.filter(c => {
    const matchesTab = c.status === activeTab;
    const matchesSearch = c.author.toLowerCase().includes(filterText.toLowerCase()) || 
                          c.text.toLowerCase().includes(filterText.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleSendReply = (commentId) => {
    if (!replyText.trim()) return;
    addCommentReply(commentId, replyText);
    setReplyInputId(null);
    setReplyText('');
    showToast("Reply published", "success");
  };

  const handleHideUser = (author) => {
    if (window.confirm(`Hide user "${author}" and remove all their comments from channel?`)) {
      hideUserFromChannel(author);
      showToast(`User ${author} hidden from channel`, "warning");
    }
  };

  return (
    <div className="dashboard-container comments-page">
      <h1 className="dashboard-title">Channel comments</h1>
      
      {/* Sub Tabs */}
      <div className="content-tabs">
        <button 
          className={`tab ${activeTab === 'Published' ? 'active' : ''}`}
          onClick={() => setActiveTab('Published')}
        >
          Published ({comments.filter(c => c.status === 'Published').length})
        </button>
        <button 
          className={`tab ${activeTab === 'Held for review' ? 'active' : ''}`}
          onClick={() => setActiveTab('Held for review')}
        >
          Held for review ({comments.filter(c => c.status === 'Held for review').length})
        </button>
      </div>

      {/* Filter Controls */}
      <div className="content-filters">
        <div className="filter-search-box">
          <span className="material-symbols-outlined filter-icon">filter_list</span>
          <input 
            type="text" 
            placeholder="Search comments..." 
            className="filter-input" 
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
      </div>

      {/* Comments List */}
      <div className="comments-list">
        {filteredComments.length === 0 ? (
          <p className="no-comments">No comments matching your filter.</p>
        ) : (
          filteredComments.map(comment => (
            <div className="comment-list-item" key={comment.id}>
              <div className="comment-left">
                <img src={comment.authorAvatar} alt="Author" className="author-avatar" />
              </div>
              
              <div className="comment-middle">
                <div className="comment-meta">
                  <span className="author-name">{comment.author}</span>
                  <span className="comment-time">{comment.time}</span>
                </div>
                <p className="comment-text">{comment.text}</p>

                {/* Reply Threads */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="replies-container">
                    {comment.replies.map(r => (
                      <div key={r.id} className="reply-item">
                        <img src={r.authorAvatar} alt="Reply Author" className="reply-avatar" />
                        <div>
                          <span className="reply-author">{r.author}</span>
                          <span className="reply-time">{r.time}</span>
                          <p className="reply-text">{r.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline Reply Input Box */}
                {replyInputId === comment.id && (
                  <div className="inline-reply-box">
                    <input 
                      type="text" 
                      placeholder="Add a public reply..." 
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <div className="reply-box-actions">
                      <button className="cancel-reply-btn" onClick={() => setReplyInputId(null)}>CANCEL</button>
                      <button className="send-reply-btn" onClick={() => handleSendReply(comment.id)}>REPLY</button>
                    </div>
                  </div>
                )}

                {/* Action Toolbar */}
                <div className="comment-actions">
                  <button className="action-btn" onClick={() => setReplyInputId(replyInputId === comment.id ? null : comment.id)}>
                    <span className="material-symbols-outlined">reply</span> REPLY
                  </button>
                  <button 
                    className={`icon-action-btn ${comment.userLiked ? 'active-like' : ''}`} 
                    onClick={() => toggleCommentLike(comment.id)}
                  >
                    <span className="material-symbols-outlined">thumb_up</span>
                    <span className="like-count">{comment.likes || 0}</span>
                  </button>
                  <button 
                    className={`icon-action-btn heart-btn ${comment.heart ? 'active-heart' : ''}`} 
                    onClick={() => toggleCommentHeart(comment.id)}
                  >
                    <span className="material-symbols-outlined">favorite</span>
                  </button>
                  <button className="icon-action-btn" onClick={() => deleteComment(comment.id)} title="Remove comment">
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                  <button className="icon-action-btn" onClick={() => handleHideUser(comment.author)} title="Hide user from channel">
                    <span className="material-symbols-outlined">block</span>
                  </button>
                </div>
              </div>

              <div className="comment-right">
                <div className="related-video-box">
                  <span className="related-video-title">{comment.videoTitle}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Comments;
