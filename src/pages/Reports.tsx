import React from 'react';
import { FileText, Download, Filter } from 'lucide-react';

const Reports = () => {
  const reports = [
    {
      id: 1,
      title: 'Monthly Security Summary',
      date: 'March 2024',
      type: 'Monthly Report',
      status: 'Generated'
    },
    {
      id: 2,
      title: 'Incident Analysis',
      date: 'Last 7 Days',
      type: 'Weekly Report',
      status: 'Processing'
    },
    {
      id: 3,
      title: 'Camera Uptime Report',
      date: 'March 2024',
      type: 'System Health',
      status: 'Generated'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Reports</h2>
        <div className="flex space-x-3">
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <FileText className="h-5 w-5 mr-2" />
            Generate Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Total Reports</h3>
          <p className="text-3xl font-bold text-blue-600">24</p>
          <p className="text-sm text-gray-500">This month</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Processing</h3>
          <p className="text-3xl font-bold text-yellow-600">2</p>
          <p className="text-sm text-gray-500">Reports in queue</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Storage Used</h3>
          <p className="text-3xl font-bold text-green-600">1.2GB</p>
          <p className="text-sm text-gray-500">Of 5GB total</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Recent Reports</h3>
            <button className="flex items-center text-gray-600 hover:text-gray-900">
              <Filter className="h-5 w-5 mr-2" />
              Filter
            </button>
          </div>
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-50 rounded-lg mr-4">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{report.title}</h4>
                    <p className="text-sm text-gray-500">{report.date} • {report.type}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    report.status === 'Generated' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {report.status}
                  </span>
                  {report.status === 'Generated' && (
                    <button className="p-2 text-gray-500 hover:text-gray-700">
                      <Download className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;