import React from 'react';
import { HelpCircle, Book, MessageCircle, Phone } from 'lucide-react';

const Help = () => {
  const faqs = [
    {
      question: "How do I set up a new camera?",
      answer: "To set up a new camera, go to Settings > Camera Management and click 'Add New Camera'. Follow the step-by-step wizard to connect and configure your device."
    },
    {
      question: "What do I do when I receive an alert?",
      answer: "When you receive an alert, check the Alerts page for details. You can view the camera feed, assess the situation, and take appropriate action using the response options provided."
    },
    {
      question: "How can I customize alert notifications?",
      answer: "Navigate to Settings > Notifications to customize your alert preferences. You can set up email, SMS, or push notifications for different types of alerts."
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Help & Support</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full mr-4">
              <Book className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold">Documentation</h3>
          </div>
          <p className="text-gray-600 mb-4">Browse our detailed documentation for in-depth information about features.</p>
          <button className="text-blue-600 hover:text-blue-800">View Documentation →</button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-green-100 rounded-full mr-4">
              <MessageCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold">Live Chat</h3>
          </div>
          <p className="text-gray-600 mb-4">Chat with our support team for immediate assistance.</p>
          <button className="text-blue-600 hover:text-blue-800">Start Chat →</button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-purple-100 rounded-full mr-4">
              <Phone className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold">Phone Support</h3>
          </div>
          <p className="text-gray-600 mb-4">Call us for urgent issues or complex problems.</p>
          <button className="text-blue-600 hover:text-blue-800">Call Now →</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-6">Frequently Asked Questions</h3>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b last:border-0 pb-4 last:pb-0">
                <button className="flex justify-between items-center w-full text-left">
                  <span className="font-medium">{faq.question}</span>
                  <HelpCircle className="h-5 w-5 text-gray-400" />
                </button>
                <p className="mt-2 text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">Still need help?</h3>
            <p className="text-gray-600">Our support team is available 24/7 to assist you.</p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default Help;