import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Download, Calendar, Users, AlertTriangle, Clock, Brain, Shield, MapPin } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import jsPDF from 'jspdf';

interface AnalyticsData {
  id: string;
  period: 'daily' | 'weekly' | 'monthly';
  date: string;
  metrics: {
    totalAlerts: number;
    resolvedAlerts: number;
    avgResponseTime: string;
    activeUsers: number;
    newRegistrations: number;
    safeZonesAdded: number;
    dangerZonesAdded: number;
    incidentsByType: {
      harassment: number;
      theft: number;
      assault: number;
      stalking: number;
    };
    mostDangerousAreas: string[];
    safestRoutes: string[];
  };
  aiPredictions: {
    nextDayAlerts: number;
    highRiskAreas: string[];
    riskScore: number;
  };
}

const Analytics = () => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const analyticsQuery = collection(db, 'analytics');
    
    const unsubscribe = onSnapshot(analyticsQuery, (snapshot) => {
      const data: AnalyticsData[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as AnalyticsData);
      });
      
      // Sort by date
      data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setAnalyticsData(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredData = analyticsData.filter(d => d.period === period);
  const latestData = filteredData[filteredData.length - 1];

  // Prepare trend data for alerts over time
  const alertsTrendData = filteredData.slice(-15).map(d => ({
    date: d.period === 'daily' ? new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : d.date,
    Total: d.metrics.totalAlerts,
    Resolved: d.metrics.resolvedAlerts,
    Pending: d.metrics.totalAlerts - d.metrics.resolvedAlerts
  }));

  // Prepare user growth data
  const userGrowthData = filteredData.slice(-15).map(d => ({
    date: d.period === 'daily' ? new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : d.date,
    'Active Users': d.metrics.activeUsers,
    'New Registrations': d.metrics.newRegistrations
  }));

  // Prepare incidents by type data
  const incidentsData = latestData ? [
    { name: 'Harassment', value: latestData.metrics.incidentsByType.harassment, color: '#ef4444' },
    { name: 'Theft', value: latestData.metrics.incidentsByType.theft, color: '#f97316' },
    { name: 'Assault', value: latestData.metrics.incidentsByType.assault, color: '#dc2626' },
    { name: 'Stalking', value: latestData.metrics.incidentsByType.stalking, color: '#ea580c' }
  ] : [];

  // Prepare zones data
  const zonesData = filteredData.slice(-10).map(d => ({
    date: d.period === 'daily' ? new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : d.date,
    'Safe Zones': d.metrics.safeZonesAdded,
    'Danger Zones': d.metrics.dangerZonesAdded
  }));

  const generatePDFReport = () => {
    try {
      setGenerating(true);
      
      const doc = new jsPDF();
      const timestamp = new Date().toLocaleString();
      const filename = `analytics-report-${period}-${new Date().toISOString().split('T')[0]}.pdf`;

      // Header
      doc.setFontSize(22);
      doc.setTextColor(31, 41, 55);
      doc.text('Women Safety Analytics Report', 20, 20);
      
      doc.setFontSize(12);
      doc.setTextColor(107, 114, 128);
      doc.text(`Period: ${period.charAt(0).toUpperCase() + period.slice(1)}`, 20, 30);
      doc.text(`Generated: ${timestamp}`, 20, 36);
      
      doc.line(20, 42, 190, 42);

      if (latestData) {
        // Key Metrics Section
        doc.setFontSize(16);
        doc.setTextColor(31, 41, 55);
        doc.text('Key Metrics', 20, 52);
        
        doc.setFontSize(11);
        doc.setTextColor(55, 65, 81);
        let y = 62;
        doc.text(`Total Alerts: ${latestData.metrics.totalAlerts}`, 20, y);
        y += 7;
        doc.text(`Resolved Alerts: ${latestData.metrics.resolvedAlerts} (${((latestData.metrics.resolvedAlerts / latestData.metrics.totalAlerts) * 100).toFixed(1)}%)`, 20, y);
        y += 7;
        doc.text(`Average Response Time: ${latestData.metrics.avgResponseTime}`, 20, y);
        y += 7;
        doc.text(`Active Users: ${latestData.metrics.activeUsers.toLocaleString()}`, 20, y);
        y += 7;
        doc.text(`New Registrations: ${latestData.metrics.newRegistrations}`, 20, y);

        // Incidents Section
        doc.setFontSize(16);
        doc.setTextColor(31, 41, 55);
        doc.text('Incidents by Type', 20, y + 15);
        
        doc.setFontSize(11);
        doc.setTextColor(55, 65, 81);
        y += 25;
        doc.text(`Harassment: ${latestData.metrics.incidentsByType.harassment}`, 20, y);
        y += 7;
        doc.text(`Theft: ${latestData.metrics.incidentsByType.theft}`, 20, y);
        y += 7;
        doc.text(`Assault: ${latestData.metrics.incidentsByType.assault}`, 20, y);
        y += 7;
        doc.text(`Stalking: ${latestData.metrics.incidentsByType.stalking}`, 20, y);

        // AI Predictions Section
        doc.setFontSize(16);
        doc.setTextColor(31, 41, 55);
        doc.text('AI Predictions', 20, y + 15);
        
        doc.setFontSize(11);
        doc.setTextColor(55, 65, 81);
        y += 25;
        doc.text(`Predicted Next Period Alerts: ${latestData.aiPredictions.nextDayAlerts}`, 20, y);
        y += 7;
        doc.text(`AI Risk Score: ${(latestData.aiPredictions.riskScore * 100).toFixed(1)}%`, 20, y);
        y += 7;
        doc.text(`High-Risk Areas: ${latestData.aiPredictions.highRiskAreas.slice(0, 3).join(', ')}`, 20, y, { maxWidth: 170 });

        // Safety Zones
        y += 15;
        doc.setFontSize(16);
        doc.setTextColor(31, 41, 55);
        doc.text('Safety Zones', 20, y);
        
        doc.setFontSize(11);
        doc.setTextColor(55, 65, 81);
        y += 10;
        doc.text(`Safe Zones Added: ${latestData.metrics.safeZonesAdded}`, 20, y);
        y += 7;
        doc.text(`Danger Zones Added: ${latestData.metrics.dangerZonesAdded}`, 20, y);
      }

      // Footer
      doc.setFontSize(10);
      doc.setTextColor(156, 163, 175);
      doc.text('Generated by Women Safety Dashboard - DEFENSHE', 20, 280);
      
      doc.save(filename);
      window.alert('Report generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      window.alert('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const exportCSV = () => {
    if (!latestData) return;

    const csvData = [
      ['Women Safety Analytics Report'],
      [`Period: ${period}`],
      [`Date: ${latestData.date}`],
      [''],
      ['Metric', 'Value'],
      ['Total Alerts', latestData.metrics.totalAlerts],
      ['Resolved Alerts', latestData.metrics.resolvedAlerts],
      ['Average Response Time', latestData.metrics.avgResponseTime],
      ['Active Users', latestData.metrics.activeUsers],
      ['New Registrations', latestData.metrics.newRegistrations],
      ['Safe Zones Added', latestData.metrics.safeZonesAdded],
      ['Danger Zones Added', latestData.metrics.dangerZonesAdded],
      [''],
      ['Incidents by Type'],
      ['Harassment', latestData.metrics.incidentsByType.harassment],
      ['Theft', latestData.metrics.incidentsByType.theft],
      ['Assault', latestData.metrics.incidentsByType.assault],
      ['Stalking', latestData.metrics.incidentsByType.stalking],
      [''],
      ['AI Predictions'],
      ['Next Period Alerts', latestData.aiPredictions.nextDayAlerts],
      ['Risk Score', (latestData.aiPredictions.riskScore * 100).toFixed(1) + '%']
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            Analytics & Insights
          </h2>
          <p className="text-gray-600 mt-1">Comprehensive data analysis and reporting</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={generatePDFReport}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            {generating ? 'Generating...' : 'Generate PDF'}
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center gap-4">
          <Calendar className="h-5 w-5 text-gray-600" />
          <span className="font-medium text-gray-700">Time Period:</span>
          <div className="flex gap-2">
            {(['daily', 'weekly', 'monthly'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  period === p
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <span className="ml-auto text-sm text-gray-500">
            {filteredData.length} records found
          </span>
        </div>
      </div>

      {latestData && (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg shadow-md border-l-4 border-red-500">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <TrendingUp className="h-5 w-5 text-red-500" />
              </div>
              <p className="text-sm text-red-700 font-medium">Total Alerts</p>
              <p className="text-3xl font-bold text-red-900">{latestData.metrics.totalAlerts}</p>
              <p className="text-xs text-red-600 mt-1">
                {((latestData.metrics.resolvedAlerts / latestData.metrics.totalAlerts) * 100).toFixed(1)}% resolved
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg shadow-md border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-8 w-8 text-blue-600" />
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-sm text-blue-700 font-medium">Active Users</p>
              <p className="text-3xl font-bold text-blue-900">{latestData.metrics.activeUsers.toLocaleString()}</p>
              <p className="text-xs text-blue-600 mt-1">
                +{latestData.metrics.newRegistrations} new registrations
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg shadow-md border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-sm text-green-700 font-medium">Avg Response Time</p>
              <p className="text-3xl font-bold text-green-900">{latestData.metrics.avgResponseTime}</p>
              <p className="text-xs text-green-600 mt-1">
                {latestData.metrics.resolvedAlerts} alerts resolved
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg shadow-md border-l-4 border-purple-500">
              <div className="flex items-center justify-between mb-2">
                <Brain className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-sm text-purple-700 font-medium">AI Risk Score</p>
              <p className="text-3xl font-bold text-purple-900">
                {(latestData.aiPredictions.riskScore * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-purple-600 mt-1">
                Forecast: {latestData.aiPredictions.nextDayAlerts} alerts
              </p>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Alerts Trend */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Alerts Trend Over Time
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={alertsTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Total" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="Resolved" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="Pending" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* User Growth */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                User Growth
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="Active Users" stroke="#3b82f6" fill="#93c5fd" />
                  <Area type="monotone" dataKey="New Registrations" stroke="#10b981" fill="#86efac" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Incidents Distribution */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Incidents Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={incidentsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {incidentsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-3 mt-4">
                {incidentsData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm font-medium">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Safety Zones */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                Safety Zones Added
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={zonesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Safe Zones" fill="#22c55e" />
                  <Bar dataKey="Danger Zones" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* High-Risk Areas & Safest Routes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-700">
                <MapPin className="h-5 w-5" />
                High-Risk Areas
              </h3>
              <div className="space-y-3">
                {latestData.aiPredictions.highRiskAreas.map((area, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                    <div className="flex-shrink-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <span className="text-gray-800 font-medium">{area}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-700">
                <MapPin className="h-5 w-5" />
                Safest Routes
              </h3>
              <div className="space-y-3">
                {latestData.metrics.safestRoutes.slice(0, 5).map((route, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <span className="text-gray-800 font-medium">{route}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;


