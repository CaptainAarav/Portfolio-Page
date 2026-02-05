import React, { useEffect, useRef, useState } from 'react';
import silhouette1 from '../assets/silhouette1.png';
import silhouette2 from '../assets/silhouette2.png';
import '../styles/components/ServerStatus.css';

const ServerStatus = () => {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // API URL - uses environment variable or defaults to domain-based URL
  // For local development, set REACT_APP_STATUS_API_URL=http://localhost:3001/api/status
  const API_URL = process.env.REACT_APP_STATUS_API_URL || 'https://captainaarav.dev/api/status';

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = sectionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  // Fetch service statuses
  const fetchStatuses = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setServices(data.services || []);
      setLastUpdated(data.lastUpdated);
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching statuses:', err);
      setError('Failed to fetch service statuses');
      setLoading(false);
    }
  };

  // Poll every 60 seconds
  useEffect(() => {
    fetchStatuses(); // Initial fetch
    
    const interval = setInterval(fetchStatuses, 60000); // Poll every 60 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Get status badge class
  const getStatusClass = (status) => {
    return status === 'online' ? 'status-online' : 'status-offline';
  };

  // Get status text
  const getStatusText = (status) => {
    return status === 'online' ? 'Online' : 'Offline';
  };

  // Get service type icon/badge
  const getServiceTypeBadge = (type) => {
    const badges = {
      'game-server': '🎮',
      'discord-bot': '🤖',
      'website': '🌐'
    };
    return badges[type] || '📡';
  };

  // Format last seen time
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const secondsAgo = Math.floor((now - date) / 1000);
    
    if (secondsAgo < 60) return 'Just now';
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
    if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`;
    return `${Math.floor(secondsAgo / 86400)}d ago`;
  };

  // Group services by type
  const groupedServices = {
    'game-server': services.filter(s => s.serviceType === 'game-server'),
    'discord-bot': services.filter(s => s.serviceType === 'discord-bot'),
    'website': services.filter(s => s.serviceType === 'website')
  };

  const typeLabels = {
    'game-server': 'Game Servers',
    'discord-bot': 'Discord Bots',
    'website': 'Websites'
  };

  return (
    <section id="server-status" className="server-status section" ref={sectionRef}>
      <img src={silhouette1} alt="" className="section-silhouette section-silhouette-9" />
      <img src={silhouette2} alt="" className="section-silhouette section-silhouette-10" />
      <div className="container">
        <h2 className="section-title">Server Status</h2>
        
        {error && (
          <div className="status-error">
            <p>{error}</p>
            <button onClick={fetchStatuses} className="btn-retry">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="status-loading">
            <p>Loading service statuses...</p>
          </div>
        ) : (
          <div className={`status-content ${isVisible ? 'visible' : ''}`}>
            {services.length === 0 ? (
              <div className="status-empty">
                <p>No services configured yet.</p>
                <p className="status-empty-hint">Services will appear here once they start reporting their status.</p>
              </div>
            ) : (
              <>
                {Object.keys(groupedServices).map((type) => {
                  if (groupedServices[type].length === 0) return null;
                  
                  return (
                    <div key={type} className="status-group">
                      <h3 className="status-group-title">
                        <span className="status-group-icon">{getServiceTypeBadge(type)}</span>
                        {typeLabels[type]}
                      </h3>
                      <div className="status-grid">
                        {groupedServices[type].map((service, index) => (
                          <div
                            key={service.serviceId}
                            className="status-card glass"
                            style={{
                              animationDelay: `${index * 0.1}s`
                            }}
                          >
                            <div className="status-card-header">
                              <h4 className="status-card-name">{service.serviceName}</h4>
                              <span className={`status-badge ${getStatusClass(service.status)}`}>
                                {getStatusText(service.status)}
                              </span>
                            </div>
                            
                            <div className="status-card-body">
                              <div className="status-info-row">
                                <span className="status-label">Last Seen:</span>
                                <span className="status-value">{formatLastSeen(service.lastSeen)}</span>
                              </div>
                              
                              {service.responseTime !== null && service.responseTime !== undefined && (
                                <div className="status-info-row">
                                  <span className="status-label">Response Time:</span>
                                  <span className="status-value">{service.responseTime}ms</span>
                                </div>
                              )}
                              
                              {service.uptime !== null && service.uptime !== undefined && (
                                <div className="status-info-row">
                                  <span className="status-label">Uptime:</span>
                                  <span className="status-value">{service.uptime.toFixed(1)}%</span>
                                </div>
                              )}
                              
                              {service.details && Object.keys(service.details).length > 0 && (
                                <div className="status-details">
                                  {/* RAM Usage Meter */}
                                  {service.details.ramUsage !== undefined && (
                                    <div className="status-meter">
                                      <div className="status-meter-header">
                                        <span className="status-detail-label">RAM Usage:</span>
                                        <span className="status-detail-value">
                                          {service.details.ramUsage > 100 
                                            ? `${service.details.ramUsage.toFixed(0)} MB` 
                                            : `${service.details.ramUsage.toFixed(1)}%`}
                                        </span>
                                      </div>
                                      <div className="status-meter-bar">
                                        <div 
                                          className="status-meter-fill status-meter-ram"
                                          style={{ 
                                            width: service.details.ramUsage > 100 
                                              ? `${Math.min(100, (service.details.ramUsage / 2048) * 100)}%` // Assume 2GB = 100%, adjust as needed
                                              : `${Math.min(100, service.details.ramUsage)}%` 
                                          }}
                                        ></div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* CPU Usage Meter */}
                                  {service.details.cpuUsage !== undefined && (
                                    <div className="status-meter">
                                      <div className="status-meter-header">
                                        <span className="status-detail-label">CPU Usage:</span>
                                        <span className="status-detail-value">{service.details.cpuUsage.toFixed(1)}%</span>
                                      </div>
                                      <div className="status-meter-bar">
                                        <div 
                                          className="status-meter-fill status-meter-cpu"
                                          style={{ width: `${Math.min(100, service.details.cpuUsage)}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {service.details.players !== undefined && (
                                    <div className="status-detail-item">
                                      <span className="status-detail-label">Players:</span>
                                      <span className="status-detail-value">
                                        {service.details.players}
                                        {service.details.maxPlayers && ` / ${service.details.maxPlayers}`}
                                      </span>
                                    </div>
                                  )}
                                  {service.details.version && (
                                    <div className="status-detail-item">
                                      <span className="status-detail-label">Version:</span>
                                      <span className="status-detail-value">{service.details.version}</span>
                                    </div>
                                  )}
                                  {service.details.guilds !== undefined && (
                                    <div className="status-detail-item">
                                      <span className="status-detail-label">Guilds:</span>
                                      <span className="status-detail-value">{service.details.guilds}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <div className="status-indicator">
                              <div className={`status-dot ${getStatusClass(service.status)}`}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                
                {lastUpdated && (
                  <div className="status-footer">
                    <p className="status-last-updated">
                      Last updated: {new Date(lastUpdated).toLocaleTimeString()}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default ServerStatus;
