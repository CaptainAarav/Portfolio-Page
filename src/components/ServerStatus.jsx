import React, { useEffect, useRef, useState } from 'react';
import '../styles/components/ServerStatus.css';

const ServerStatus = () => {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // API URL - uses environment variable, or relative URL, or defaults to domain-based URL
  // Use relative URL if no env var is set, so it works both locally and in production
  const API_URL = process.env.REACT_APP_STATUS_API_URL || '/api/status';

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
      // Add timeout to prevent indefinite hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 3000); // 3 second timeout
      
      const response = await fetch(API_URL, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      
      setServices(data.services || []);
      setLastUpdated(data.lastUpdated);
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching statuses:', err);
      setError(`Failed to fetch service statuses: ${err.message}`);
      setLoading(false);
    }
  };

  // Poll every 60 seconds
  useEffect(() => {
    // Don't block page load - fetch in background after a short delay
    // This ensures the page renders first, then fetches data
    const initialFetchTimeout = setTimeout(() => {
      fetchStatuses(); // Initial fetch
    }, 500); // Delay to ensure page renders first
    
    const interval = setInterval(fetchStatuses, 60000); // Poll every 60 seconds
    
    return () => {
      clearTimeout(initialFetchTimeout);
      clearInterval(interval);
    };
  }, []);

  // Calculate overall uptime percentage
  const calculateOverallUptime = () => {
    if (services.length === 0) return 100;
    const onlineCount = services.filter(s => {
      if (s.status === 'online') return true;
      if (s.lastSeen) {
        const lastSeenDate = new Date(s.lastSeen);
        const secondsAgo = (Date.now() - lastSeenDate.getTime()) / 1000;
        return secondsAgo < 120; // Consider online if seen in last 2 minutes
      }
      return false;
    }).length;
    return Math.round((onlineCount / services.length) * 100);
  };

  // Calculate service uptime: online time / total existence time
  const calculateServiceUptime = (service) => {
    const isPortfolio = service.serviceId === 'captainaarav-dev' || service.serviceName === 'captainaarav.dev';
    if (isPortfolio) return 100; // Portfolio is always "online" if you're viewing it
    
    const statusInfo = getStatusInfo(service);
    const isCurrentlyOnline = statusInfo.isOnline;
    
    if (!service.lastSeen) {
      // No lastSeen means service never reported - assume 0% uptime
      return 0;
    }
    
    const lastSeenDate = new Date(service.lastSeen);
    const now = Date.now();
    const secondsSinceLastSeen = (now - lastSeenDate.getTime()) / 1000;
    const hoursSinceLastSeen = secondsSinceLastSeen / 3600;
    
    // Estimate total existence time: use lastSeen as proxy, assume service existed for at least that long
    // If seen recently, assume it's been running for at least 24 hours (or since lastSeen if longer)
    const totalExistenceHours = Math.max(24, hoursSinceLastSeen + 1);
    
    // Calculate online hours
    // If currently online and seen recently, assume it's been online for most of its existence
    if (isCurrentlyOnline) {
      if (secondsSinceLastSeen < 300) {
        // Seen in last 5 minutes - assume 99%+ uptime
        return Math.min(99.99, (totalExistenceHours - 0.1) / totalExistenceHours * 100);
      } else if (secondsSinceLastSeen < 3600) {
        // Seen in last hour - assume high uptime with small downtime
        const downtimeHours = secondsSinceLastSeen / 3600;
        return Math.max(0, ((totalExistenceHours - downtimeHours) / totalExistenceHours) * 100);
      } else {
        // Seen longer ago but still online - degrade uptime
        const downtimeHours = hoursSinceLastSeen;
        return Math.max(0, ((totalExistenceHours - downtimeHours) / totalExistenceHours) * 100);
      }
    } else {
      // Currently offline
      // Assume it was online until it went offline (lastSeen time)
      const onlineHours = Math.max(0, totalExistenceHours - hoursSinceLastSeen);
      return (onlineHours / totalExistenceHours) * 100;
    }
  };

  // Generate mock response time data for graph
  const generateMockResponseTimeData = (currentResponseTime) => {
    const data = [];
    const now = Date.now();
    const hours = ['11AM', '1PM', '3PM', '5PM', '7PM', '9PM'];
    
    for (let i = 0; i < 6; i++) {
      // Generate mock data with some variation around current response time
      const variation = (Math.random() - 0.5) * currentResponseTime * 0.3;
      const value = Math.max(0, currentResponseTime + variation);
      data.push({
        time: hours[i],
        value: Math.round(value)
      });
    }
    return data;
  };

  // Format time ago for LAST CHECK
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = Date.now();
    const secondsAgo = Math.floor((now - date.getTime()) / 1000);
    
    if (secondsAgo < 60) return `${secondsAgo}s ago`;
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
    if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`;
    return `${Math.floor(secondsAgo / 86400)}d ago`;
  };

  // Get status info
  const getStatusInfo = (service) => {
    const isPortfolio = service.serviceId === 'captainaarav-dev' || service.serviceName === 'captainaarav.dev';
    
    if (isPortfolio) {
      return { isOnline: true, badge: 'UP', icon: '✓' };
    }
    
    if (service.status === 'online') {
      return { isOnline: true, badge: 'UP', icon: '✓' };
    }
    
    if (service.lastSeen) {
      const lastSeenDate = new Date(service.lastSeen);
      const secondsAgo = (Date.now() - lastSeenDate.getTime()) / 1000;
      if (secondsAgo < 120) {
        return { isOnline: true, badge: 'UP', icon: '✓' };
      }
    }
    
    return { isOnline: false, badge: 'DOWN', icon: '✗' };
  };

  // Calculate overall stats
  const overallUptime = calculateOverallUptime();
  const onlineCount = services.filter(s => {
    const info = getStatusInfo(s);
    return info.isOnline;
  }).length;
  const activeIssues = services.length - onlineCount;
  const lastCheck = lastUpdated ? formatTimeAgo(lastUpdated) : 'Never';

  // Render uptime bar graph (horizontal squares) - each square represents an hour
  const renderUptimeBar = (service) => {
    const isPortfolio = service.serviceId === 'captainaarav-dev' || service.serviceName === 'captainaarav.dev';
    if (isPortfolio) {
      // Portfolio: all green squares
      return (
        <div className="uptime-bar">
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} className="uptime-square" style={{ backgroundColor: '#22c55e' }} />
          ))}
        </div>
      );
    }
    
    const statusInfo = getStatusInfo(service);
    const isCurrentlyOnline = statusInfo.isOnline;
    const squares = [];
    const totalSquares = 24; // 24 hours
    
    if (!service.lastSeen) {
      // No data - all red
      return (
        <div className="uptime-bar">
          {Array.from({ length: totalSquares }, (_, i) => (
            <div key={i} className="uptime-square" style={{ backgroundColor: '#ef4444' }} />
          ))}
        </div>
      );
    }
    
    const lastSeenDate = new Date(service.lastSeen);
    const now = Date.now();
    const hoursSinceLastSeen = (now - lastSeenDate.getTime()) / (1000 * 3600);
    
    // Generate hourly status for last 24 hours
    // Most recent hour (hour 0) = current status
    // Older hours = based on how long ago lastSeen was
    
    for (let i = 0; i < totalSquares; i++) {
      // i=0 is most recent hour, i=23 is 23 hours ago
      let color = '#ef4444'; // red (default: offline)
      
      if (i === 0) {
        // Current hour: use current status
        if (isCurrentlyOnline) {
          color = '#22c55e'; // green - online whole hour
        } else {
          // Currently offline - check if it was fixed this hour
          if (hoursSinceLastSeen < 1) {
            color = '#fbbf24'; // yellow - offline but might be fixed soon
          } else {
            color = '#ef4444'; // red - offline whole hour
          }
        }
      } else if (i < hoursSinceLastSeen) {
        // Hours ago when service was last seen
        // If currently online and lastSeen was recent, assume those hours were online
        if (isCurrentlyOnline && hoursSinceLastSeen < 2) {
          color = '#22c55e'; // green - was online
        } else {
          // Service went offline i hours ago
          if (i === Math.floor(hoursSinceLastSeen)) {
            color = '#fbbf24'; // yellow - went offline during this hour
          } else {
            color = '#ef4444'; // red - offline whole hour
          }
        }
      } else {
        // Hours before lastSeen - assume service was online
        if (isCurrentlyOnline) {
          color = '#22c55e'; // green - online
        } else {
          // Service is offline now, but was online before
          // Assume it was online until it went offline
          const hoursOffline = hoursSinceLastSeen;
          if (i < hoursOffline) {
            color = '#ef4444'; // red - offline
          } else {
            color = '#22c55e'; // green - was online
          }
        }
      }
      
      squares.push(
        <div
          key={i}
          className="uptime-square"
          style={{ backgroundColor: color }}
        />
      );
    }
    
    return <div className="uptime-bar">{squares}</div>;
  };

  // Render response time graph
  const renderResponseTimeGraph = (service) => {
    const responseTime = service.responseTime || 50;
    const data = generateMockResponseTimeData(responseTime);
    const maxValue = Math.max(...data.map(d => d.value), responseTime * 1.5);
    
    return (
      <div className="response-time-graph">
        <div className="graph-y-axis">
          {[maxValue, maxValue * 0.67, maxValue * 0.33, 0].map((val, idx) => (
            <span key={idx} className="y-axis-label">{Math.round(val)}ms</span>
          ))}
        </div>
        <div className="graph-area">
          <svg className="graph-svg" viewBox="0 0 300 80" preserveAspectRatio="none">
            <polyline
              points={data.map((d, idx) => `${(idx / (data.length - 1)) * 300},${80 - (d.value / maxValue) * 80}`).join(' ')}
              fill="none"
              stroke="white"
              strokeWidth="1.5"
            />
          </svg>
        </div>
        <div className="graph-x-axis">
          {data.map((d, idx) => (
            <span key={idx} className="x-axis-label">{d.time}</span>
          ))}
        </div>
      </div>
    );
  };

  // Render circular uptime gauge
  const renderUptimeGauge = (percentage) => {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    
    // Color logic: >75% green, 50-75% yellow, <50% red
    let gaugeColor = '#ef4444'; // red
    if (percentage > 75) {
      gaugeColor = '#22c55e'; // green
    } else if (percentage >= 50) {
      gaugeColor = '#fbbf24'; // yellow
    }
    
    return (
      <div className="uptime-gauge">
        <svg width="140" height="140" className="gauge-svg">
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="12"
          />
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={gaugeColor}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 70 70)"
          />
        </svg>
        <div className="gauge-text">{percentage}%</div>
      </div>
    );
  };

  return (
    <section id="server-status" className="server-status section" ref={sectionRef}>
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
                {/* Overall Status Card */}
                <div className="overall-status-card">
                  <div className="overall-status-left">
                    <h3 className="overall-status-title">
                      {activeIssues === 0 ? 'All systems operational' : `${onlineCount} systems operational`}
                    </h3>
                    <div className="overall-status-indicator">
                      <span className="status-circle status-circle-online"></span>
                      <span className="status-count">{onlineCount} UP</span>
                      {activeIssues > 0 && (
                        <>
                          <span className="status-circle status-circle-offline" style={{ marginLeft: '1rem' }}></span>
                          <span className="status-count">{activeIssues} DOWN</span>
                        </>
                      )}
                    </div>
                    <div className="overall-status-metrics">
                      <div className="status-metric">
                        <span className="metric-label">LAST CHECK</span>
                        <span className="metric-value">{lastCheck}</span>
                      </div>
                      <div className="status-metric">
                        <span className="metric-label">ACTIVE ISSUES</span>
                        <span className="metric-value">{activeIssues}</span>
                      </div>
                    </div>
                  </div>
                  <div className="overall-status-right">
                    {renderUptimeGauge(overallUptime)}
                  </div>
                  {lastUpdated && (
                    <div className="overall-status-footer">
                      Last updated: {new Date(lastUpdated).toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Individual Service Cards */}
                <div className="services-grid">
                  {services.map((service) => {
                    const isPortfolio = service.serviceId === 'captainaarav-dev' || service.serviceName === 'captainaarav.dev';
                    const statusInfo = getStatusInfo(service);
                    const uptime = calculateServiceUptime(service);
                    
                    if (isPortfolio) {
                      return (
                        <div key={service.serviceId} className="service-card">
                          <div className="service-header">
                            <div className="service-name-row">
                              <span className="service-icon service-icon-online">✓</span>
                              <h4 className="service-name">{service.serviceName}</h4>
                            </div>
                            <span className="service-badge service-badge-up">UP</span>
                          </div>
                          <div className="service-body">
                            <div className="service-custom-message">
                              <p>If you are reading this it is online, If you are not then it is offline</p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <div key={service.serviceId} className="service-card">
                        <div className="service-header">
                          <div className="service-name-row">
                            <span className={`service-icon ${statusInfo.isOnline ? 'service-icon-online' : 'service-icon-offline'}`}>
                              {statusInfo.icon}
                            </span>
                            <h4 className="service-name">{service.serviceName}</h4>
                          </div>
                          <span className={`service-badge ${statusInfo.isOnline ? 'service-badge-up' : 'service-badge-down'}`}>
                            {statusInfo.badge}
                          </span>
                        </div>
                        <div className="service-body">
                          <div className="service-uptime-section">
                            <div className="uptime-header">
                              <span className="uptime-label">Uptime</span>
                              <span className={`uptime-value ${uptime >= 99 ? 'uptime-excellent' : uptime >= 95 ? 'uptime-good' : 'uptime-poor'}`}>
                                {uptime.toFixed(2)}%
                              </span>
                            </div>
                            {renderUptimeBar(service)}
                          </div>
                          
                          {service.responseTime !== null && service.responseTime !== undefined && (
                            <div className="service-latency">
                              <span className="latency-label">Latency</span>
                              <span className="latency-value">{service.responseTime}ms</span>
                            </div>
                          )}
                          
                          {service.responseTime !== null && service.responseTime !== undefined && (
                            <div className="service-response-graph">
                              <div className="response-graph-label">Response Time</div>
                              {renderResponseTimeGraph(service)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default ServerStatus;
