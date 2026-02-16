import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  Building2,
  Globe,
  Calendar,
  TrendingUp,
  Link2,
  ChevronDown,
  ChevronUp,
  X,
  FileText,
  Loader2,
  AlertCircle,
  Database,
  ArrowUpDown,
  ExternalLink,
  MoreHorizontal,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';

interface CompanyIntelligence {
  id: string;
  company_name: string;
  company_name_normalized: string;
  country: string | null;
  industry: string | null;
  ai_insights: string | null;
  collected_data: string | null;
  collected_urls: unknown[];
  social_links: unknown[];
  contact_info: Record<string, unknown>;
  financial_data: Record<string, unknown>;
  products_services: unknown[];
  leadership_data: unknown[];
  analysis_count: number;
  last_analyzed_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

type SortField = 'company_name' | 'country' | 'industry' | 'analysis_count' | 'last_analyzed_at' | 'created_at';
type SortOrder = 'asc' | 'desc';

export function CompanyIntelligenceManager() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Sort state
  const [sortField, setSortField] = useState<SortField>('last_analyzed_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  
  // UI state
  const [selectedCompany, setSelectedCompany] = useState<CompanyIntelligence | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<CompanyIntelligence | null>(null);

  // Fetch all companies
  const { data: companies = [], isLoading, refetch } = useQuery({
    queryKey: ['company-intelligence-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_intelligence')
        .select('*')
        .order('last_analyzed_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as CompanyIntelligence[];
    },
  });

  // Get unique countries and industries for filter dropdowns
  const uniqueCountries = useMemo(() => {
    const countries = new Set<string>();
    companies.forEach(c => c.country && countries.add(c.country));
    return Array.from(countries).sort();
  }, [companies]);

  const uniqueIndustries = useMemo(() => {
    const industries = new Set<string>();
    companies.forEach(c => c.industry && industries.add(c.industry));
    return Array.from(industries).sort();
  }, [companies]);

  // Filter and sort companies
  const filteredCompanies = useMemo(() => {
    let result = [...companies];
    
    // Apply search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.company_name.toLowerCase().includes(search) ||
        c.company_name_normalized.toLowerCase().includes(search)
      );
    }
    
    // Apply filters
    if (filterCountry) {
      result = result.filter(c => c.country?.toLowerCase().includes(filterCountry.toLowerCase()));
    }
    if (filterIndustry) {
      result = result.filter(c => c.industry?.toLowerCase().includes(filterIndustry.toLowerCase()));
    }
    if (filterDateFrom) {
      result = result.filter(c => c.last_analyzed_at && c.last_analyzed_at >= filterDateFrom);
    }
    if (filterDateTo) {
      result = result.filter(c => c.last_analyzed_at && c.last_analyzed_at <= `${filterDateTo}T23:59:59`);
    }
    
    // Apply sort
    result.sort((a, b) => {
      let aVal: string | number | null = a[sortField];
      let bVal: string | number | null = b[sortField];
      
      if (aVal === null) return sortOrder === 'asc' ? 1 : -1;
      if (bVal === null) return sortOrder === 'asc' ? -1 : 1;
      
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return result;
  }, [companies, searchTerm, filterCountry, filterIndustry, filterDateFrom, filterDateTo, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCompanies.slice(start, start + itemsPerPage);
  }, [filteredCompanies, currentPage]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('company_intelligence')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-intelligence-all'] });
      toast({
        title: 'Empresa removida',
        description: 'O registro foi removido do banco de inteligência.',
      });
      setDeleteConfirm(null);
    },
    onError: (error) => {
      toast({
        title: 'Erro ao remover',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Export to CSV
  const exportToCSV = useCallback(() => {
    const headers = [
      'Empresa',
      'País',
      'Setor',
      'Análises',
      'URLs Coletadas',
      'Última Análise',
      'Criado em',
    ];
    
    const rows = filteredCompanies.map(c => [
      c.company_name,
      c.country || '',
      c.industry || '',
      c.analysis_count.toString(),
      Array.isArray(c.collected_urls) ? c.collected_urls.length.toString() : '0',
      c.last_analyzed_at ? format(new Date(c.last_analyzed_at), 'dd/MM/yyyy HH:mm') : '',
      format(new Date(c.created_at), 'dd/MM/yyyy HH:mm'),
    ]);
    
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(';')),
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `banco-inteligencia-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Exportação concluída',
      description: `${filteredCompanies.length} registros exportados para CSV.`,
    });
  }, [filteredCompanies, toast]);

  // Toggle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilterCountry('');
    setFilterIndustry('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setCurrentPage(1);
  };

  const activeFiltersCount = [filterCountry, filterIndustry, filterDateFrom, filterDateTo].filter(Boolean).length;

  // Stats cards
  const stats = useMemo(() => ({
    total: companies.length,
    thisMonth: companies.filter(c => {
      if (!c.last_analyzed_at) return false;
      const date = new Date(c.last_analyzed_at);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length,
    totalUrls: companies.reduce((sum, c) => sum + (Array.isArray(c.collected_urls) ? c.collected_urls.length : 0), 0),
    avgAnalyses: companies.length > 0 
      ? (companies.reduce((sum, c) => sum + c.analysis_count, 0) / companies.length).toFixed(1)
      : '0',
  }), [companies]);

  const SortIcon = ({ field }: { field: SortField }) => (
    <ArrowUpDown className={`h-3 w-3 ml-1 ${sortField === field ? 'text-primary' : 'text-muted-foreground'}`} />
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            Banco de Inteligência
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie todas as empresas analisadas pelo Duo Intelligence
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total de Empresas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.thisMonth}</p>
                <p className="text-xs text-muted-foreground">Este Mês</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Link2 className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalUrls}</p>
                <p className="text-xs text-muted-foreground">URLs Coletadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <FileText className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.avgAnalyses}</p>
                <p className="text-xs text-muted-foreground">Média de Análises</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome da empresa..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            
            {/* Filter toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
              {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
            </Button>
            
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>
          
          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">País</Label>
                    <Select value={filterCountry} onValueChange={(v) => { setFilterCountry(v === 'all' ? '' : v); setCurrentPage(1); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os países" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os países</SelectItem>
                        {uniqueCountries.map(country => (
                          <SelectItem key={country} value={country}>{country}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Setor</Label>
                    <Select value={filterIndustry} onValueChange={(v) => { setFilterIndustry(v === 'all' ? '' : v); setCurrentPage(1); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os setores" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os setores</SelectItem>
                        {uniqueIndustries.map(industry => (
                          <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Análise a partir de</Label>
                    <Input
                      type="date"
                      value={filterDateFrom}
                      onChange={(e) => { setFilterDateFrom(e.target.value); setCurrentPage(1); }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Análise até</Label>
                    <Input
                      type="date"
                      value={filterDateTo}
                      onChange={(e) => { setFilterDateTo(e.target.value); setCurrentPage(1); }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filteredCompanies.length === companies.length
            ? `${companies.length} empresas no banco`
            : `${filteredCompanies.length} de ${companies.length} empresas`}
        </span>
        <span>
          Página {currentPage} de {totalPages || 1}
        </span>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : paginatedCompanies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mb-4 opacity-50" />
              <p className="font-medium">Nenhuma empresa encontrada</p>
              <p className="text-sm">Tente ajustar os filtros ou realizar novas análises.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('company_name')}
                    >
                      <div className="flex items-center">
                        Empresa
                        <SortIcon field="company_name" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('country')}
                    >
                      <div className="flex items-center">
                        País
                        <SortIcon field="country" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('industry')}
                    >
                      <div className="flex items-center">
                        Setor
                        <SortIcon field="industry" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none text-center"
                      onClick={() => handleSort('analysis_count')}
                    >
                      <div className="flex items-center justify-center">
                        Análises
                        <SortIcon field="analysis_count" />
                      </div>
                    </TableHead>
                    <TableHead className="text-center">URLs</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('last_analyzed_at')}
                    >
                      <div className="flex items-center">
                        Última Análise
                        <SortIcon field="last_analyzed_at" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCompanies.map((company) => (
                    <TableRow key={company.id} className="group">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate max-w-[200px]">{company.company_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {company.country ? (
                          <div className="flex items-center gap-1.5">
                            <Globe className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate max-w-[100px]">{company.country}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {company.industry ? (
                          <Badge variant="outline" className="truncate max-w-[120px]">
                            {company.industry}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{company.analysis_count}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-muted-foreground">
                          {Array.isArray(company.collected_urls) ? company.collected_urls.length : 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        {company.last_analyzed_at ? (
                          <div className="flex items-center gap-1.5 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {format(new Date(company.last_analyzed_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedCompany(company)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => setDeleteConfirm(company)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
          >
            Anterior
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page: number;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  className="w-8"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            Próximo
          </Button>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedCompany} onOpenChange={() => setSelectedCompany(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {selectedCompany?.company_name}
            </DialogTitle>
            <DialogDescription>
              Detalhes da inteligência coletada sobre esta empresa
            </DialogDescription>
          </DialogHeader>
          
          {selectedCompany && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                {/* Meta info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">País</p>
                    <p className="font-medium">{selectedCompany.country || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Setor</p>
                    <p className="font-medium">{selectedCompany.industry || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Total de Análises</p>
                    <p className="font-medium">{selectedCompany.analysis_count}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Última Análise</p>
                    <p className="font-medium">
                      {selectedCompany.last_analyzed_at 
                        ? format(new Date(selectedCompany.last_analyzed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                        : '—'}
                    </p>
                  </div>
                </div>

                {/* URLs coletadas */}
                {Array.isArray(selectedCompany.collected_urls) && selectedCompany.collected_urls.length > 0 && (
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        <span className="flex items-center gap-2">
                          <Link2 className="h-4 w-4" />
                          URLs Coletadas ({selectedCompany.collected_urls.length})
                        </span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <div className="bg-muted/50 rounded-lg p-3 space-y-1 max-h-40 overflow-y-auto">
                        {selectedCompany.collected_urls.map((url, i) => (
                          <a
                            key={i}
                            href={String(url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-primary hover:underline truncate"
                          >
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            {String(url)}
                          </a>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* AI Insights */}
                {selectedCompany.ai_insights && (
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Insights de IA
                    </h4>
                    <Card className="bg-muted/30">
                      <CardContent className="p-4 prose prose-sm dark:prose-invert max-w-none">
                        <MarkdownRenderer content={selectedCompany.ai_insights} />
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Collected Data */}
                {selectedCompany.collected_data && (
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Database className="h-4 w-4 text-blue-500" />
                      Dados Coletados
                    </h4>
                    <Card className="bg-muted/30">
                      <CardContent className="p-4 prose prose-sm dark:prose-invert max-w-none">
                        <MarkdownRenderer content={selectedCompany.collected_data} />
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteConfirm?.company_name}</strong> do banco de inteligência?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
