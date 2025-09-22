import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface DashboardStatsProps {
  totalClients: number;
  activePractices: number;
  whatsappMessages: number;
  todayAppointments: number;
  clientsChange: string;
  practicesChange: string;
  whatsappChange: string;
  appointmentsChange: string;
}

export const DashboardStats = ({
  totalClients,
  activePractices,
  whatsappMessages,
  todayAppointments,
  clientsChange,
  practicesChange,
  whatsappChange,
  appointmentsChange,
}: DashboardStatsProps) => {
  const stats = [
    {
      title: 'Clienti Totali',
      value: totalClients,
      change: clientsChange,
      icon: '👥',
      color: 'text-blue-600',
    },
    {
      title: 'Pratiche Attive',
      value: activePractices,
      change: practicesChange,
      icon: '📋',
      color: 'text-green-600',
    },
    {
      title: 'Messaggi WhatsApp',
      value: whatsappMessages,
      change: whatsappChange,
      icon: '💬',
      color: 'text-orange-600',
    },
    {
      title: 'Appuntamenti Oggi',
      value: todayAppointments,
      change: appointmentsChange,
      icon: '📅',
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {stat.title}
            </CardTitle>
            <span className="text-2xl">{stat.icon}</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className={`text-xs ${stat.color} font-medium`}>
              {stat.change} rispetto al mese scorso
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
