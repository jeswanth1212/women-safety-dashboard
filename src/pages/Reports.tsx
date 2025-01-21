import React, { useState, useEffect } from 'react';
import { FileText, Download, Filter, AlertTriangle, TrendingUp, Map, Activity, Camera, Phone, FileSearch } from 'lucide-react';
import axios from 'axios';
import { TextAnalyticsClient, AzureKeyCredential } from '@azure/ai-text-analytics';
import { ComputerVisionClient } from '@azure/cognitiveservices-computervision';
import { ApiKeyCredentials } from '@azure/ms-rest-js';
import { DocumentAnalysisClient } from '@azure/ai-form-recognizer';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import jsPDF from 'jspdf';

// Azure service configuration
const textAnalyticsClient = new TextAnalyticsClient(
  "https://language-women.cognitiveservices.azure.com/",
  new AzureKeyCredential("CLg1F9KxAiPdYLfVdhYJu7t0lQWdftqzgUK66nBoAzq7uBftEWxlJQQJ99BAACYeBjFXJ3w3AAAaACOGvJv3")
);

// Add your Computer Vision endpoint and key here
const computerVisionClient = new ComputerVisionClient(
  new ApiKeyCredentials({ 
    inHeader: { 
      'Ocp-Apim-Subscription-Key': "90ANAjr3pzEkiZEGqHb4RlHmjT6kexJ1p4Uwu2KNDGR0AyqK3FPuJQQJ99BAACYeBjFXJ3w3AAAFACOGwS4x"
    } 
  }),
  "https://comp-vision-women.cognitiveservices.azure.com/"
);

// Add your Form Recognizer endpoint and key here
const formRecognizerClient = new DocumentAnalysisClient(
  "https://docume-women.cognitiveservices.azure.com/",
  new AzureKeyCredential("3uxojE8jBmUFrqEm6TjNYtXKFLgpmM27TvZXRjZP9cBst11lPSIUJQQJ99BAACYeBjFXJ3w3AAALACOG9myu")
);

interface Alert {
  _id: string;
  message: string;
  timestamp: string;
  location: {
    latitude: number;
    longitude: number;
  };
  imageUrl?: string;
  audioUrl?: string;
}

interface VisualAnalysis {
  alertId: string;
  analysis: {
    objects?: { object: string }[];
    tags?: { name: string }[];
    description?: string;
  };
}

interface DocumentAnalysis {
  alertId: string;
  content: string;
  confidence: number;
}

interface AudioAnalysis {
  alertId: string;
  transcript: string;
  confidence: number;
  duration: number;
  language?: string;
}

interface AIInsight {
  type: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  details?: any;
}

