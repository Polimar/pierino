import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface Activity {
  id: string;
  type: 'practice' | 'whatsapp' | 'appointment' | 'document';
  title: string;
  description: string;
  timeAgo: string;
  icon: string;
}

interface RecentActivitiesProps {
  activities: Activity[];
}

export const RecentActivities = ({ activities }: RecentActivitiesProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📊 Attività Recenti
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
              <span className="text-xl">{activity.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {activity.title}
                </p>
                <p className="text-sm text-gray-600">
                  {activity.description}
                </p>
              </div>
              <span className="text-xs text-gray-500">
                {activity.timeAgo}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
