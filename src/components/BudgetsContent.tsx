
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MessageCircle } from '@/components/ui/icons';
import { generateWhatsAppMessage, shareViaWhatsApp } from '@/utils/whatsappUtils';
import { useEnhancedToast } from '@/hooks/useEnhancedToast';
import { EditBudgetModal } from '@/components/EditBudgetModal';
import { DeleteBudgetConfirm } from '@/components/DeleteBudgetConfirm';
import { BudgetsSkeleton } from '@/components/ui/loading-skeleton';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { usePdfGeneration } from '@/hooks/usePdfGeneration';
import { ConfirmationDialog } from './ConfirmationDialog';
import { BudgetCard } from './budgets/BudgetCard';
import { BudgetTableRow } from './budgets/BudgetTableRow';
import { BudgetSearchBar } from './budgets/BudgetSearchBar';

export const BudgetsContent = () => {
  const { showSuccess, showError } = useEnhancedToast();
  const { user, profile } = useAuth();
  const { generateAndSharePDF, isGenerating } = usePdfGeneration();
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [deletingBudget, setDeletingBudget] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actualSearchTerm, setActualSearchTerm] = useState('');
  const [confirmation, setConfirmation] = useState<{
    action: () => void;
    title: string;
    description: string;
  } | null>(null);

  const { data: budgets, isLoading, error, refetch } = useQuery({
    queryKey: ['budgets', actualSearchTerm, user?.id],
    queryFn: async () => {
      if (!user) {
        console.log('No user found, returning empty array');
        return [];
      }
      console.log('Fetching budgets for user:', user.id);
      let query = supabase.from('budgets').select('*').eq('owner_id', user.id).order('created_at', {
        ascending: false
      });
      if (actualSearchTerm) {
        query = query.or(`client_name.ilike.%${actualSearchTerm}%,device_model.ilike.%${actualSearchTerm}%,issue.ilike.%${actualSearchTerm}%`);
      }
      const { data, error } = await query;
      if (error) {
        console.error('Error fetching budgets:', error);
        throw error;
      }
      console.log('Fetched budgets:', data?.length || 0);
      return data || [];
    },
    enabled: !!user,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  const handleSearch = () => {
    setActualSearchTerm(searchTerm);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleShareWhatsApp = (budget: any) => {
    setConfirmation({
      action: () => {
        try {
          const message = generateWhatsAppMessage(budget);
          shareViaWhatsApp(message);
          showSuccess({
            title: "Redirecionando...",
            description: "Você será redirecionado para o WhatsApp para compartilhar o orçamento."
          });
        } catch (error) {
          showError({
            title: "Erro ao compartilhar",
            description: "Ocorreu um erro ao preparar o compartilhamento."
          });
        }
      },
      title: "Compartilhar via WhatsApp?",
      description: "Você será redirecionado para o WhatsApp para enviar os detalhes do orçamento."
    });
  };

  const handleViewPDF = (budget: any) => {
    setConfirmation({
      action: async () => {
        try {
          await generateAndSharePDF(budget);
        } catch (error) {
          console.error('Erro ao gerar PDF:', error);
        }
      },
      title: "Gerar e compartilhar PDF?",
      description: "Um PDF do orçamento será gerado e a opção de compartilhamento será exibida."
    });
  };

  if (!user) {
    return (
      <div className="p-4 lg:p-8">
        <EmptyState 
          icon={MessageCircle} 
          title="Faça login para continuar" 
          description="Você precisa estar logado para ver seus orçamentos." 
        />
      </div>
    );
  }

  if (isLoading) {
    return <BudgetsSkeleton />;
  }

  if (error) {
    console.error('Budget loading error:', error);
    return (
      <div className="p-4 lg:p-8">
        <EmptyState 
          icon={MessageCircle} 
          title="Erro ao carregar orçamentos" 
          description="Não foi possível carregar os orçamentos. Verifique sua conexão e tente novamente." 
          action={{
            label: "Tentar Novamente",
            onClick: () => refetch()
          }} 
        />
      </div>
    );
  }

  const filteredBudgets = budgets || [];

  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 animate-fade-in pb-24 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="animate-slide-up">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Meus Orçamentos</h1>
          <div className="flex items-center space-x-2 mt-2">
            <p className="text-sm lg:text-base text-muted-foreground">
              Gerencie todos os seus orçamentos
            </p>
            <Badge variant="secondary" className="bg-[#fec832]/10 text-[#fec832] border-[#fec832]/20">
              {filteredBudgets.length}
            </Badge>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <BudgetSearchBar
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        onSearch={handleSearch}
        onKeyPress={handleKeyPress}
      />
      
      {/* Budgets List */}
      <Card className="glass-card border-0 shadow-lg animate-slide-up bg-white/50 dark:bg-black/50 backdrop-blur-xl">
        <CardHeader className="p-4 lg:p-6">
          <CardTitle className="flex items-center justify-between text-lg lg:text-xl">
            <span>Lista de Orçamentos</span>
            {filteredBudgets.length > 0 && (
              <Badge variant="secondary" className="bg-[#fec832]/10 text-[#fec832] border-[#fec832]/20">
                {filteredBudgets.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 lg:p-6 lg:pt-0">
          {filteredBudgets.length > 0 ? (
            <div className="space-y-3 lg:space-y-0 p-4 lg:p-0">
              {/* Mobile Cards View */}
              <div className="block lg:hidden space-y-4">
                {filteredBudgets.map((budget, index) => (
                  <BudgetCard
                    key={budget.id}
                    budget={budget}
                    profile={profile}
                    isGenerating={isGenerating}
                    onShareWhatsApp={handleShareWhatsApp}
                    onViewPDF={handleViewPDF}
                    onEdit={setEditingBudget}
                    onDelete={setDeletingBudget}
                  />
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-white/10">
                      <TableHead className="font-semibold">Dispositivo</TableHead>
                      <TableHead className="font-semibold">Problema</TableHead>
                      <TableHead className="font-semibold">Valor</TableHead>
                      <TableHead className="font-semibold">Data</TableHead>
                      <TableHead className="font-semibold text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBudgets.map((budget, index) => (
                      <BudgetTableRow
                        key={budget.id}
                        budget={budget}
                        profile={profile}
                        index={index}
                        isGenerating={isGenerating}
                        onShareWhatsApp={handleShareWhatsApp}
                        onViewPDF={handleViewPDF}
                        onEdit={setEditingBudget}
                        onDelete={setDeletingBudget}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <EmptyState 
                icon={MessageCircle} 
                title={actualSearchTerm ? "Nenhum resultado encontrado" : "Nenhum orçamento encontrado"} 
                description={actualSearchTerm ? `Não encontramos orçamentos com "${actualSearchTerm}". Tente uma busca diferente.` : "Você ainda não criou nenhum orçamento. Comece criando seu primeiro orçamento para começar a gerenciar suas vendas."} 
                action={actualSearchTerm ? {
                  label: "Limpar busca",
                  onClick: () => {
                    setSearchTerm('');
                    setActualSearchTerm('');
                  }
                } : {
                  label: "Criar Primeiro Orçamento",
                  onClick: () => {
                    console.log('Navigate to new budget');
                  }
                }} 
                className="border-0 shadow-none" 
              />
            </div>
          )}
        </CardContent>
      </Card>

      <EditBudgetModal 
        budget={editingBudget} 
        open={!!editingBudget} 
        onOpenChange={(open) => !open && setEditingBudget(null)} 
      />

      <DeleteBudgetConfirm 
        budget={deletingBudget} 
        open={!!deletingBudget} 
        onOpenChange={(open) => !open && setDeletingBudget(null)} 
      />

      <ConfirmationDialog 
        open={!!confirmation} 
        onOpenChange={() => setConfirmation(null)} 
        onConfirm={() => {
          if (confirmation) {
            confirmation.action();
            setConfirmation(null);
          }
        }} 
        title={confirmation?.title || ''} 
        description={confirmation?.description || ''} 
      />
    </div>
  );
};