const Reports = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'text' | 'visual' | 'audio' | 'documents'>('text');
  const [visualAnalytics, setVisualAnalytics] = useState<VisualAnalysis[]>([]);
  const [audioAnalytics, setAudioAnalytics] = useState<AudioAnalysis[]>([]);
  const [documentAnalytics, setDocumentAnalytics] = useState<DocumentAnalysis[]>([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    // For testing with public URLs
    const testAlert: Alert = {
      _id: 'test-1',
      message: 'Test alert with image and audio',
      timestamp: new Date().toISOString(),
      location: {
        latitude: 40.7128,
        longitude: -74.0060
      },
      imageUrl: 'https://raw.githubusercontent.com/Azure-Samples/cognitive-services-sample-data-files/master/ComputerVision/Images/landmark.jpg',
      audioUrl: '/audio/ohf.mp3'  // Using your MP3 file
    };
    
    setAlerts([testAlert]);
    Promise.all([
      generateTextInsights([testAlert]),
      generateVisualInsights([testAlert]),
      generateAudioInsights([testAlert]),
      generateDocumentInsights([testAlert])
    ]).finally(() => setLoading(false));
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/alerts');
      setAlerts(response.data);
      await Promise.all([
        generateTextInsights(response.data),
        generateVisualInsights(response.data),
        generateAudioInsights(response.data),
        generateDocumentInsights(response.data)
      ]);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTextInsights = async (alertsData: Alert[]) => {
    try {
      const messages = alertsData.map(alert => alert.message);
      const sentimentResults = await textAnalyticsClient.analyzeSentiment(messages);
      const keyPhraseResults = await textAnalyticsClient.extractKeyPhrases(messages);

      const newInsights: AIInsight[] = [
        {
          type: 'Average Sentiment',
          value: sentimentResults
            .filter(result => !result.error)
            .reduce((acc, curr) => {
              if ('sentiment' in curr) {
                return acc + (curr.confidenceScores.positive - curr.confidenceScores.negative);
              }
              return acc;
            }, 0) / sentimentResults.length,
          trend: 'stable',
          details: {
            positive: sentimentResults.filter(r => !r.error && 'sentiment' in r && r.confidenceScores.positive > 0.5).length,
            negative: sentimentResults.filter(r => !r.error && 'sentiment' in r && r.confidenceScores.negative > 0.5).length,
            neutral: sentimentResults.filter(r => !r.error && 'sentiment' in r && 
              r.confidenceScores.neutral > r.confidenceScores.positive && 
              r.confidenceScores.neutral > r.confidenceScores.negative).length
          }
        },
        {
          type: 'Key Themes',
          value: Array.from(new Set(
            keyPhraseResults
              .filter(result => !result.error)
              .flatMap(result => 'keyPhrases' in result ? result.keyPhrases : [])
          )).slice(0, 5).join(', ') || 'No themes detected',
          details: {
            totalThemes: keyPhraseResults
              .filter(result => !result.error)
              .reduce((acc, curr) => acc + ('keyPhrases' in curr ? curr.keyPhrases.length : 0), 0),
            uniqueThemes: Array.from(new Set(
              keyPhraseResults
                .filter(result => !result.error)
                .flatMap(result => 'keyPhrases' in result ? result.keyPhrases : [])
            )).length
          }
        }
      ];

      setInsights(newInsights);
    } catch (error) {
      console.error('Error analyzing text:', error);
    }
  };

  const generateVisualInsights = async (alertsData: Alert[]) => {
    try {
      const visualResults: VisualAnalysis[] = [];
      for (const alert of alertsData) {
        if (alert.imageUrl) {
          console.log('Analyzing image:', alert.imageUrl);
          try {
            const analysis = await computerVisionClient.analyzeImage(alert.imageUrl, {
              visualFeatures: ['Objects', 'Tags', 'Description'],
              language: 'en',
              modelVersion: 'latest'
            });
            
            console.log('Analysis result:', analysis);
            
            visualResults.push({
              alertId: alert._id,
              analysis: {
                objects: (analysis.objects || []).map(obj => ({ object: obj.object || 'Unknown Object' })),
                tags: (analysis.tags || []).map(tag => ({ name: tag.name || 'Unknown Tag' })),
                description: analysis.description?.captions?.[0]?.text || 'No description available'
              }
            });
          } catch (error: any) {
            console.error(`Error analyzing image ${alert.imageUrl}:`, error?.message || error);
            // Add the error to the results so we can show it in the UI
            visualResults.push({
              alertId: alert._id,
              analysis: {
                objects: [],
                tags: [],
                description: `Error analyzing image: ${error?.message || 'Unknown error'}`
              }
            });
          }
        }
      }
      setVisualAnalytics(visualResults);
    } catch (error: any) {
      console.error('Error in visual insights:', error?.message || error);
    }
  };

  const generateAudioInsights = async (alertsData: Alert[]) => {
    try {
      const audioResults: AudioAnalysis[] = [];
      
      for (const alert of alertsData) {
        if (alert.audioUrl) {
          try {
            // Fetch the audio file first to check if it exists
            const response = await fetch(alert.audioUrl, {
              headers: {
                'Accept': 'audio/mp3,audio/wav',
                'Content-Type': 'audio/mp3'
              }
            });
            
            if (!response.ok) {
              throw new Error(`Failed to fetch audio file: ${response.status} ${response.statusText}`);
            }
            
            const audioData = await response.arrayBuffer();
            if (!audioData || audioData.byteLength === 0) {
              throw new Error('Audio file is empty');
            }

            console.log('Successfully loaded audio file:', alert.audioUrl);
            console.log('Audio file size:', audioData.byteLength, 'bytes');

            // Configure speech recognition
            const speechConfig = sdk.SpeechConfig.fromSubscription(
              "F7c6bAu4aE3J8oMIoBjKngREoJhj3P9V5Ac5tFWfwBLzXfoe5U1fJQQJ99BAACYeBjFXJ3w3AAAYACOGH5W6",
              "eastus"
            );

            // Set up speech recognition options
            speechConfig.speechRecognitionLanguage = "en-US";
            speechConfig.setProperty(sdk.PropertyId.SpeechServiceResponse_ProfanityOption, "masked");
            speechConfig.outputFormat = sdk.OutputFormat.Detailed;
            
            // Create audio config from the fetched data
            const audioStream = sdk.AudioInputStream.createPushStream();
            const audioConfig = sdk.AudioConfig.fromStreamInput(audioStream);
            
            // Create speech recognizer
            const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
            
            console.log('Starting speech recognition...');

            // Push the audio data to the stream
            audioStream.write(new Uint8Array(audioData));
            audioStream.close();
            
            // Start recognition with timeout
            const result = await Promise.race([
              new Promise<sdk.SpeechRecognitionResult>((resolve, reject) => {
                recognizer.recognizeOnceAsync(
                  resolve,
                  error => {
                    console.error('Speech recognition error:', error);
                    reject(error);
                  }
                );
              }),
              new Promise<sdk.SpeechRecognitionResult>((_, reject) => 
                setTimeout(() => reject(new Error('Speech recognition timed out')), 30000)
              )
            ]) as sdk.SpeechRecognitionResult;

            console.log('Speech recognition completed:', result);

            // Parse the JSON response
            const jsonResult = result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult);
            let confidence = 0;
            let language = undefined;
            
            if (jsonResult) {
              try {
                const parsedJson = JSON.parse(jsonResult);
                confidence = parsedJson.NBest?.[0]?.Confidence ?? 0;
                language = parsedJson.Language;
              } catch (e) {
                console.error('Error parsing speech result JSON:', e);
              }
            }

            audioResults.push({
              alertId: alert._id,
              transcript: result.text || 'No transcript available',
              confidence: confidence,
              duration: result.duration ? parseFloat(result.duration.toString()) / 1e7 : 0,
              language: language
            });

            // Clean up
            recognizer.close();
          } catch (error: any) {
            console.error(`Error analyzing audio ${alert.audioUrl}:`, error?.message || error);
            audioResults.push({
              alertId: alert._id,
              transcript: `Error analyzing audio: ${error?.message || 'Unknown error'}`,
              confidence: 0,
              duration: 0
            });
          }
        }
      }
      
      setAudioAnalytics(audioResults);
    } catch (error: any) {
      console.error('Error in audio insights:', error?.message || error);
    }
  };

  const generateDocumentInsights = async (alertsData: Alert[]) => {
    try {
      const documentResults: DocumentAnalysis[] = [];
      for (const alert of alertsData) {
        if (alert.imageUrl) {
          try {
            const poller = await formRecognizerClient.beginAnalyzeDocument("prebuilt-document", alert.imageUrl);
            const result = await poller.pollUntilDone();
            
            if (result && result.content) {
              documentResults.push({
                alertId: alert._id,
                content: result.content,
                confidence: result.pages?.[0]?.words?.[0]?.confidence ?? 0
              });
            }
          } catch (error: any) {
            console.error(`Error analyzing document ${alert.imageUrl}:`, error?.message || error);
            documentResults.push({
              alertId: alert._id,
              content: `Error analyzing document: ${error?.message || 'Unknown error'}`,
              confidence: 0
            });
          }
        }
      }
      setDocumentAnalytics(documentResults);
    } catch (error: any) {
      console.error('Error in document insights:', error?.message || error);
    }
  };

  const generatePDF = () => {
    try {
      setGenerating(true);
      
      // Create a new PDF document
      const doc = new jsPDF();
      const timestamp = new Date().toLocaleString();
      const filename = `security-report-${new Date().toISOString().split('T')[0]}.pdf`;

      // Add title
      doc.setFontSize(20);
      doc.text('Security Analysis Report', 20, 20);
      
      // Add timestamp
      doc.setFontSize(12);
      doc.text(`Generated on: ${timestamp}`, 20, 30);
      
      // Add line
      doc.line(20, 35, 190, 35);
      
      // Add section headers
      doc.setFontSize(16);
      doc.text('Text Analysis', 20, 50);
      doc.text('Visual Analysis', 20, 100);
      doc.text('Audio Analysis', 20, 150);
      doc.text('Document Analysis', 20, 200);
      
      // Save the PDF
      doc.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">AI-Powered Analytics</h2>
        <div className="flex space-x-3">
          <button 
            onClick={fetchAlerts}
            disabled={loading}
            className={`flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Activity className="h-5 w-5 mr-2" />
            {loading ? 'Analyzing...' : 'Refresh Analytics'}
          </button>
          <button
            onClick={generatePDF}
            disabled={generating}
            className={`px-4 py-2 rounded-md text-white ${
              generating 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            } transition-colors duration-200`}
          >
            {generating ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </span>
            ) : (
              'Generate Report'
            )}
          </button>
        </div>
      </div>

      {/* Analytics Type Tabs */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex space-x-4 border-b">
          <button
            onClick={() => setActiveTab('text')}
            className={`pb-2 px-4 ${activeTab === 'text' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          >
            <FileText className="h-5 w-5 inline-block mr-2" />
            Text Analytics
          </button>
          <button
            onClick={() => setActiveTab('visual')}
            className={`pb-2 px-4 ${activeTab === 'visual' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          >
            <Camera className="h-5 w-5 inline-block mr-2" />
            Visual Analytics
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`pb-2 px-4 ${activeTab === 'audio' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          >
            <Phone className="h-5 w-5 inline-block mr-2" />
            Audio Analytics
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`pb-2 px-4 ${activeTab === 'documents' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          >
            <FileSearch className="h-5 w-5 inline-block mr-2" />
            Document Analytics
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'text' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {insights.map((insight, index) => (
                  <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">{insight.type}</h3>
                      {insight.trend && (
                        <span className={`${
                          insight.trend === 'up' ? 'text-red-500' :
                          insight.trend === 'down' ? 'text-green-500' :
                          'text-gray-500'
                        }`}>
                          <TrendingUp className="h-5 w-5" />
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-4">{insight.value}</p>
                    {insight.details && (
                      <div className="text-sm text-gray-600">
                        {insight.type === 'Average Sentiment' ? (
                          <div className="space-y-1">
                            <p>😊 Positive: {insight.details.positive}</p>
                            <p>😐 Neutral: {insight.details.neutral}</p>
                            <p>😟 Negative: {insight.details.negative}</p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p>Total Themes: {insight.details.totalThemes}</p>
                            <p>Unique Themes: {insight.details.uniqueThemes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Alert Message Analysis</h3>
                <div className="space-y-4">
                  {alerts.map((alert, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <p className="font-medium">{alert.message}</p>
                      <div className="mt-2 text-sm text-gray-600">
                        <p>Time: {new Date(alert.timestamp).toLocaleString()}</p>
                        <p>Location: {alert.location.latitude}, {alert.location.longitude}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'visual' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {visualAnalytics.map((analysis, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold mb-4">Image Analysis</h3>
                  {alerts.find(a => a._id === analysis.alertId)?.imageUrl && (
                    <img 
                      src={alerts.find(a => a._id === analysis.alertId)?.imageUrl} 
                      alt="Alert" 
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">Objects Detected:</h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {analysis.analysis.objects?.map((obj, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {obj.object}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium">Scene Tags:</h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {analysis.analysis.tags?.map((tag, i) => (
                          <span key={i} className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium">Description:</h4>
                      <p className="mt-1 text-gray-600">{analysis.analysis.description || 'No description available'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Audio Analysis Overview</h3>
                <p className="text-gray-600 mb-4">
                  Analyzing audio files for speech content, language, and patterns.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {audioAnalytics.map((analysis, index) => (
                  <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Audio Analysis #{index + 1}</h3>
                      <span className="text-sm text-gray-500">
                        {new Date().toLocaleTimeString()}
                      </span>
                    </div>

                    {alerts.find(a => a._id === analysis.alertId)?.audioUrl && (
                      <div className="mb-6">
                        <h4 className="font-medium mb-2">Audio Source:</h4>
                        <audio 
                          controls 
                          className="w-full"
                          src={alerts.find(a => a._id === analysis.alertId)?.audioUrl}
                        >
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium">Speech Transcript:</h4>
                        {analysis.transcript ? (
                          <div className="mt-2 p-3 bg-gray-50 rounded-md">
                            <p className="text-gray-700">{analysis.transcript}</p>
                          </div>
                        ) : (
                          <p className="text-gray-500 mt-1">No speech detected</p>
                        )}
                      </div>

                      <div>
                        <h4 className="font-medium">Confidence Score:</h4>
                        <div className="mt-2">
                          <div className="flex items-center">
                            <div className="flex-1">
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                                  style={{ width: `${Math.round(analysis.confidence * 100)}%` }}
                                ></div>
                              </div>
                            </div>
                            <span className="ml-3 text-sm text-gray-600">
                              {Math.round(analysis.confidence * 100)}%
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {analysis.confidence > 0.8 ? 'High confidence' : 
                             analysis.confidence > 0.5 ? 'Medium confidence' : 
                             'Low confidence'}
                          </p>
                        </div>
                      </div>

                      {analysis.language && (
                        <div>
                          <h4 className="font-medium">Detected Language:</h4>
                          <div className="mt-2 flex items-center">
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                              {analysis.language.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="font-medium">Duration:</h4>
                        <p className="mt-2 text-gray-700">
                          {analysis.duration.toFixed(2)} seconds
                        </p>
                      </div>

                      {analysis.transcript.includes('Error') && (
                        <div className="mt-4 p-4 bg-red-50 rounded-md">
                          <p className="text-red-700 text-sm">{analysis.transcript}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {documentAnalytics.map((analysis, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold mb-4">Document Analysis</h3>
                  {alerts.find(a => a._id === analysis.alertId)?.imageUrl && (
                    <img 
                      src={alerts.find(a => a._id === analysis.alertId)?.imageUrl} 
                      alt="Document" 
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">Extracted Text:</h4>
                      <p className="mt-1 text-gray-600 whitespace-pre-wrap">{analysis.content}</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Confidence Score:</h4>
                      <div className="mt-1 w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${Math.round(analysis.confidence * 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{Math.round(analysis.confidence * 100)}% confident</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Historical Reports Section */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Generated Reports</h3>
            <button className="flex items-center text-gray-600 hover:text-gray-900">
              <Filter className="h-5 w-5 mr-2" />
              Filter
            </button>
          </div>
          <div className="space-y-4">
            {[
              {
                id: 1,
                title: 'Emergency Response Analysis',
                date: new Date().toLocaleDateString(),
                type: 'AI Analysis',
                status: 'Generated'
              },
              {
                id: 2,
                title: 'Incident Location Analysis',
                date: new Date().toLocaleDateString(),
                type: 'Location Analysis',
                status: 'Generated'
              },
              {
                id: 3,
                title: 'Response Time Analytics',
                date: new Date().toLocaleDateString(),
                type: 'Performance Metrics',
                status: 'Processing'
              }
            ].map((report) => (
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