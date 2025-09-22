import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface UrgentActivity {
  id: string;
  title: string;
  description: string;
  priority: 'Alta' | 'Urgente' | 'Media';
  dueDate: string;
  type: 'deadline' | 'whatsapp' | 'completion';
}

interface UrgentActivitiesProps {
  urgentActivities: UrgentActivity[];
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'Urgente':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'Alta':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'Media':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getPriorityIcon = (type: string) => {
  switch (type) {
    case 'deadline':
      return '⏰';
    case 'whatsapp':
      return '💬';
    case 'completion':
      return '✅';
    default:
      return '⚠️';
  }
};

export const UrgentActivities = ({ urgentActivities }: UrgentActivitiesProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🚨 Attività Urgenti
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {urgentActivities.map((activity) => (
            <div key={activity.id} className="p-3 border rounded-lg hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{getPriorityIcon(activity.type)}</span>
                    <h4 className="font-medium text-sm">{activity.title}</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {activity.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(activity.priority)}`}>
                      {activity.priority}
                    </span>
                    <span className="text-xs text-gray-500">
                      Scadenza: {activity.dueDate}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
