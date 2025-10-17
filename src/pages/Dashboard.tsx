import React, { useState, useEffect } from 'react';
import { AlertTriangle, Users, CheckCircle, AlertOctagon, LucideIcon, Camera, TrendingUp, TrendingDown, Clock, Brain } from 'lucide-react';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { seedAnalytics } from '../utils/seedAnalytics';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color: string;
}

interface Alert {
  id: string;
  name: string;
  phoneNumber: string;
  timestamp: any;
  status: 'pending' | 'resolved';
}

interface ResponseTeam {
  id: string;
  teamName: string;
  teamType: 'police' | 'medical' | 'fire' | 'rescue';
  currentStatus: 'available' | 'busy' | 'offline';
}

const StatCard = ({ icon: Icon, label, value, color }: StatCardProps) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <div className="flex items-center">
      <div className={`p-3 rounded-full ${color} bg-opacity-10 mr-4`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <div>
        <p className="text-gray-500 text-sm">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
    </div>
  </div>
);

interface AnalyticsData {
  period: string;
  date: string;
  metrics: {
    totalAlerts: number;
    resolvedAlerts: number;
    avgResponseTime: string;
    activeUsers: number;
    newRegistrations: number;
    incidentsByType: {
      harassment: number;
      theft: number;
      assault: number;
      stalking: number;
    };
  };
  aiPredictions: {
    nextDayAlerts: number;
    highRiskAreas: string[];
    riskScore: number;
  };
}

