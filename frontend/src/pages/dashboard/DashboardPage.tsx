import { Users, FileText, MessageSquare, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const stats = [
  {
    name: 'Clienti Totali',
    value: '142',
    change: '+4.75%',
    changeType: 'increase',
    icon: Users,
  },
  {
    name: 'Pratiche Attive',
    value: '58',
    change: '+2.15%',
    changeType: 'increase',
    icon: FileText,
  },
  {
    name: 'Messaggi WhatsApp',
    value: '23',
    change: '-1.25%',
    changeType: 'decrease',
    icon: MessageSquare,
  },
  {
    name: 'Appuntamenti Oggi',
    value: '6',
    change: '+3.20%',
    changeType: 'increase',
    icon: Calendar,
  },
];

const recentActivities = [
  {
    id: 1,
    type: 'practice',
    title: 'Nuova pratica SCIA - Mario Rossi',
    time: '2 ore fa',
    status: 'pending',
  },
  {
    id: 2,
    type: 'whatsapp',
    title: 'Messaggio WhatsApp - Anna Verdi',
    time: '4 ore fa',
    status: 'unread',
  },
  {
    id: 3,
    type: 'appointment',
    title: 'Appuntamento completato - Luca Bianchi',
    time: '6 ore fa',
    status: 'completed',
  },
  {
    id: 4,
    type: 'document',
    title: 'Documento caricato - Pratica #1234',
    time: '1 giorno fa',
    status: 'completed',
  },
];

const urgentTasks = [
  {
    id: 1,
    title: 'Scadenza pratica SCIA - Via Roma 123',
    dueDate: 'Domani',
    priority: 'high',
  },
  {
    id: 2,
    title: 'Rispondere a WhatsApp - Cliente Urgent',
    dueDate: 'Oggi',
    priority: 'urgent',
  },
  {
    id: 3,
    title: 'Completare APE - Appartamento Centro',
    dueDate: '3 giorni',
    priority: 'medium',
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Panoramica delle attività del tuo studio
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.changeType === 'increase' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        <TrendingUp className="h-4 w-4 flex-shrink-0 self-center" />
                        <span className="sr-only">
                          {stat.changeType === 'increase' ? 'Aumentato' : 'Diminuito'} di
                        </span>
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Attività Recenti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4">
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full ${
                    activity.status === 'pending' ? 'bg-yellow-400' :
                    activity.status === 'unread' ? 'bg-blue-400' :
                    'bg-green-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Urgent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              Attività Urgenti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {urgentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {task.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      Scadenza: {task.dueDate}
                    </p>
                  </div>
                  <div className={`flex-shrink-0 px-2 py-1 text-xs font-medium rounded-full ${
                    task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                    task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {task.priority === 'urgent' ? 'Urgente' :
                     task.priority === 'high' ? 'Alta' : 'Media'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Azioni Rapide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Users className="h-8 w-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium">Nuovo Cliente</span>
            </button>
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FileText className="h-8 w-8 text-green-600 mb-2" />
              <span className="text-sm font-medium">Nuova Pratica</span>
            </button>
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Calendar className="h-8 w-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium">Appuntamento</span>
            </button>
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <MessageSquare className="h-8 w-8 text-orange-600 mb-2" />
              <span className="text-sm font-medium">WhatsApp</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
