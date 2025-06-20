
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MessageCircle, Eye, Edit, Trash2, Clock } from '@/components/ui/icons';

interface BudgetCardProps {
  budget: any;
  profile: any;
  isGenerating: boolean;
  onShareWhatsApp: (budget: any) => void;
  onViewPDF: (budget: any) => void;
  onEdit: (budget: any) => void;
  onDelete: (budget: any) => void;
}

const isBudgetOld = (createdAt: string, warningDays: number | undefined | null): boolean => {
  if (!createdAt || !warningDays) return false;
  const now = new Date();
  const budgetDate = new Date(createdAt);
  const diffTime = now.getTime() - budgetDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > warningDays;
};

export const BudgetCard = ({
  budget,
  profile,
  isGenerating,
  onShareWhatsApp,
  onViewPDF,
  onEdit,
  onDelete
}: BudgetCardProps) => {
  return (
    <div className="glass-card border border-white/10 rounded-2xl p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.01] animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-semibold text-base text-foreground">{budget.device_model}</h3>
            <Badge variant="secondary" className="text-xs bg-muted/50">
              {budget.device_type}
            </Badge>
          </div>
          {budget.client_name && <p className="text-sm text-muted-foreground mb-1">{budget.client_name}</p>}
          <p className="text-sm text-muted-foreground">{budget.issue}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg text-foreground">
            R$ {((budget.total_price || 0) / 100).toLocaleString('pt-BR', {
              minimumFractionDigits: 2
            })}
          </p>
          <div className="flex items-center">
            <p className="text-xs text-muted-foreground">
              {new Date(budget.created_at).toLocaleDateString('pt-BR')}
            </p>
            {profile?.budget_warning_enabled && isBudgetOld(budget.created_at, profile.budget_warning_days) && (
              <Badge variant="destructive" className="text-xs ml-2 animate-pulse p-1 h-auto">
                <Clock className="h-3 w-3 mr-1" />
                Antigo
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onShareWhatsApp(budget)} 
            className="h-10 w-10 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950 rounded-xl"
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onViewPDF(budget)} 
            disabled={isGenerating} 
            className="h-10 w-10 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-xl"
          >
            <Eye className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onEdit(budget)} 
            className="h-10 w-10 p-0 hover:bg-muted/20 hover:text-[#fec832] rounded-xl"
          >
            <Edit className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onDelete(budget)} 
            className="h-10 w-10 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 rounded-xl"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
