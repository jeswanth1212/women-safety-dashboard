import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { AlertTriangle, MapPin, Clock, User, TrendingUp } from 'lucide-react';

interface Issue {
  id: string;
  description: string;
  latitude: number;
  longitude: number;
  location: string;
  timestamp: any;
  issueType?: string;
  reportedBy?: string;
  status?: string;
  severity?: string;
}

const Issues: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'reported' | 'investigating' | 'resolved'>('all');

  useEffect(() => {
    const issuesQuery = query(
      collection(db, 'issues'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(issuesQuery, (snapshot) => {
      const fetchedIssues: Issue[] = [];
      snapshot.forEach((doc) => {
        fetchedIssues.push({ id: doc.id, ...doc.data() } as Issue);
      });
      setIssues(fetchedIssues);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'reported':
        return 'bg-blue-100 text-blue-800';
      case 'investigating':
        return 'bg-purple-100 text-purple-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getIssueIcon = (issueType?: string) => {
    switch (issueType) {
      case 'harassment':
        return '⚠️';
      case 'assault':
        return '🚨';
      case 'theft':
        return '💰';
      case 'suspicious_activity':
        return '👁️';
      case 'vandalism':
        return '🔨';
      case 'infrastructure':
        return '🛠️';
      default:
        return '📋';
    }
  };

  const filteredIssues = filter === 'all' 
    ? issues 
    : issues.filter(issue => issue.status === filter);

  const stats = {
    total: issues.length,
    reported: issues.filter(i => i.status === 'reported').length,
    investigating: issues.filter(i => i.status === 'investigating').length,
    resolved: issues.filter(i => i.status === 'resolved').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading issues...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            Reported Issues
          </h1>
          <p className="text-gray-600 mt-2">
            User-reported safety concerns and incidents
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Issues</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.total}</p>
              </div>
              <div className="text-4xl">📋</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Reported</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.reported}</p>
              </div>
              <div className="text-4xl">🔔</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Investigating</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.investigating}</p>
              </div>
              <div className="text-4xl">🔍</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Resolved</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.resolved}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Issues
            </button>
            <button
              onClick={() => setFilter('reported')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'reported'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Reported
            </button>
            <button
              onClick={() => setFilter('investigating')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'investigating'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Investigating
            </button>
            <button
              onClick={() => setFilter('resolved')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'resolved'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Resolved
            </button>
          </div>
        </div>

        {/* Issues List */}
        {filteredIssues.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow-md text-center">
            <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No issues found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredIssues.map((issue) => (
              <div
                key={issue.id}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-blue-500"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Left Section */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="text-3xl">{getIssueIcon(issue.issueType)}</div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800 capitalize">
                          {issue.description}
                        </h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {issue.severity && (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(
                                issue.severity
                              )}`}
                            >
                              {issue.severity.toUpperCase()}
                            </span>
                          )}
                          {issue.status && (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                issue.status
                              )}`}
                            >
                              {issue.status.replace('_', ' ').toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4 text-red-500" />
                        <span className="text-sm">
                          <strong>Location:</strong> {issue.location}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">
                          <strong>Time:</strong>{' '}
                          {issue.timestamp?.toDate
                            ? issue.timestamp.toDate().toLocaleString()
                            : 'N/A'}
                        </span>
                      </div>

                      {issue.reportedBy && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="w-4 h-4 text-purple-500" />
                          <span className="text-sm">
                            <strong>Reported By:</strong> {issue.reportedBy}
                          </span>
                        </div>
                      )}

                      {issue.issueType && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span className="text-sm">
                            <strong>Type:</strong>{' '}
                            {issue.issueType.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Section - Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() =>
                        window.open(
                          `https://www.google.com/maps?q=${issue.latitude},${issue.longitude}`,
                          '_blank'
                        )
                      }
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm whitespace-nowrap"
                    >
                      View on Map 🗺️
                    </button>
                    {issue.status !== 'resolved' && (
                      <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm">
                        Take Action
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Issues;