const Dashboard = () => {
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [pendingAlerts, setPendingAlerts] = useState(0);
  const [resolvedAlerts, setResolvedAlerts] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [todayAnalytics, setTodayAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [responseTeams, setResponseTeams] = useState<ResponseTeam[]>([]);
  const [teamStats, setTeamStats] = useState({
    total: 0,
    available: 0,
    busy: 0,
    offline: 0
  });

  // Seed analytics on first load
  useEffect(() => {
    seedAnalytics();
  }, []);

  useEffect(() => {
    // Fetch all alerts
    const alertsQuery = collection(db, 'sos');
    const unsubscribeAlerts = onSnapshot(alertsQuery, (snapshot) => {
      const alerts: Alert[] = [];
      let pending = 0;
      let resolved = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const alert: Alert = {
          id: doc.id,
          name: data.name || 'Unknown',
          phoneNumber: data.phoneNumber || '',
          timestamp: data.timestamp,
          status: data.status || 'pending'
        };
        alerts.push(alert);

        if (alert.status === 'pending') {
          pending++;
        } else if (alert.status === 'resolved') {
          resolved++;
        }
      });

      setTotalAlerts(alerts.length);
      setPendingAlerts(pending);
      setResolvedAlerts(resolved);

      // Get 4 most recent pending alerts
      const recent = alerts
        .filter(a => a.status === 'pending')
        .sort((a, b) => {
          const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
          const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
          return timeB - timeA;
        })
        .slice(0, 4);
      setRecentAlerts(recent);
      setLoading(false);
    });

    // Fetch total users
    const usersQuery = collection(db, 'users');
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      setTotalUsers(snapshot.size);
    });

    // Fetch response teams
    const teamsQuery = collection(db, 'responseTeams');
    const unsubscribeTeams = onSnapshot(teamsQuery, (snapshot) => {
      const teams: ResponseTeam[] = [];
      let available = 0;
      let busy = 0;
      let offline = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const team: ResponseTeam = {
          id: doc.id,
          teamName: data.teamName,
          teamType: data.teamType,
          currentStatus: data.currentStatus
        };
        teams.push(team);

        if (team.currentStatus === 'available') available++;
        else if (team.currentStatus === 'busy') busy++;
        else if (team.currentStatus === 'offline') offline++;
      });

      setResponseTeams(teams);
      setTeamStats({
        total: teams.length,
        available,
        busy,
        offline
      });
    });

    // Fetch today's analytics
    const analyticsQuery = collection(db, 'analytics');
    const unsubscribeAnalytics = onSnapshot(analyticsQuery, (snapshot) => {
      const analyticsData: any[] = [];
      snapshot.forEach((doc) => {
        analyticsData.push({ id: doc.id, ...doc.data() });
      });
      
      // Get most recent daily analytics
      const dailyAnalytics = analyticsData
        .filter(a => a.period === 'daily')
        .sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateB - dateA;
        });
      
      if (dailyAnalytics.length > 0) {
        setTodayAnalytics(dailyAnalytics[0]);
      }
    });

    return () => {
      unsubscribeAlerts();
      unsubscribeUsers();
      unsubscribeTeams();
      unsubscribeAnalytics();
    };
  }, []);

  const stats = [
    {
      icon: AlertOctagon,
      label: 'Pending Alerts',
      value: pendingAlerts,
      color: 'text-red-600',
    },
    {
      icon: CheckCircle,
      label: 'Resolved Alerts',
      value: resolvedAlerts,
      color: 'text-green-600',
    },
    {
      icon: AlertTriangle,
      label: 'Total Alerts',
      value: totalAlerts,
      color: 'text-yellow-600',
    },
    {
      icon: Users,
      label: 'Registered Users',
      value: totalUsers,
      color: 'text-blue-600',
    },
  ];

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Unknown time';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Dashboard Overview</h2>
        <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
          <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-gray-700">Real-time Updates</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Recent SOS Alerts</h3>
            <button 
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              onClick={() => window.location.href='/alerts'}
            >
              View All →
              </button>
            </div>
          <div className="space-y-3">
            {recentAlerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No pending alerts
              </div>
            ) : (
              recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between border-b pb-3 bg-red-50 p-4 rounded-lg">
              <div className="flex items-center">
                    <AlertOctagon className="h-5 w-5 text-red-500 mr-3" />
                <div>
                      <p className="font-medium text-gray-800">{alert.name}</p>
                      <p className="text-sm text-gray-600">{alert.phoneNumber}</p>
                      <p className="text-xs text-gray-500">{formatTimestamp(alert.timestamp)}</p>
                </div>
              </div>
                  <button 
                    className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm hover:bg-blue-600 transition-colors"
                    onClick={() => window.location.href='/alerts'}
                  >
                View
              </button>
            </div>
              ))
            )}
                </div>
              </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">System Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-green-600" />
                <span className="font-medium">Camera Monitoring</span>
              </div>
              <span className="text-green-600 font-semibold">Active</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="font-medium">Pending Alerts</span>
              </div>
              <span className="text-yellow-600 font-semibold">{pendingAlerts}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium">Resolved Alerts</span>
              </div>
              <span className="text-green-600 font-semibold">{resolvedAlerts}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Active Users</span>
              </div>
              <span className="text-blue-600 font-semibold">{totalUsers}</span>
            </div>
                </div>
              </div>

        {/* Response Teams Panel */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">🚓</span>
            Response Teams Status
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <div className="text-2xl">👥</div>
                <span className="font-medium">Total Teams</span>
              </div>
              <span className="text-blue-600 font-bold text-xl">{teamStats.total}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <div className="text-xl">🟢</div>
                <span className="font-medium">Available</span>
              </div>
              <span className="text-green-600 font-bold text-xl">{teamStats.available}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2">
                <div className="text-xl">🟡</div>
                <span className="font-medium">Busy</span>
              </div>
              <span className="text-yellow-600 font-bold text-xl">{teamStats.busy}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg border border-gray-300">
              <div className="flex items-center gap-2">
                <div className="text-xl">⚫</div>
                <span className="font-medium">Offline</span>
              </div>
              <span className="text-gray-600 font-bold text-xl">{teamStats.offline}</span>
            </div>
            <button 
              className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              onClick={() => window.location.href='/maps'}
            >
              View Teams on Map →
              </button>
            </div>
          </div>
        </div>

      {/* Analytics Section */}
      {todayAnalytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Incidents by Type Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Today's Incidents by Type
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Harassment', value: todayAnalytics.metrics.incidentsByType.harassment, color: '#ef4444' },
                    { name: 'Theft', value: todayAnalytics.metrics.incidentsByType.theft, color: '#f97316' },
                    { name: 'Assault', value: todayAnalytics.metrics.incidentsByType.assault, color: '#dc2626' },
                    { name: 'Stalking', value: todayAnalytics.metrics.incidentsByType.stalking, color: '#ea580c' }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[
                    { name: 'Harassment', value: todayAnalytics.metrics.incidentsByType.harassment, color: '#ef4444' },
                    { name: 'Theft', value: todayAnalytics.metrics.incidentsByType.theft, color: '#f97316' },
                    { name: 'Assault', value: todayAnalytics.metrics.incidentsByType.assault, color: '#dc2626' },
                    { name: 'Stalking', value: todayAnalytics.metrics.incidentsByType.stalking, color: '#ea580c' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div>
                  <p className="text-xs text-gray-600">Harassment</p>
                  <p className="font-semibold text-sm">{todayAnalytics.metrics.incidentsByType.harassment}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <div>
                  <p className="text-xs text-gray-600">Theft</p>
                  <p className="font-semibold text-sm">{todayAnalytics.metrics.incidentsByType.theft}</p>
                </div>
            </div>
              <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                <div className="w-3 h-3 rounded-full bg-red-600"></div>
                <div>
                  <p className="text-xs text-gray-600">Assault</p>
                  <p className="font-semibold text-sm">{todayAnalytics.metrics.incidentsByType.assault}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
                <div className="w-3 h-3 rounded-full bg-orange-600"></div>
                <div>
                  <p className="text-xs text-gray-600">Stalking</p>
                  <p className="font-semibold text-sm">{todayAnalytics.metrics.incidentsByType.stalking}</p>
                </div>
            </div>
          </div>
        </div>

          {/* AI Predictions Panel */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-lg shadow-md border-2 border-purple-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-purple-800">
              <Brain className="h-5 w-5" />
              AI Predictions & Insights
            </h3>
          <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Tomorrow's Forecast</span>
                  {todayAnalytics.aiPredictions.nextDayAlerts > todayAnalytics.metrics.totalAlerts ? (
                    <TrendingUp className="h-5 w-5 text-red-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-green-500" />
                  )}
                </div>
                <p className="text-2xl font-bold text-gray-800">{todayAnalytics.aiPredictions.nextDayAlerts} alerts</p>
                <p className="text-xs text-gray-500 mt-1">
                  {todayAnalytics.aiPredictions.nextDayAlerts > todayAnalytics.metrics.totalAlerts 
                    ? `↑ ${todayAnalytics.aiPredictions.nextDayAlerts - todayAnalytics.metrics.totalAlerts} more than today`
                    : `↓ ${todayAnalytics.metrics.totalAlerts - todayAnalytics.aiPredictions.nextDayAlerts} less than today`
                  }
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-600">Avg Response Time</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{todayAnalytics.metrics.avgResponseTime}</p>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <span className="text-sm font-medium text-gray-600 block mb-2">High-Risk Areas</span>
                <div className="space-y-2">
                  {todayAnalytics.aiPredictions.highRiskAreas.slice(0, 3).map((area, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span className="text-gray-700 truncate">{area}</span>
                    </div>
                  ))}
                </div>
            </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <span className="text-sm font-medium text-gray-600 block mb-2">AI Risk Score</span>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        todayAnalytics.aiPredictions.riskScore > 0.7 ? 'bg-red-500' :
                        todayAnalytics.aiPredictions.riskScore > 0.4 ? 'bg-orange-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${todayAnalytics.aiPredictions.riskScore * 100}%` }}
                    ></div>
            </div>
                  <span className="text-lg font-bold text-gray-800">
                    {(todayAnalytics.aiPredictions.riskScore * 100).toFixed(0)}%
                  </span>
            </div>
                <p className="text-xs text-gray-500 mt-1">
                  {todayAnalytics.aiPredictions.riskScore > 0.7 ? '🔴 High Risk' :
                   todayAnalytics.aiPredictions.riskScore > 0.4 ? '🟠 Medium Risk' :
                   '🟢 Low Risk'}
                </p>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default Dashboard;