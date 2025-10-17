import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface Analytics {
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

// Generate dates for the last 30 days
const generateDates = (days: number): string[] => {
  const dates: string[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
};

// Generate realistic daily analytics
const generateDailyAnalytics = (date: string, dayIndex: number): Analytics => {
  // Add some variance for realism
  const baseAlerts = 40 + Math.floor(Math.random() * 20);
  const resolvedRate = 0.85 + Math.random() * 0.1;
  
  return {
    period: 'daily',
    date,
    metrics: {
      totalAlerts: baseAlerts,
      resolvedAlerts: Math.floor(baseAlerts * resolvedRate),
      avgResponseTime: `${(3 + Math.random() * 4).toFixed(1)} mins`,
      activeUsers: 1200 + Math.floor(Math.random() * 200),
      newRegistrations: 30 + Math.floor(Math.random() * 40),
      safeZonesAdded: Math.floor(Math.random() * 4),
      dangerZonesAdded: Math.floor(Math.random() * 3),
      incidentsByType: {
        harassment: Math.floor(baseAlerts * 0.4),
        theft: Math.floor(baseAlerts * 0.3),
        assault: Math.floor(baseAlerts * 0.15),
        stalking: Math.floor(baseAlerts * 0.15)
      },
      mostDangerousAreas: [
        'Parrys Corner - Late Night',
        'Guindy Industrial Area',
        'Beach Road - Evening'
      ],
      safestRoutes: [
        'Anna Salai Main Road',
        'Marina Beach Promenade',
        'T Nagar Shopping District'
      ]
    },
    aiPredictions: {
      nextDayAlerts: baseAlerts + Math.floor(Math.random() * 10 - 5),
      highRiskAreas: [
        'Parrys Corner - Late Night',
        'Guindy Industrial Area'
      ],
      riskScore: 0.6 + Math.random() * 0.3
    }
  };
};

// Generate weekly summary
const generateWeeklyAnalytics = (weekStartDate: string): Analytics => {
  return {
    period: 'weekly',
    date: weekStartDate,
    metrics: {
      totalAlerts: 315,
      resolvedAlerts: 285,
      avgResponseTime: '4.2 mins',
      activeUsers: 8500,
      newRegistrations: 245,
      safeZonesAdded: 12,
      dangerZonesAdded: 8,
      incidentsByType: {
        harassment: 135,
        theft: 95,
        assault: 45,
        stalking: 40
      },
      mostDangerousAreas: [
        'Parrys Corner - Late Night',
        'Guindy Industrial Area',
        'Beach Road - Evening',
        'Adyar Back Streets'
      ],
      safestRoutes: [
        'Anna Salai Main Road',
        'Marina Beach Promenade',
        'T Nagar Shopping District',
        'Velachery Main Road'
      ]
    },
    aiPredictions: {
      nextDayAlerts: 48,
      highRiskAreas: [
        'Parrys Corner - Late Night',
        'Guindy Industrial Area',
        'Ambattur Industrial Estate'
      ],
      riskScore: 0.72
    }
  };
};

// Generate monthly summary
const generateMonthlyAnalytics = (monthDate: string): Analytics => {
  return {
    period: 'monthly',
    date: monthDate,
    metrics: {
      totalAlerts: 1350,
      resolvedAlerts: 1215,
      avgResponseTime: '4.5 mins',
      activeUsers: 35000,
      newRegistrations: 1050,
      safeZonesAdded: 45,
      dangerZonesAdded: 32,
      incidentsByType: {
        harassment: 580,
        theft: 405,
        assault: 190,
        stalking: 175
      },
      mostDangerousAreas: [
        'Parrys Corner - Late Night',
        'Guindy Industrial Area',
        'Beach Road - Evening',
        'Adyar Back Streets',
        'Ambattur Industrial Estate'
      ],
      safestRoutes: [
        'Anna Salai Main Road',
        'Marina Beach Promenade',
        'T Nagar Shopping District',
        'Velachery Main Road',
        'Mylapore Temple Area'
      ]
    },
    aiPredictions: {
      nextDayAlerts: 45,
      highRiskAreas: [
        'Parrys Corner - Late Night',
        'Guindy Industrial Area',
        'Beach Road - Evening'
      ],
      riskScore: 0.68
    }
  };
};

export const seedAnalytics = async (): Promise<void> => {
  try {
    const analyticsRef = collection(db, 'analytics');
    const snapshot = await getDocs(analyticsRef);

    if (snapshot.empty) {
      console.log('No analytics found. Seeding analytics data...');
      
      // Generate last 30 days of daily analytics
      const dates = generateDates(30);
      for (let i = 0; i < dates.length; i++) {
        const dailyData = generateDailyAnalytics(dates[i], i);
        await addDoc(analyticsRef, {
          ...dailyData,
          createdAt: new Date(dates[i])
        });
      }
      console.log('✅ Seeded 30 days of daily analytics');

      // Add 4 weekly summaries
      const weekDates = generateDates(28).filter((_, i) => i % 7 === 0);
      for (const weekDate of weekDates) {
        const weeklyData = generateWeeklyAnalytics(weekDate);
        await addDoc(analyticsRef, {
          ...weeklyData,
          createdAt: new Date(weekDate)
        });
      }
      console.log('✅ Seeded 4 weeks of weekly analytics');

      // Add monthly summary
      const monthDate = new Date();
      monthDate.setDate(1); // First day of current month
      const monthlyData = generateMonthlyAnalytics(monthDate.toISOString().split('T')[0]);
      await addDoc(analyticsRef, {
        ...monthlyData,
        createdAt: monthDate
      });
      console.log('✅ Seeded monthly analytics');

      console.log(`🎉 Successfully seeded analytics data!`);
    } else {
      console.log(`ℹ️ Analytics already exist (${snapshot.size} records found). Skipping seed.`);
    }
  } catch (error) {
    console.error('Error seeding analytics:', error);
  }
};

export default seedAnalytics;


