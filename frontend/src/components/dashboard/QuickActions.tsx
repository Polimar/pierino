import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  color: string;
  route: string;
}

interface QuickActionsProps {
  quickActions: QuickAction[];
}

export const QuickActions = ({ quickActions }: QuickActionsProps) => {
  const handleActionClick = (action: QuickAction) => {
    // Qui puoi implementare la navigazione o l'azione corrispondente
    console.log(`Azione cliccata: ${action.title} - Route: ${action.route}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          ⚡ Azioni Rapide
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2 hover:shadow-md transition-shadow"
              onClick={() => handleActionClick(action)}
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-sm font-medium">{action.title}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
