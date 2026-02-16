/**
 * AML Screening Hub - Professional KYC/AML Screening Report Component
 * Based on QCC KYC report format with ELP Green branding
 */

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';
import {
  Shield,
  Search,
  FileText,
  Download,
  History,
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  Building2,
  Globe,
  Calendar,
  MapPin,
  Flag,
  Loader2,
  ChevronDown,
  ChevronUp,
  Eye,
  Copy,
  ExternalLink,
  Filter,
  RefreshCw,
  Upload,
  Camera,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import jsPDF from 'jspdf';

// Types
interface ScreeningMatch {
  matched_name: string;
  matched_name_local?: string;
  match_rate: number;
  entity_type: string;
  tag: string;
  nationality?: string;
  id_number?: string;
  date_of_birth?: string;
  gender?: string;
  source_name: string;
  source_issuer: string;
  source_url?: string;
  source_jurisdiction: string;
  alias?: string[];
  place_of_birth?: string;
  role_description?: string;
  reason?: string;
  address?: string;
  remark?: string;
  disclosure_date?: string;
  start_date?: string;
  delisting_date?: string;
  associated_companies?: { name: string; registration_number?: string }[];
}

interface ScreeningResult {
  success: boolean;
  report_id: string;
  report_token: string;
  summary: {
    subject_name: string;
    total_matches: number;
    total_screened_lists: number;
    risk_level: string;
    screening_types: string[];
    jurisdictions: string[];
    match_rate_threshold: number;
  };
  matches: ScreeningMatch[];
  screened_lists: {
    name: string;
    issuer: string;
    issuer_description?: string;
    jurisdiction: string;
    type: string;
    url?: string;
    matches_found: number;
  }[];
  elapsed_ms: number;
}

interface ScreeningReport {
  id: string;
  created_at: string;
  subject_name: string;
  subject_country: string;
  total_matches: number;
  risk_level: string;
  status: string;
}

// Jurisdictions
const JURISDICTIONS = [
  { code: 'ALL', name: 'All', flag: '🌐' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'EU', name: 'European Union', flag: '🇪🇺' },
  { code: 'INT', name: 'International', flag: '🏛️' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'UN', name: 'United Nations', flag: '🇺🇳' },
  { code: 'US', name: 'United States of America', flag: '🇺🇸' },
];

// Screening Types
const SCREENING_TYPES = [
  { id: 'sanctions', label: 'Sanctions', color: 'bg-red-500' },
  { id: 'pep', label: 'PEP', color: 'bg-purple-500' },
  { id: 'criminal', label: 'Criminal', color: 'bg-orange-500' },
  { id: 'watchlist', label: 'Watchlist', color: 'bg-yellow-500' },
];

// Available Lists for Screening
const SCREENING_LISTS = [
  { id: 'un_consolidated', name: 'UN Consolidated Sanctions', type: 'sanctions' },
  { id: 'ofac_sdn', name: 'OFAC SDN List', type: 'sanctions' },
  { id: 'ofac_consolidated', name: 'OFAC Consolidated List', type: 'sanctions' },
  { id: 'eu_consolidated', name: 'EU Consolidated Sanctions', type: 'sanctions' },
  { id: 'uk_consolidated', name: 'UK Consolidated Sanctions', type: 'sanctions' },
  { id: 'au_dfat', name: 'Australia DFAT Sanctions', type: 'sanctions' },
  { id: 'ca_osfi', name: 'Canada OSFI Sanctions', type: 'sanctions' },
  { id: 'jp_mof', name: 'Japan MOF Sanctions', type: 'sanctions' },
  { id: 'ch_seco', name: 'Switzerland SECO Sanctions', type: 'sanctions' },
  { id: 'interpol_red', name: 'INTERPOL Red Notices', type: 'criminal' },
  { id: 'interpol_yellow', name: 'INTERPOL Yellow Notices', type: 'criminal' },
  { id: 'fbi_wanted', name: 'FBI Most Wanted', type: 'criminal' },
  { id: 'cia_world_leaders', name: 'CIA World Leaders', type: 'pep' },
  { id: 'everypolitician', name: 'EveryPolitician Database', type: 'pep' },
  { id: 'opensanctions_pep', name: 'OpenSanctions PEP', type: 'pep' },
  { id: 'wikidata_politicians', name: 'Wikidata Politicians', type: 'pep' },
  { id: 'worldbank_debarred', name: 'World Bank Debarred', type: 'watchlist' },
  { id: 'iadb_sanctions', name: 'IADB Sanctions', type: 'watchlist' },
  { id: 'adb_sanctions', name: 'ADB Sanctions', type: 'watchlist' },
  { id: 'afdb_sanctions', name: 'AfDB Sanctions', type: 'watchlist' },
  { id: 'ebrd_sanctions', name: 'EBRD Sanctions', type: 'watchlist' },
  { id: 'imf_staff', name: 'IMF Staff List', type: 'pep' },
  { id: 'un_staff', name: 'UN Senior Officials', type: 'pep' },
  { id: 'bis_denied', name: 'BIS Denied Persons', type: 'sanctions' },
  { id: 'eu_travel_ban', name: 'EU Travel Ban', type: 'sanctions' },
  { id: 'ru_rosfinmonitoring', name: 'Russia Rosfinmonitoring', type: 'sanctions' },
  { id: 'cn_mps_wanted', name: 'China MPS Wanted', type: 'criminal' },
  { id: 'fatf_greylist', name: 'FATF Grey List', type: 'watchlist' },
  { id: 'fatf_blacklist', name: 'FATF Black List', type: 'watchlist' },
  { id: 'gleif_lei', name: 'GLEIF LEI Database', type: 'watchlist' },
  { id: 'icij_offshore', name: 'ICIJ Offshore Leaks', type: 'watchlist' },
  { id: 'panama_papers', name: 'Panama Papers', type: 'watchlist' },
  { id: 'paradise_papers', name: 'Paradise Papers', type: 'watchlist' },
];

// Risk Level Config
const RISK_LEVELS = {
  low: { label: 'Low Risk', color: 'bg-green-500', textColor: 'text-green-700', icon: CheckCircle },
  medium: { label: 'Medium Risk', color: 'bg-yellow-500', textColor: 'text-yellow-700', icon: AlertTriangle },
  high: { label: 'High Risk', color: 'bg-orange-500', textColor: 'text-orange-700', icon: AlertTriangle },
  critical: { label: 'Critical Risk', color: 'bg-red-500', textColor: 'text-red-700', icon: XCircle },
};

export function AMLScreeningHub() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Form State
  const [screeningMode, setScreeningMode] = useState<'individual' | 'entity'>('individual');
  const [subjectName, setSubjectName] = useState('');
  const [subjectNameLocal, setSubjectNameLocal] = useState('');
  const [subjectIdNumber, setSubjectIdNumber] = useState('');
  const [subjectDateOfBirth, setSubjectDateOfBirth] = useState('');
  const [subjectCountry, setSubjectCountry] = useState('');
  const [subjectGender, setSubjectGender] = useState('');
  const [subjectCompanyName, setSubjectCompanyName] = useState('');
  const [subjectCompanyReg, setSubjectCompanyReg] = useState('');
  
  // Entity-specific fields
  const [entityName, setEntityName] = useState('');
  const [entityCountry, setEntityCountry] = useState('');
  const [entityRegNumber, setEntityRegNumber] = useState('');
  
  // Photo State
  const [subjectPhoto, setSubjectPhoto] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Filter State
  const [listType, setListType] = useState<string>('ALL');
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>(['ALL']);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['sanctions', 'pep', 'criminal', 'watchlist']);
  const [matchThreshold, setMatchThreshold] = useState(80);
  const [showJurisdictionDropdown, setShowJurisdictionDropdown] = useState(false);
  const [showListDropdown, setShowListDropdown] = useState(false);
  
  // Results State
  const [currentResult, setCurrentResult] = useState<ScreeningResult | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<ScreeningMatch | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('form');
  
  // Language selection for PDF
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedPdfLanguage, setSelectedPdfLanguage] = useState('en');
  
  // QR Code state
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  
  // PDF Language translations
  const pdfLanguages = [
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  ];
  
  const pdfTranslations: Record<string, {
    department: string;
    report: string;
    slogan: string;
    confidential: string;
    page: string;
    of: string;
    // Cover page
    complianceDueDiligence: string;
    verifyDocumentInstantly: string;
    verifyDescription: string;
    reportGeneratedOn: string;
    at: string;
    snapshotDisclaimer: string;
    disclaimer: string;
    // Page 2
    screenedSubjectInfo: string;
    name: string;
    idNo: string;
    dateOfBirth: string;
    countryRegion: string;
    gender: string;
    associatedCompanyName: string;
    associatedCompanyRegNo: string;
    statement: string;
    statementText: string;
    scanSummary: string;
    screeningType: string;
    jurisdiction: string;
    matchRate: string;
    totalMatches: string;
    totalScreenedLists: string;
    matchList: string;
    title: string;
    source: string;
    showingResults: string;
    // Screen Results
    screenResults: string;
    match: string;
    entityInformation: string;
    scriptName: string;
    tag: string;
    nationality: string;
    basicInformation: string;
    publishedSource: string;
    otherInformation: string;
    alias: string;
    placeOfBirth: string;
    role: string;
    reason: string;
    address: string;
    remark: string;
    otherImportantDates: string;
    disclosureDate: string;
    startDate: string;
    delistingDate: string;
    associatedInfo: string;
    registrationNumber: string;
    // Screened Lists
    screenedLists: string;
    matchFound: string;
    issuer: string;
    description: string;
    administeredUnder: string;
    law: string;
    // Notice
    notice: string;
    customerService: string;
    customerServiceText: string;
    disclaimerConfidentiality: string;
    disclaimerFull: string;
    copyright: string;
    copyrightNotice: string;
  }> = {
    pt: {
      department: 'Departamento de Compliance',
      report: 'RELATÓRIO DE TRIAGEM AML/KYC',
      slogan: 'Transformando resíduos em recursos sustentáveis',
      confidential: 'Documento confidencial - Uso interno',
      page: 'Página',
      of: 'de',
      complianceDueDiligence: 'Departamento de Compliance e Due Diligence',
      verifyDocumentInstantly: 'Verificar Documento Instantaneamente',
      verifyDescription: 'Verifique se o documento foi emitido pela ELP',
      reportGeneratedOn: 'Este relatório foi gerado em',
      at: 'às',
      snapshotDisclaimer: 'e o conteúdo exibido é um snapshot dos dados daquele momento.',
      disclaimer: 'Avisos: De acordo com as instruções do usuário, o mecanismo de busca da ELP gera automaticamente as informações que foram legalmente divulgadas publicamente de forma não manual. A Plataforma ELP não é proprietária dos dados de origem e não toma a iniciativa de editar ou modificar as informações, os serviços fornecidos pela Plataforma ELP não são considerados como confirmação ou garantia pela Plataforma ELP quanto à precisão, autenticidade, integridade e atualidade de seu conteúdo. O usuário reconhece ainda que o uso da plataforma ELP está em conformidade com todas as leis aplicáveis.',
      screenedSubjectInfo: 'INFORMAÇÕES DO SUJEITO TRIADO',
      name: 'Nome',
      idNo: 'Nº do Documento',
      dateOfBirth: 'Data de Nascimento',
      countryRegion: 'País/Região',
      gender: 'Gênero',
      associatedCompanyName: 'Nome da Empresa Associada',
      associatedCompanyRegNo: 'Nº de Registro da Empresa Associada',
      statement: 'Declaração:',
      statementText: 'as informações acima são os dados fornecidos para a triagem.',
      scanSummary: 'RESUMO DA TRIAGEM',
      screeningType: 'Tipo de Triagem:',
      jurisdiction: 'Jurisdição:',
      matchRate: 'Taxa de Correspondência',
      totalMatches: 'Total de Correspondências',
      totalScreenedLists: 'Total de Listas Triadas',
      matchList: 'Lista de Correspondências',
      title: 'Título',
      source: 'Fonte',
      showingResults: 'Exibindo {count} resultados',
      screenResults: 'RESULTADOS DA TRIAGEM',
      match: 'Correspondência',
      entityInformation: 'Informações da Entidade',
      scriptName: 'Nome em Outro Alfabeto',
      tag: 'Tag',
      nationality: 'Nacionalidade',
      basicInformation: 'Informações Básicas',
      publishedSource: 'Fonte Publicada',
      otherInformation: 'Outras Informações',
      alias: 'Aliases',
      placeOfBirth: 'Local de Nascimento',
      role: 'Função',
      reason: 'Motivo',
      address: 'Endereço',
      remark: 'Observação',
      otherImportantDates: 'Outras Datas Importantes',
      disclosureDate: 'Data de Divulgação',
      startDate: 'Data de Início',
      delistingDate: 'Data de Remoção',
      associatedInfo: 'Informações Associadas',
      registrationNumber: 'Número de Registro',
      screenedLists: 'LISTAS TRIADAS',
      matchFound: 'Correspondências Encontradas',
      issuer: 'Emissor',
      description: 'Descrição',
      administeredUnder: 'administrada sob a lei de',
      law: '',
      notice: 'AVISO',
      customerService: 'ATENDIMENTO AO CLIENTE',
      customerServiceText: 'Se você precisar de mais informações ou tiver alguma dúvida, entre em contato com nosso Atendimento ao Cliente.',
      disclaimerConfidentiality: 'AVISO LEGAL E CONFIDENCIALIDADE',
      disclaimerFull: `ESTAS INFORMAÇÕES SÃO FORNECIDAS PELA ELP GREEN TECHNOLOGY A SEU PEDIDO E ESTÃO SUJEITAS AOS TERMOS E CONDIÇÕES DO SEU CONTRATO DE SERVIÇO. ESTAS INFORMAÇÕES SÃO CONFIDENCIAIS E NÃO DEVEM SER DIVULGADAS.

Este relatório é fornecido ao Usuário em estrita confidencialidade para uso exclusivo do Usuário como um dos fatores a serem considerados em conheça seu cliente, avaliação de crédito, conformidade, gerenciamento de riscos e outras decisões comerciais legítimas.

Este relatório contém informações compiladas de várias fontes que não são controladas pela ELP Green Technology e, salvo indicação expressa em contrário neste relatório, tais informações não foram verificadas de forma independente. Consequentemente, a ELP Green Technology não faz representações ou garantias quanto à precisão, integridade ou atualidade das informações aqui contidas.

A ELP Green Technology expressamente se isenta de toda e qualquer responsabilidade por qualquer perda ou dano decorrente de ou em conexão com o uso ou dependência do conteúdo deste relatório.

Este relatório é estritamente confidencial e de propriedade da ELP Green Technology e não pode ser reproduzido, publicado, transmitido ou divulgado, no todo ou em parte, a terceiros sem o consentimento prévio por escrito da ELP Green Technology.`,
      copyright: 'COPYRIGHT © 2026 ELP GREEN TECHNOLOGY. TODOS OS DIREITOS RESERVADOS.',
      copyrightNotice: 'ESTE RELATÓRIO NÃO PODE SER REPRODUZIDO NO TODO OU EM PARTE DE QUALQUER FORMA OU POR QUALQUER MEIO.',
    },
    en: {
      department: 'Compliance Department',
      report: 'AML/KYC SCREENING REPORT',
      slogan: 'Transforming waste into sustainable resources',
      confidential: 'Confidential document - Internal use',
      page: 'Page',
      of: 'of',
      complianceDueDiligence: 'Compliance & Due Diligence Department',
      verifyDocumentInstantly: 'Verify Document Instantly',
      verifyDescription: 'Check if the document is issued by ELP',
      reportGeneratedOn: 'This report was generated on',
      at: 'at',
      snapshotDisclaimer: 'and the content you are viewing is a snapshot of the data as of that time point.',
      disclaimer: 'Disclaimers: According to the user\'s instructions, ELP\'s search engine will automatically generate the information that has been legally publicly disclosed in a non-manual search manner. ELP Platform is not the owner of the source data and does not take the initiative to edit or modify the data information, the services provided by the ELP Platform are not regarded as a confirmation or guarantee by the ELP Platform of the accuracy, authenticity, completeness and timeliness of its content. User further acknowledges that the use of ELP platform, complies with all applicable laws.',
      screenedSubjectInfo: 'SCREENED SUBJECT INFORMATION',
      name: 'Name',
      idNo: 'ID No.',
      dateOfBirth: 'Date of Birth',
      countryRegion: 'Country/Region',
      gender: 'Gender',
      associatedCompanyName: 'Associated Company Name',
      associatedCompanyRegNo: 'Associated Company Registration Number',
      statement: 'Statement:',
      statementText: 'the information shown above is the input provided for scanning.',
      scanSummary: 'SCAN SUMMARY',
      screeningType: 'Screening Type:',
      jurisdiction: 'Jurisdiction:',
      matchRate: 'Match Rate',
      totalMatches: 'Total Matches',
      totalScreenedLists: 'Total Screened Lists',
      matchList: 'Match List',
      title: 'Title',
      source: 'Source',
      showingResults: 'Showing {count} results',
      screenResults: 'SCREEN RESULTS',
      match: 'Match',
      entityInformation: 'Entity Information',
      scriptName: 'Script Name',
      tag: 'Tag',
      nationality: 'Nationality',
      basicInformation: 'Basic Information',
      publishedSource: 'Published Source',
      otherInformation: 'Other Information',
      alias: 'Alias',
      placeOfBirth: 'Place of Birth',
      role: 'Role',
      reason: 'Reason',
      address: 'Address',
      remark: 'Remark',
      otherImportantDates: 'Other Important Dates',
      disclosureDate: 'Disclosure Date',
      startDate: 'Start Date',
      delistingDate: 'Delisting Date',
      associatedInfo: 'Associated Info',
      registrationNumber: 'Registration Number',
      screenedLists: 'SCREENED LISTS',
      matchFound: 'Match Found',
      issuer: 'Issuer',
      description: 'Description',
      administeredUnder: 'is administered under',
      law: 'law',
      notice: 'NOTICE',
      customerService: 'CUSTOMER SERVICE',
      customerServiceText: 'If you require further information or have any concerns, please contact our Customer Service.',
      disclaimerConfidentiality: 'DISCLAIMER AND CONFIDENTIALITY',
      disclaimerFull: `THIS INFORMATION IS PROVIDED BY ELP GREEN TECHNOLOGY AT YOUR REQUEST AND IS SUBJECT TO THE TERMS AND CONDITIONS OF YOUR SERVICE AGREEMENT. THIS INFORMATION IS CONFIDENTIAL AND MUST NOT BE DISCLOSED.

This report is furnished to the User in strict confidence for the sole and exclusive use of the User as one of the factors to be considered in know your customer, credit assessment, compliance, risk management, and other legitimate business decisions.

This report contains information compiled from various sources that are not controlled by ELP Green Technology and, unless otherwise expressly stated in this report, such information has not been independently verified. Accordingly, ELP Green Technology makes no representations or warranties as to the accuracy, completeness, or timeliness of the information contained herein.

ELP Green Technology expressly disclaims any and all liability for any loss or damage arising out of or in connection with the use of, or reliance upon, the contents of this report.

This report is strictly confidential and proprietary to ELP Green Technology and may not be reproduced, published, transmitted, or disclosed, in whole or in part, to any third party without the prior written consent of ELP Green Technology.`,
      copyright: 'COPYRIGHT © 2026 ELP GREEN TECHNOLOGY. ALL RIGHTS RESERVED.',
      copyrightNotice: 'THIS REPORT MAY NOT BE REPRODUCED IN WHOLE OR IN PART IN ANY FORM OR BY ANY MEANS.',
    },
    es: {
      department: 'Departamento de Cumplimiento',
      report: 'INFORME DE EVALUACIÓN AML/KYC',
      slogan: 'Transformando residuos en recursos sostenibles',
      confidential: 'Documento confidencial - Uso interno',
      page: 'Página',
      of: 'de',
      complianceDueDiligence: 'Departamento de Cumplimiento y Due Diligence',
      verifyDocumentInstantly: 'Verificar Documento Instantáneamente',
      verifyDescription: 'Verifique si el documento fue emitido por ELP',
      reportGeneratedOn: 'Este informe fue generado el',
      at: 'a las',
      snapshotDisclaimer: 'y el contenido que está viendo es una instantánea de los datos en ese momento.',
      disclaimer: 'Avisos: De acuerdo con las instrucciones del usuario, el motor de búsqueda de ELP generará automáticamente la información que ha sido legalmente divulgada públicamente de manera no manual. La Plataforma ELP no es propietaria de los datos de origen y no toma la iniciativa de editar o modificar la información de datos, los servicios proporcionados por la Plataforma ELP no se consideran una confirmación o garantía de la Plataforma ELP sobre la precisión, autenticidad, integridad y puntualidad de su contenido. El usuario reconoce además que el uso de la plataforma ELP cumple con todas las leyes aplicables.',
      screenedSubjectInfo: 'INFORMACIÓN DEL SUJETO EVALUADO',
      name: 'Nombre',
      idNo: 'Nº de Documento',
      dateOfBirth: 'Fecha de Nacimiento',
      countryRegion: 'País/Región',
      gender: 'Género',
      associatedCompanyName: 'Nombre de Empresa Asociada',
      associatedCompanyRegNo: 'Nº de Registro de Empresa Asociada',
      statement: 'Declaración:',
      statementText: 'la información mostrada arriba es la entrada proporcionada para la evaluación.',
      scanSummary: 'RESUMEN DE EVALUACIÓN',
      screeningType: 'Tipo de Evaluación:',
      jurisdiction: 'Jurisdicción:',
      matchRate: 'Tasa de Coincidencia',
      totalMatches: 'Total de Coincidencias',
      totalScreenedLists: 'Total de Listas Evaluadas',
      matchList: 'Lista de Coincidencias',
      title: 'Título',
      source: 'Fuente',
      showingResults: 'Mostrando {count} resultados',
      screenResults: 'RESULTADOS DE EVALUACIÓN',
      match: 'Coincidencia',
      entityInformation: 'Información de la Entidad',
      scriptName: 'Nombre en Otro Alfabeto',
      tag: 'Etiqueta',
      nationality: 'Nacionalidad',
      basicInformation: 'Información Básica',
      publishedSource: 'Fuente Publicada',
      otherInformation: 'Otra Información',
      alias: 'Alias',
      placeOfBirth: 'Lugar de Nacimiento',
      role: 'Rol',
      reason: 'Razón',
      address: 'Dirección',
      remark: 'Observación',
      otherImportantDates: 'Otras Fechas Importantes',
      disclosureDate: 'Fecha de Divulgación',
      startDate: 'Fecha de Inicio',
      delistingDate: 'Fecha de Eliminación',
      associatedInfo: 'Información Asociada',
      registrationNumber: 'Número de Registro',
      screenedLists: 'LISTAS EVALUADAS',
      matchFound: 'Coincidencias Encontradas',
      issuer: 'Emisor',
      description: 'Descripción',
      administeredUnder: 'administrada bajo la ley de',
      law: '',
      notice: 'AVISO',
      customerService: 'SERVICIO AL CLIENTE',
      customerServiceText: 'Si necesita más información o tiene alguna inquietud, comuníquese con nuestro Servicio al Cliente.',
      disclaimerConfidentiality: 'AVISO LEGAL Y CONFIDENCIALIDAD',
      disclaimerFull: `ESTA INFORMACIÓN ES PROPORCIONADA POR ELP GREEN TECHNOLOGY A SU SOLICITUD Y ESTÁ SUJETA A LOS TÉRMINOS Y CONDICIONES DE SU ACUERDO DE SERVICIO. ESTA INFORMACIÓN ES CONFIDENCIAL Y NO DEBE SER DIVULGADA.

Este informe se proporciona al Usuario en estricta confidencialidad para uso exclusivo del Usuario como uno de los factores a considerar en conozca a su cliente, evaluación crediticia, cumplimiento, gestión de riesgos y otras decisiones comerciales legítimas.

Este informe contiene información compilada de diversas fuentes que no están controladas por ELP Green Technology y, a menos que se indique expresamente lo contrario en este informe, dicha información no ha sido verificada de forma independiente. En consecuencia, ELP Green Technology no hace representaciones ni garantías en cuanto a la precisión, integridad o puntualidad de la información aquí contenida.

ELP Green Technology renuncia expresamente a toda responsabilidad por cualquier pérdida o daño que surja de o en conexión con el uso o dependencia del contenido de este informe.

Este informe es estrictamente confidencial y propiedad de ELP Green Technology y no puede ser reproducido, publicado, transmitido o divulgado, en todo o en parte, a terceros sin el consentimiento previo por escrito de ELP Green Technology.`,
      copyright: 'COPYRIGHT © 2026 ELP GREEN TECHNOLOGY. TODOS LOS DERECHOS RESERVADOS.',
      copyrightNotice: 'ESTE INFORME NO PUEDE SER REPRODUCIDO EN TODO O EN PARTE DE NINGUNA FORMA NI POR NINGÚN MEDIO.',
    },
    zh: {
      department: '合规部门',
      report: 'AML/KYC筛查报告',
      slogan: '将废物转化为可持续资源',
      confidential: '机密文件 - 仅供内部使用',
      page: '页码',
      of: '/',
      complianceDueDiligence: '合规与尽职调查部门',
      verifyDocumentInstantly: '即时验证文件',
      verifyDescription: '检查文件是否由ELP签发',
      reportGeneratedOn: '本报告生成于',
      at: '',
      snapshotDisclaimer: '您所查看的内容是该时间点数据的快照。',
      disclaimer: '免责声明：根据用户的指示，ELP的搜索引擎将以非手动搜索方式自动生成已合法公开披露的信息。ELP平台不是源数据的所有者，不会主动编辑或修改数据信息，ELP平台提供的服务不被视为ELP平台对其内容准确性、真实性、完整性和及时性的确认或保证。用户进一步确认，使用ELP平台符合所有适用法律。',
      screenedSubjectInfo: '筛查对象信息',
      name: '姓名',
      idNo: '证件号码',
      dateOfBirth: '出生日期',
      countryRegion: '国家/地区',
      gender: '性别',
      associatedCompanyName: '关联公司名称',
      associatedCompanyRegNo: '关联公司注册号',
      statement: '声明：',
      statementText: '以上信息是为筛查提供的输入数据。',
      scanSummary: '筛查摘要',
      screeningType: '筛查类型：',
      jurisdiction: '司法管辖区：',
      matchRate: '匹配率',
      totalMatches: '匹配总数',
      totalScreenedLists: '筛查名单总数',
      matchList: '匹配列表',
      title: '标题',
      source: '来源',
      showingResults: '显示 {count} 条结果',
      screenResults: '筛查结果',
      match: '匹配',
      entityInformation: '实体信息',
      scriptName: '本地文字姓名',
      tag: '标签',
      nationality: '国籍',
      basicInformation: '基本信息',
      publishedSource: '发布来源',
      otherInformation: '其他信息',
      alias: '别名',
      placeOfBirth: '出生地',
      role: '角色',
      reason: '原因',
      address: '地址',
      remark: '备注',
      otherImportantDates: '其他重要日期',
      disclosureDate: '披露日期',
      startDate: '开始日期',
      delistingDate: '除名日期',
      associatedInfo: '关联信息',
      registrationNumber: '注册号',
      screenedLists: '筛查名单',
      matchFound: '发现匹配',
      issuer: '发布机构',
      description: '描述',
      administeredUnder: '根据以下法律管理',
      law: '',
      notice: '通知',
      customerService: '客户服务',
      customerServiceText: '如果您需要更多信息或有任何疑问，请联系我们的客户服务部门。',
      disclaimerConfidentiality: '免责声明和保密性',
      disclaimerFull: `本信息由ELP GREEN TECHNOLOGY应您的要求提供，并受您的服务协议条款和条件约束。本信息为机密信息，不得披露。

本报告以严格保密的方式提供给用户，仅供用户在了解客户、信用评估、合规、风险管理和其他合法商业决策中作为考虑因素之一独家使用。

本报告包含从各种不受ELP Green Technology控制的来源汇编的信息，除非在本报告中另有明确说明，否则此类信息未经独立核实。因此，ELP Green Technology不对此处所含信息的准确性、完整性或及时性作出任何陈述或保证。

ELP Green Technology明确声明对因使用或依赖本报告内容而产生的或与之相关的任何损失或损害不承担任何责任。

本报告为ELP Green Technology的严格机密和专有信息，未经ELP Green Technology事先书面同意，不得全部或部分复制、出版、传输或向任何第三方披露。`,
      copyright: '版权所有 © 2026 ELP GREEN TECHNOLOGY。保留所有权利。',
      copyrightNotice: '本报告不得以任何形式或任何方式全部或部分复制。',
    },
    it: {
      department: 'Dipartimento Compliance',
      report: 'RAPPORTO SCREENING AML/KYC',
      slogan: 'Trasformare i rifiuti in risorse sostenibili',
      confidential: 'Documento riservato - Uso interno',
      page: 'Pagina',
      of: 'di',
      complianceDueDiligence: 'Dipartimento Compliance e Due Diligence',
      verifyDocumentInstantly: 'Verifica Documento Istantaneamente',
      verifyDescription: 'Verifica se il documento è stato emesso da ELP',
      reportGeneratedOn: 'Questo rapporto è stato generato il',
      at: 'alle',
      snapshotDisclaimer: 'e il contenuto visualizzato è uno snapshot dei dati in quel momento.',
      disclaimer: 'Avvertenze: Secondo le istruzioni dell\'utente, il motore di ricerca di ELP genererà automaticamente le informazioni che sono state legalmente divulgate pubblicamente in modo non manuale. La Piattaforma ELP non è proprietaria dei dati di origine e non prende l\'iniziativa di modificare o alterare le informazioni sui dati, i servizi forniti dalla Piattaforma ELP non sono considerati come conferma o garanzia da parte della Piattaforma ELP dell\'accuratezza, autenticità, completezza e tempestività del suo contenuto. L\'utente riconosce inoltre che l\'uso della piattaforma ELP è conforme a tutte le leggi applicabili.',
      screenedSubjectInfo: 'INFORMAZIONI SUL SOGGETTO ESAMINATO',
      name: 'Nome',
      idNo: 'N. Documento',
      dateOfBirth: 'Data di Nascita',
      countryRegion: 'Paese/Regione',
      gender: 'Genere',
      associatedCompanyName: 'Nome Azienda Associata',
      associatedCompanyRegNo: 'N. Registrazione Azienda Associata',
      statement: 'Dichiarazione:',
      statementText: 'le informazioni sopra mostrate sono i dati forniti per lo screening.',
      scanSummary: 'RIEPILOGO SCREENING',
      screeningType: 'Tipo di Screening:',
      jurisdiction: 'Giurisdizione:',
      matchRate: 'Tasso di Corrispondenza',
      totalMatches: 'Corrispondenze Totali',
      totalScreenedLists: 'Liste Esaminate Totali',
      matchList: 'Elenco Corrispondenze',
      title: 'Titolo',
      source: 'Fonte',
      showingResults: 'Visualizzazione di {count} risultati',
      screenResults: 'RISULTATI SCREENING',
      match: 'Corrispondenza',
      entityInformation: 'Informazioni Entità',
      scriptName: 'Nome in Altro Alfabeto',
      tag: 'Tag',
      nationality: 'Nazionalità',
      basicInformation: 'Informazioni di Base',
      publishedSource: 'Fonte Pubblicata',
      otherInformation: 'Altre Informazioni',
      alias: 'Alias',
      placeOfBirth: 'Luogo di Nascita',
      role: 'Ruolo',
      reason: 'Motivo',
      address: 'Indirizzo',
      remark: 'Osservazione',
      otherImportantDates: 'Altre Date Importanti',
      disclosureDate: 'Data Divulgazione',
      startDate: 'Data Inizio',
      delistingDate: 'Data Rimozione',
      associatedInfo: 'Informazioni Associate',
      registrationNumber: 'Numero di Registrazione',
      screenedLists: 'LISTE ESAMINATE',
      matchFound: 'Corrispondenze Trovate',
      issuer: 'Emittente',
      description: 'Descrizione',
      administeredUnder: 'amministrata secondo la legge',
      law: '',
      notice: 'AVVISO',
      customerService: 'SERVIZIO CLIENTI',
      customerServiceText: 'Se necessita di ulteriori informazioni o ha dubbi, contatti il nostro Servizio Clienti.',
      disclaimerConfidentiality: 'AVVERTENZA LEGALE E RISERVATEZZA',
      disclaimerFull: `QUESTE INFORMAZIONI SONO FORNITE DA ELP GREEN TECHNOLOGY SU VOSTRA RICHIESTA E SONO SOGGETTE AI TERMINI E CONDIZIONI DEL VOSTRO CONTRATTO DI SERVIZIO. QUESTE INFORMAZIONI SONO RISERVATE E NON DEVONO ESSERE DIVULGATE.

Questo rapporto viene fornito all'Utente in stretta riservatezza per l'uso esclusivo dell'Utente come uno dei fattori da considerare nella conoscenza del cliente, valutazione del credito, conformità, gestione del rischio e altre decisioni aziendali legittime.

Questo rapporto contiene informazioni compilate da varie fonti che non sono controllate da ELP Green Technology e, salvo diversa indicazione espressa in questo rapporto, tali informazioni non sono state verificate in modo indipendente. Di conseguenza, ELP Green Technology non rilascia alcuna dichiarazione o garanzia in merito all'accuratezza, completezza o tempestività delle informazioni qui contenute.

ELP Green Technology declina espressamente qualsiasi responsabilità per qualsiasi perdita o danno derivante da o in connessione con l'uso o l'affidamento sui contenuti di questo rapporto.

Questo rapporto è strettamente confidenziale e di proprietà di ELP Green Technology e non può essere riprodotto, pubblicato, trasmesso o divulgato, in tutto o in parte, a terzi senza il previo consenso scritto di ELP Green Technology.`,
      copyright: 'COPYRIGHT © 2026 ELP GREEN TECHNOLOGY. TUTTI I DIRITTI RISERVATI.',
      copyrightNotice: 'QUESTO RAPPORTO NON PUÒ ESSERE RIPRODOTTO IN TUTTO O IN PARTE IN QUALSIASI FORMA O CON QUALSIASI MEZZO.',
    },
  };

  // Generate QR code when result is available
  useEffect(() => {
    if (currentResult?.report_token) {
      const verifyUrl = `https://elpgreen.com/verify/${currentResult.report_token}`;
      QRCode.toDataURL(verifyUrl, { 
        width: 100, 
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' }
      }).then(setQrCodeDataUrl).catch(console.error);
    }
  }, [currentResult?.report_token]);

  // Fetch screening history
  const { data: screeningHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ['aml-screening-history', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('aml_screening_reports')
        .select('id, created_at, subject_name, subject_country, total_matches, risk_level, status')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as ScreeningReport[];
    },
    enabled: !!user,
  });

  // Screening mutation - supports both individual and entity modes
  const screeningMutation = useMutation({
    mutationFn: async () => {
      const nameToScreen = screeningMode === 'individual' ? subjectName : entityName;
      const countryToScreen = screeningMode === 'individual' ? subjectCountry : entityCountry;
      
      if (!nameToScreen.trim()) {
        throw new Error(`${screeningMode === 'individual' ? 'Subject' : 'Entity'} name is required`);
      }

      // Filter lists based on listType selection
      const activeTypes = listType === 'ALL' 
        ? selectedTypes 
        : [listType];

      const { data, error } = await supabase.functions.invoke('aml-screening', {
        body: {
          subject_name: nameToScreen,
          subject_name_local: screeningMode === 'individual' ? subjectNameLocal : undefined,
          subject_id_number: screeningMode === 'individual' ? subjectIdNumber : undefined,
          subject_date_of_birth: screeningMode === 'individual' ? subjectDateOfBirth : undefined,
          subject_country: countryToScreen || undefined,
          subject_gender: screeningMode === 'individual' ? subjectGender : undefined,
          subject_company_name: screeningMode === 'individual' ? subjectCompanyName : entityName,
          subject_company_registration: screeningMode === 'individual' ? subjectCompanyReg : entityRegNumber,
          entity_type: screeningMode,
          screening_types: activeTypes,
          jurisdictions: selectedJurisdictions,
          match_rate_threshold: matchThreshold,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Screening failed');
      
      return data as ScreeningResult;
    },
    onSuccess: (data) => {
      setCurrentResult(data);
      setActiveTab('results');
      queryClient.invalidateQueries({ queryKey: ['aml-screening-history'] });
      toast.success(`Screening completed. Found ${data.summary.total_matches} matches.`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Toggle jurisdiction
  const toggleJurisdiction = (code: string) => {
    if (code === 'ALL') {
      setSelectedJurisdictions(['ALL']);
    } else {
      setSelectedJurisdictions(prev => {
        const newList = prev.filter(j => j !== 'ALL');
        if (newList.includes(code)) {
          return newList.filter(j => j !== code);
        }
        return [...newList, code];
      });
    }
  };

  // Toggle screening type
  const toggleType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // Get tag badge color
  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'SAN': return 'bg-red-500 text-white';
      case 'PEP': return 'bg-purple-500 text-white';
      case 'RCA': return 'bg-orange-500 text-white';
      case 'CRI': return 'bg-amber-600 text-white';
      case 'REG': return 'bg-green-500 text-white'; // Registry verified
      case 'WL': return 'bg-yellow-500 text-white'; // Watchlist
      case 'DEB': return 'bg-orange-600 text-white'; // Debarred
      default: return 'bg-gray-500 text-white';
    }
  };

  // Get tag label
  const getTagLabel = (tag: string) => {
    switch (tag) {
      case 'SAN': return 'Sanction';
      case 'PEP': return 'PEP';
      case 'RCA': return 'RCA';
      case 'CRI': return 'Criminal';
      case 'REG': return 'Verified';
      case 'WL': return 'Watchlist';
      case 'DEB': return 'Debarred';
      default: return tag;
    }
  };

  // Handle photo upload
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingPhoto(true);

    try {
      // Convert to base64 for preview and PDF inclusion
      const reader = new FileReader();
      reader.onload = (e) => {
        setSubjectPhoto(e.target?.result as string);
        setUploadingPhoto(false);
        toast.success('Photo uploaded successfully');
      };
      reader.onerror = () => {
        toast.error('Failed to read image');
        setUploadingPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to upload photo');
      setUploadingPhoto(false);
    }
  };

  // Remove photo
  const removePhoto = () => {
    setSubjectPhoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Generate Professional PDF Report - Compact style with language support
  const generatePDF = (language: string = 'en') => {
    if (!currentResult) return;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const marginLeft = 15;
    const marginRight = 15;
    const contentWidth = pageWidth - marginLeft - marginRight;
    let yPos = 0;
    let pageNumber = 1;
    const totalPages = Math.max(5, 2 + Math.ceil(currentResult.matches.length * 1.5) + Math.ceil(currentResult.screened_lists.length / 5));
    const t = pdfTranslations[language] || pdfTranslations.en;

    // ELP Brand Colors - Navy Blue (#1a2744)
    const navyBlue = [26, 39, 68];
    const navyLight = [45, 65, 110];
    const primaryBlue = navyLight;
    const darkText = [33, 33, 33];
    const grayText = [100, 100, 100];
    const lightGray = [245, 245, 245];

    // Helper: Add page header - COMPACT (max 1px spacing)
    const addHeader = () => {
      // Thin navy line at top (1px = ~0.26mm)
      pdf.setFillColor(navyBlue[0], navyBlue[1], navyBlue[2]);
      pdf.rect(0, 0, pageWidth, 0.3, 'F');
      
      // Logo and text on same compact line
      pdf.setTextColor(navyBlue[0], navyBlue[1], navyBlue[2]);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ELP', marginLeft, 8);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Green Technology', marginLeft + 10, 8);
      
      // Subtitle on right - compact
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.text(t.department, pageWidth - marginRight, 6, { align: 'right' });
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'normal');
      pdf.text('www.elpgreen.com', pageWidth - marginRight, 10, { align: 'right' });
      
      // Thin separator line
      pdf.setDrawColor(navyBlue[0], navyBlue[1], navyBlue[2]);
      pdf.setLineWidth(0.3);
      pdf.line(marginLeft, 14, pageWidth - marginRight, 14);
    };

    // Helper: Add page footer - COMPACT (max 1px spacing)
    const addFooter = () => {
      const footerY = pageHeight - 6;
      
      // Thin line at bottom
      pdf.setDrawColor(navyBlue[0], navyBlue[1], navyBlue[2]);
      pdf.setLineWidth(0.3);
      pdf.line(marginLeft, footerY - 3, pageWidth - marginRight, footerY - 3);
      
      // Single line footer - compact
      pdf.setFontSize(5.5);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(grayText[0], grayText[1], grayText[2]);
      pdf.text(`ELP Green Technology | ${t.slogan} | ${t.confidential}`, marginLeft, footerY);
      
      pdf.setTextColor(navyBlue[0], navyBlue[1], navyBlue[2]);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${t.page} ${pageNumber} ${t.of} ${totalPages}`, pageWidth - marginRight, footerY, { align: 'right' });
    };

    // Helper: Add new page
    const addNewPage = () => {
      addFooter();
      pdf.addPage();
      pageNumber++;
      addHeader();
      yPos = 18; // Compact header ends at ~16mm
    };

    // Helper: Check page overflow - adjusted for compact footer
    const checkPageOverflow = (neededSpace: number = 30) => {
      if (yPos > pageHeight - 12) {
        addNewPage();
      }
    };

    // Helper: Draw section header (bold navy text with left border)
    const drawSectionHeader = (title: string) => {
      checkPageOverflow(20);
      // Left border line - Navy
      pdf.setFillColor(navyBlue[0], navyBlue[1], navyBlue[2]);
      pdf.rect(marginLeft, yPos - 4, 2, 8, 'F');
      
      pdf.setTextColor(navyBlue[0], navyBlue[1], navyBlue[2]);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, marginLeft + 6, yPos);
      yPos += 10;
    };

    // Helper: Draw key-value in two columns
    const drawInfoGrid = (items: { label: string; value: string }[], cols: number = 2) => {
      const colWidth = contentWidth / cols;
      items.forEach((item, idx) => {
        const col = idx % cols;
        const x = marginLeft + col * colWidth;
        
        if (col === 0 && idx > 0) {
          yPos += 12;
        }
        
        pdf.setTextColor(navyLight[0], navyLight[1], navyLight[2]);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text(item.label, x, yPos);
        
        pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const displayValue = item.value || '-';
        pdf.text(displayValue.substring(0, 40), x, yPos + 5);
      });
      yPos += 15;
    };

    // === PAGE 1: COVER PAGE - WHITE BACKGROUND WITH NAVY STRIPES ===
    // White background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // TOP STRIPE - Navy Blue
    pdf.setFillColor(navyBlue[0], navyBlue[1], navyBlue[2]);
    pdf.rect(0, 0, pageWidth, 8, 'F');
    
    // Accent line below
    pdf.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    pdf.rect(0, 8, pageWidth, 2, 'F');
    
    // BOTTOM STRIPE - Navy Blue
    pdf.setFillColor(navyBlue[0], navyBlue[1], navyBlue[2]);
    pdf.rect(0, pageHeight - 20, pageWidth, 20, 'F');
    
    // Logo area - centered
    pdf.setTextColor(navyBlue[0], navyBlue[1], navyBlue[2]);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ELP Green Technology', pageWidth / 2, 30, { align: 'center' });
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(grayText[0], grayText[1], grayText[2]);
    pdf.text(t.complianceDueDiligence, pageWidth / 2, 38, { align: 'center' });
    
    // Decorative line
    pdf.setDrawColor(navyBlue[0], navyBlue[1], navyBlue[2]);
    pdf.setLineWidth(0.8);
    pdf.line(pageWidth / 2 - 50, 45, pageWidth / 2 + 50, 45);
    
    // Document type badge
    const badgeWidth = 85;
    pdf.setFillColor(34, 139, 34);
    pdf.roundedRect(pageWidth / 2 - badgeWidth / 2, 52, badgeWidth, 10, 3, 3, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text(t.report, pageWidth / 2, 58.5, { align: 'center' });
    
    yPos = 80;

    // Main Title - Subject name
    pdf.setTextColor(navyBlue[0], navyBlue[1], navyBlue[2]);
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.text(currentResult.summary.subject_name, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Local name if exists
    if (subjectNameLocal) {
      pdf.setTextColor(grayText[0], grayText[1], grayText[2]);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(subjectNameLocal, pageWidth / 2, yPos, { align: 'center' });
      yPos += 8;
    }
    
    yPos += 10;
    if (subjectNameLocal) {
      pdf.setTextColor(grayText[0], grayText[1], grayText[2]);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text(subjectNameLocal, marginLeft, yPos);
      yPos += 8;
    }

    // Risk badge (MPL style)
    const riskBadgeColors: { [key: string]: number[] } = {
      'low': [76, 175, 80],
      'medium': [255, 193, 7],
      'high': [255, 152, 0],
      'critical': [244, 67, 54]
    };
    const badgeColor = riskBadgeColors[currentResult.summary.risk_level] || riskBadgeColors['medium'];
    
    pdf.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
    pdf.roundedRect(marginLeft, yPos, 25, 8, 2, 2, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    const riskText = currentResult.summary.risk_level === 'low' ? 'LOW' : 
                     currentResult.summary.risk_level === 'medium' ? 'MPL' :
                     currentResult.summary.risk_level === 'high' ? 'HIGH' : 'CRITICAL';
    pdf.text(riskText, marginLeft + 12.5, yPos + 5.5, { align: 'center' });
    
    // Subject photo if available (positioned to the right of name)
    if (subjectPhoto) {
      try {
        pdf.addImage(subjectPhoto, 'JPEG', pageWidth - marginRight - 30, yPos - 45, 25, 30);
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(pageWidth - marginRight - 30, yPos - 45, 25, 30, 'S');
      } catch (e) {
        console.error('Failed to add photo to PDF:', e);
      }
    }
    
    yPos += 50;

    // Verify box
    pdf.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    pdf.roundedRect(marginLeft, yPos, contentWidth, 30, 3, 3, 'F');
    
    // Real QR code or placeholder
    if (qrCodeDataUrl) {
      try {
        pdf.addImage(qrCodeDataUrl, 'PNG', marginLeft + 5, yPos + 5, 20, 20);
      } catch (e) {
        console.error('Failed to add QR code to PDF:', e);
        // Fallback placeholder
        pdf.setFillColor(255, 255, 255);
        pdf.rect(marginLeft + 5, yPos + 5, 20, 20, 'F');
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(marginLeft + 5, yPos + 5, 20, 20, 'S');
      }
    } else {
      // Placeholder if QR not generated
      pdf.setFillColor(255, 255, 255);
      pdf.rect(marginLeft + 5, yPos + 5, 20, 20, 'F');
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(marginLeft + 5, yPos + 5, 20, 20, 'S');
      pdf.setTextColor(180, 180, 180);
      pdf.setFontSize(6);
      pdf.text('QR', marginLeft + 15, yPos + 17, { align: 'center' });
    }
    
    // Verify text
    pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text(t.verifyDocumentInstantly, marginLeft + 32, yPos + 12);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(grayText[0], grayText[1], grayText[2]);
    pdf.text(t.verifyDescription, marginLeft + 32, yPos + 18);
    pdf.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    const verifyUrl = currentResult.report_token 
      ? `https://elpgreen.com/verify/${currentResult.report_token}`
      : 'https://elpgreen.com/verify';
    pdf.text(verifyUrl, marginLeft + 32, yPos + 24);
    yPos += 45;

    // Generated timestamp
    const now = new Date();
    const dateLocale = language === 'zh' ? 'zh-CN' : language === 'pt' ? 'pt-BR' : language === 'es' ? 'es-ES' : language === 'it' ? 'it-IT' : 'en-GB';
    const formattedDate = now.toLocaleDateString(dateLocale, { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedTime = now.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${t.reportGeneratedOn} ${formattedDate} ${t.at} ${formattedTime} (UTC-3),`, marginLeft, yPos);
    yPos += 5;
    pdf.text(t.snapshotDisclaimer, marginLeft, yPos);
    yPos += 15;

    // Disclaimer
    pdf.setTextColor(grayText[0], grayText[1], grayText[2]);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    const disclaimerLines = pdf.splitTextToSize(t.disclaimer, contentWidth);
    pdf.text(disclaimerLines, marginLeft, yPos);

    addFooter();

    // === PAGE 2: Screened Subject Information ===
    addNewPage();
    
    // Date stamp
    pdf.setTextColor(grayText[0], grayText[1], grayText[2]);
    pdf.setFontSize(9);
    pdf.text(`${formattedDate} at ${formattedTime} (UTC-3)`, marginLeft, yPos);
    yPos += 12;

    // SCREENED SUBJECT INFORMATION
    drawSectionHeader(t.screenedSubjectInfo);

    // Info grid (2 columns like QCC)
    drawInfoGrid([
      { label: t.name, value: currentResult.summary.subject_name },
      { label: t.idNo, value: subjectIdNumber },
      { label: t.dateOfBirth, value: subjectDateOfBirth },
      { label: t.countryRegion, value: subjectCountry },
      { label: t.gender, value: subjectGender },
      { label: t.associatedCompanyName, value: subjectCompanyName },
      { label: t.associatedCompanyRegNo, value: subjectCompanyReg },
    ]);

    // Statement
    pdf.setTextColor(grayText[0], grayText[1], grayText[2]);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.text(`${t.statement} ${t.statementText}`, marginLeft, yPos);
    yPos += 15;

    // SCAN SUMMARY
    drawSectionHeader(t.scanSummary);

    // Screening type with icon
    pdf.setTextColor(grayText[0], grayText[1], grayText[2]);
    pdf.setFontSize(9);
    pdf.text(t.screeningType, marginLeft, yPos);
    pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
    pdf.setFont('helvetica', 'normal');
    pdf.text(currentResult.summary.screening_types.map(tp => tp.charAt(0).toUpperCase() + tp.slice(1)).join(', '), marginLeft + 40, yPos);
    yPos += 8;

    // Jurisdiction
    pdf.setTextColor(grayText[0], grayText[1], grayText[2]);
    pdf.text(t.jurisdiction, marginLeft, yPos);
    pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
    const jurisdictionText = currentResult.summary.jurisdictions.join(', ');
    const jurisdictionLines = pdf.splitTextToSize(jurisdictionText, contentWidth - 40);
    pdf.text(jurisdictionLines, marginLeft + 40, yPos);
    yPos += jurisdictionLines.length * 5 + 8;

    // Summary boxes (Match Rate, Total Matches, Total Screened Lists)
    const boxWidth = (contentWidth - 20) / 3;
    const boxHeight = 25;
    const boxY = yPos;

    // Match Rate box
    pdf.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    pdf.roundedRect(marginLeft, boxY, boxWidth, boxHeight, 2, 2, 'F');
    pdf.setTextColor(grayText[0], grayText[1], grayText[2]);
    pdf.setFontSize(9);
    pdf.text(t.matchRate, marginLeft + boxWidth/2, boxY + 8, { align: 'center' });
    pdf.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`≥${currentResult.summary.match_rate_threshold}%`, marginLeft + boxWidth/2, boxY + 18, { align: 'center' });

    // Total Matches box
    const matchBgColor = currentResult.summary.total_matches > 0 ? [254, 243, 243] : lightGray;
    pdf.setFillColor(matchBgColor[0], matchBgColor[1], matchBgColor[2]);
    pdf.roundedRect(marginLeft + boxWidth + 10, boxY, boxWidth, boxHeight, 2, 2, 'F');
    pdf.setTextColor(grayText[0], grayText[1], grayText[2]);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(t.totalMatches, marginLeft + boxWidth + 10 + boxWidth/2, boxY + 8, { align: 'center' });
    pdf.setTextColor(currentResult.summary.total_matches > 0 ? 220 : primaryBlue[0], currentResult.summary.total_matches > 0 ? 53 : primaryBlue[1], currentResult.summary.total_matches > 0 ? 69 : primaryBlue[2]);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(currentResult.summary.total_matches.toString(), marginLeft + boxWidth + 10 + boxWidth/2, boxY + 18, { align: 'center' });

    // Total Screened Lists box
    pdf.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    pdf.roundedRect(marginLeft + (boxWidth + 10) * 2, boxY, boxWidth, boxHeight, 2, 2, 'F');
    pdf.setTextColor(grayText[0], grayText[1], grayText[2]);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(t.totalScreenedLists, marginLeft + (boxWidth + 10) * 2 + boxWidth/2, boxY + 8, { align: 'center' });
    pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(currentResult.summary.total_screened_lists.toString(), marginLeft + (boxWidth + 10) * 2 + boxWidth/2, boxY + 18, { align: 'center' });

    yPos = boxY + boxHeight + 15;

    // Match List section
    if (currentResult.matches.length > 0) {
      checkPageOverflow(50);
      
      // Match List header with left border
      pdf.setFillColor(darkText[0], darkText[1], darkText[2]);
      pdf.rect(marginLeft, yPos - 4, 2, 8, 'F');
      pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(t.matchList, marginLeft + 6, yPos);
      yPos += 10;

      // Table header
      pdf.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      pdf.rect(marginLeft, yPos, contentWidth, 8, 'F');
      pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text(t.title, marginLeft + 3, yPos + 5);
      pdf.text(t.source, marginLeft + 50, yPos + 5);
      pdf.text(t.matchRate, pageWidth - marginRight - 3, yPos + 5, { align: 'right' });
      yPos += 12;

      // Table rows
      currentResult.matches.forEach((match, idx) => {
        checkPageOverflow(15);
        
        if (idx % 2 === 0) {
          pdf.setFillColor(255, 255, 255);
        } else {
          pdf.setFillColor(250, 250, 250);
        }
        pdf.rect(marginLeft, yPos - 4, contentWidth, 12, 'F');

        pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        const matchTitle = match.matched_name.length > 15 ? match.matched_name.substring(0, 15) : match.matched_name;
        pdf.text(matchTitle, marginLeft + 3, yPos);
        
        if (match.matched_name_local) {
          yPos += 4;
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(grayText[0], grayText[1], grayText[2]);
          pdf.text(match.matched_name_local.substring(0, 10), marginLeft + 3, yPos);
          yPos -= 4;
        }

        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(grayText[0], grayText[1], grayText[2]);
        pdf.setFontSize(8);
        const sourceText = match.source_name.length > 50 ? match.source_name.substring(0, 50) + '...' : match.source_name;
        pdf.text(sourceText, marginLeft + 50, yPos);

        pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${match.match_rate.toFixed(1)}%`, pageWidth - marginRight - 3, yPos, { align: 'right' });

        yPos += 12;
      });

      // Showing X results
      pdf.setTextColor(grayText[0], grayText[1], grayText[2]);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(t.showingResults.replace('{count}', currentResult.matches.length.toString()), marginLeft, yPos);
      yPos += 15;
    }

    // SCREEN RESULTS header
    checkPageOverflow(30);
    drawSectionHeader(t.screenResults);

    // Each match detail
    currentResult.matches.forEach((match, idx) => {
      checkPageOverflow(80);

      // Match header box
      pdf.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      pdf.roundedRect(marginLeft, yPos - 3, contentWidth, 15, 2, 2, 'F');

      // Match badge
      pdf.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      pdf.roundedRect(marginLeft + 3, yPos, 18, 6, 1, 1, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${t.match} ${idx + 1}`, marginLeft + 12, yPos + 4, { align: 'center' });

      // Name
      pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(match.matched_name, marginLeft + 25, yPos + 5);

      // Match rate on right
      pdf.setTextColor(grayText[0], grayText[1], grayText[2]);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${t.matchRate}:`, pageWidth - marginRight - 25, yPos + 2);
      pdf.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${match.match_rate.toFixed(1)}%`, pageWidth - marginRight - 3, yPos + 8, { align: 'right' });

      yPos += 18;

      // Entity Information
      pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(t.entityInformation, marginLeft, yPos);
      yPos += 8;

      // Two column grid for entity info
      const col1X = marginLeft;
      const col2X = marginLeft + contentWidth / 2;

      // Row 1: Script Name | Tag
      pdf.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(t.scriptName, col1X, yPos);
      pdf.text(t.tag, col2X, yPos);
      yPos += 5;
      pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
      pdf.text(match.matched_name_local || '-', col1X, yPos);
      pdf.text(match.tag || '-', col2X, yPos);
      yPos += 8;

      // Row 2: Nationality | ID No.
      pdf.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      pdf.text(t.nationality, col1X, yPos);
      pdf.text(t.idNo, col2X, yPos);
      yPos += 5;
      pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
      pdf.text(match.nationality || '-', col1X, yPos);
      pdf.text(match.id_number || '-', col2X, yPos);
      yPos += 10;

      // Basic Information
      pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(t.basicInformation, marginLeft, yPos);
      yPos += 8;

      pdf.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(t.publishedSource, col1X, yPos);
      pdf.text(t.gender, col2X, yPos);
      yPos += 5;
      pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
      const srcText = match.source_name.length > 40 ? match.source_name.substring(0, 40) + '...' : match.source_name;
      pdf.text(srcText, col1X, yPos);
      pdf.text(match.gender || '-', col2X, yPos);
      yPos += 8;

      pdf.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      pdf.text(t.dateOfBirth, col1X, yPos);
      yPos += 5;
      pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
      pdf.text(match.date_of_birth || '-', col1X, yPos);
      yPos += 10;

      // Other Information
      if (match.alias?.length || match.reason || match.address || match.remark) {
        pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(t.otherInformation, marginLeft, yPos);
        yPos += 8;

        if (match.alias?.length) {
          pdf.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          pdf.text(t.alias, col1X, yPos);
          pdf.text(t.placeOfBirth, col2X, yPos);
          yPos += 5;
          pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
          pdf.text(match.alias.slice(0, 2).join(', '), col1X, yPos);
          pdf.text(match.place_of_birth || '-', col2X, yPos);
          yPos += 8;
        }

        if (match.role_description) {
          checkPageOverflow(15);
          pdf.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
          pdf.text(t.role, col1X, yPos);
          yPos += 5;
          pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
          const roleLines = pdf.splitTextToSize(match.role_description, contentWidth);
          pdf.text(roleLines.slice(0, 2), col1X, yPos);
          yPos += roleLines.slice(0, 2).length * 4 + 4;
        }

        if (match.reason) {
          checkPageOverflow(20);
          pdf.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
          pdf.text(t.reason, col1X, yPos);
          yPos += 5;
          pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
          const reasonLines = pdf.splitTextToSize(match.reason, contentWidth);
          pdf.text(reasonLines.slice(0, 3), col1X, yPos);
          yPos += reasonLines.slice(0, 3).length * 4 + 4;
        }

        if (match.address) {
          pdf.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
          pdf.text(t.address, col1X, yPos);
          yPos += 5;
          pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
          pdf.text(match.address.substring(0, 80), col1X, yPos);
          yPos += 8;
        }

        if (match.remark) {
          checkPageOverflow(15);
          pdf.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
          pdf.text(t.remark, col1X, yPos);
          yPos += 5;
          pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
          const remarkLines = pdf.splitTextToSize(match.remark, contentWidth);
          pdf.text(remarkLines.slice(0, 2), col1X, yPos);
          yPos += remarkLines.slice(0, 2).length * 4 + 4;
        }

        // Other Important Dates
        if (match.disclosure_date || match.start_date || match.delisting_date) {
          pdf.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
          pdf.text(t.otherImportantDates, col1X, yPos);
          yPos += 5;
          pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
          const dates = [];
          if (match.disclosure_date) dates.push(`${match.disclosure_date} (${t.disclosureDate})`);
          if (match.start_date) dates.push(`${match.start_date} (${t.startDate})`);
          if (match.delisting_date) dates.push(`${match.delisting_date} (${t.delistingDate})`);
          dates.forEach(d => {
            pdf.text(`• ${d}`, col1X + 3, yPos);
            yPos += 5;
          });
          yPos += 3;
        }
      }

      // Associated Info
      if (match.associated_companies?.length) {
        checkPageOverflow(20);
        pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(t.associatedInfo, marginLeft, yPos);
        yPos += 8;

        match.associated_companies.slice(0, 2).forEach(company => {
          pdf.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
          pdf.roundedRect(marginLeft, yPos - 2, contentWidth, 12, 2, 2, 'F');
          
          pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.text(company.name, marginLeft + 3, yPos + 3);
          
          if (company.registration_number) {
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(grayText[0], grayText[1], grayText[2]);
            pdf.setFontSize(8);
            pdf.text(`${t.registrationNumber}: ${company.registration_number}`, marginLeft + 3, yPos + 8);
          }
          yPos += 15;
        });
      }

      yPos += 10;
    });

    // SCREENED LISTS
    addNewPage();
    drawSectionHeader(t.screenedLists);

    // Group by type
    const listsByType: { [key: string]: typeof currentResult.screened_lists } = {};
    currentResult.screened_lists.forEach(list => {
      const type = list.type || 'Other';
      if (!listsByType[type]) listsByType[type] = [];
      listsByType[type].push(list);
    });

    Object.entries(listsByType).forEach(([type, lists]) => {
      checkPageOverflow(25);
      
      // Type header
      pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(type.charAt(0).toUpperCase() + type.slice(1), marginLeft, yPos);
      yPos += 8;

      lists.forEach((list) => {
        checkPageOverflow(25);

        // List name (bold, wrapped)
        pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        const listNameLines = pdf.splitTextToSize(list.name, contentWidth - 40);
        pdf.text(listNameLines[0], marginLeft, yPos);
        if (listNameLines.length > 1) {
          yPos += 4;
          pdf.text(listNameLines[1], marginLeft, yPos);
        }

        // Match found on right
        const matchFoundColor = list.matches_found > 0 ? [220, 53, 69] : grayText;
        pdf.setTextColor(matchFoundColor[0], matchFoundColor[1], matchFoundColor[2]);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${t.matchFound}: ${list.matches_found}`, pageWidth - marginRight, yPos - (listNameLines.length > 1 ? 4 : 0), { align: 'right' });
        yPos += 5;

        // URL if exists
        pdf.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        pdf.setFontSize(8);
        pdf.text(`https://source.example.com/${list.name.toLowerCase().replace(/\s+/g, '-').substring(0, 30)}`, marginLeft, yPos);
        yPos += 8;

        // Issuer and Description
        pdf.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
        pdf.rect(marginLeft, yPos, contentWidth, 20, 'F');
        
        pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.text(t.issuer, marginLeft + 3, yPos + 5);
        pdf.text(t.description, marginLeft + 30, yPos + 5);
        yPos += 8;

        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(grayText[0], grayText[1], grayText[2]);
        pdf.text(list.issuer.substring(0, 20), marginLeft + 3, yPos + 3);
        const descText = `${list.name} ${t.administeredUnder} ${list.jurisdiction} ${t.law}`.trim();
        const descLines = pdf.splitTextToSize(descText, contentWidth - 35);
        pdf.text(descLines.slice(0, 2), marginLeft + 30, yPos + 3);

        yPos += 18;
      });
    });

    // NOTICE page
    addNewPage();
    drawSectionHeader(t.notice);

    pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CUSTOMER SERVICE', marginLeft, yPos);
    yPos += 6;

    pdf.setTextColor(grayText[0], grayText[1], grayText[2]);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text('If you require further information or have any concerns, please contact our Customer Service.', marginLeft, yPos);
    yPos += 10;

    pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ELP GREEN TECHNOLOGY', marginLeft, yPos);
    yPos += 5;
    pdf.setFont('helvetica', 'normal');
    pdf.text('Rua Tupi, 397 - São Paulo, Brasil', marginLeft, yPos);
    yPos += 5;
    pdf.text('Email: compliance@elpgreen.com', marginLeft, yPos);
    yPos += 15;

    // Disclaimer
    drawSectionHeader(t.disclaimerConfidentiality);

    pdf.setTextColor(grayText[0], grayText[1], grayText[2]);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    const disclaimerFullLines = pdf.splitTextToSize(t.disclaimerFull, contentWidth);
    pdf.text(disclaimerFullLines, marginLeft, yPos);
    yPos += disclaimerFullLines.length * 3.5 + 10;

    // Copyright
    pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text(t.copyright, marginLeft, yPos);
    yPos += 4;
    pdf.text(t.copyrightNotice, marginLeft, yPos);

    addFooter();

    // Save
    const fileName = `AML_Screening_${currentResult.summary.subject_name.replace(/\s+/g, '_')}.pdf`;
    pdf.save(fileName);
    toast.success('PDF downloaded successfully');
  };

  // Risk Level Badge Component
  const RiskBadge = ({ level }: { level: string }) => {
    const config = RISK_LEVELS[level as keyof typeof RISK_LEVELS] || RISK_LEVELS.low;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} text-white gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-orange-600">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">AML/KYC Screening - ELP Green</h2>
            <p className="text-sm text-muted-foreground">
              Busca real via <a href="https://opensanctions.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenSanctions API</a> - 30+ Listas Globais de Sanções
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Dados Reais
          </Badge>
          <Button variant="outline" onClick={() => setShowHistory(!showHistory)}>
            <History className="w-4 h-4 mr-2" />
            History ({screeningHistory?.length || 0})
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="form">
            <Search className="w-4 h-4 mr-2" />
            New Screening
          </TabsTrigger>
          <TabsTrigger value="results" disabled={!currentResult}>
            <FileText className="w-4 h-4 mr-2" />
            Results
          </TabsTrigger>
          <TabsTrigger value="lists">
            <Globe className="w-4 h-4 mr-2" />
            Screened Lists
          </TabsTrigger>
        </TabsList>

        {/* Form Tab */}
        <TabsContent value="form" className="space-y-6">
          {/* Single Screening Header Card */}
          <Card className="border-t-4 border-t-primary">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Single Screening
                  </CardTitle>
                  <CardDescription>
                    Screen individuals or entities against global sanction lists
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    BrasilAPI + OpenSanctions
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Individual / Entity Toggle */}
              <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
                <Button
                  variant={screeningMode === 'individual' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setScreeningMode('individual')}
                  className="gap-2"
                >
                  <User className="w-4 h-4" />
                  Individual
                </Button>
                <Button
                  variant={screeningMode === 'entity' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setScreeningMode('entity')}
                  className="gap-2"
                >
                  <Building2 className="w-4 h-4" />
                  Entity
                </Button>
              </div>

              {/* Filter Row - Compact */}
              <div className="grid grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg border">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">List Type:</Label>
                  <Select value={listType} onValueChange={setListType}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">ALL</SelectItem>
                      <SelectItem value="sanctions">Sanctions Only</SelectItem>
                      <SelectItem value="pep">PEP Only</SelectItem>
                      <SelectItem value="criminal">Criminal Only</SelectItem>
                      <SelectItem value="watchlist">Watchlist Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Jurisdiction:</Label>
                  <div className="relative">
                    <Button 
                      variant="outline" 
                      className="w-full h-9 justify-between text-sm"
                      onClick={() => setShowJurisdictionDropdown(!showJurisdictionDropdown)}
                    >
                      <span>
                        {selectedJurisdictions.includes('ALL') 
                          ? 'All' 
                          : `${selectedJurisdictions.length} Selected`}
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    {showJurisdictionDropdown && (
                      <div className="absolute z-50 mt-1 w-full bg-background border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {JURISDICTIONS.map(j => (
                          <div
                            key={j.code}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-muted cursor-pointer"
                            onClick={() => toggleJurisdiction(j.code)}
                          >
                            <Checkbox checked={selectedJurisdictions.includes(j.code)} />
                            <span>{j.flag}</span>
                            <span className="text-sm">{j.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">List:</Label>
                  <div className="relative">
                    <Button 
                      variant="outline" 
                      className="w-full h-9 justify-between text-sm"
                      onClick={() => setShowListDropdown(!showListDropdown)}
                    >
                      <span>
                        {listType === 'ALL' 
                          ? `${SCREENING_LISTS.length} Selected` 
                          : `${SCREENING_LISTS.filter(l => l.type === listType).length} Selected`}
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    {showListDropdown && (
                      <div className="absolute z-50 mt-1 w-80 bg-background border rounded-lg shadow-lg max-h-64 overflow-y-auto right-0">
                        {SCREENING_LISTS.map(list => (
                          <div
                            key={list.id}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-muted cursor-pointer"
                          >
                            <Checkbox checked={listType === 'ALL' || listType === list.type} />
                            <span className="text-sm">{list.name}</span>
                            <Badge variant="outline" className="text-[10px] ml-auto">
                              {list.type}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Match Rate:</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">≥{matchThreshold}%</span>
                    <Input
                      type="range"
                      min="50"
                      max="100"
                      value={matchThreshold}
                      onChange={(e) => setMatchThreshold(Number(e.target.value))}
                      className="flex-1 h-9"
                    />
                  </div>
                </div>
              </div>

              {/* Individual Form */}
              {screeningMode === 'individual' && (
                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-2 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Name *</Label>
                        <Input
                          placeholder="Full name (e.g., Zhang San)"
                          value={subjectName}
                          onChange={(e) => setSubjectName(e.target.value)}
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">ID No.</Label>
                        <Input
                          placeholder="ID/Passport number"
                          value={subjectIdNumber}
                          onChange={(e) => setSubjectIdNumber(e.target.value)}
                          className="h-10"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Date of Birth</Label>
                        <Input
                          type="date"
                          value={subjectDateOfBirth}
                          onChange={(e) => setSubjectDateOfBirth(e.target.value)}
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Country/Region</Label>
                        <Select value={subjectCountry} onValueChange={setSubjectCountry}>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            {JURISDICTIONS.filter(j => j.code !== 'ALL' && j.code !== 'INT').map(j => (
                              <SelectItem key={j.code} value={j.name}>
                                {j.flag} {j.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Gender</Label>
                      <Select value={subjectGender} onValueChange={setSubjectGender}>
                        <SelectTrigger className="h-10 w-1/2">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Associated Company Name</Label>
                        <Input
                          placeholder="Company name"
                          value={subjectCompanyName}
                          onChange={(e) => setSubjectCompanyName(e.target.value)}
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Associated Company Registration Number</Label>
                        <Input
                          placeholder="Registration number"
                          value={subjectCompanyReg}
                          onChange={(e) => setSubjectCompanyReg(e.target.value)}
                          className="h-10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Photo Upload */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Subject Photo</Label>
                    <div className="relative">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        id="subject-photo-upload"
                      />
                      {subjectPhoto ? (
                        <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border border-border">
                          <img 
                            src={subjectPhoto} 
                            alt="Subject" 
                            className="w-full h-full object-cover"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={removePhoto}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <label
                          htmlFor="subject-photo-upload"
                          className="flex flex-col items-center justify-center w-full aspect-[3/4] rounded-lg border-2 border-dashed border-muted-foreground/30 cursor-pointer hover:border-primary/50 transition-colors bg-muted/20"
                        >
                          {uploadingPhoto ? (
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                          ) : (
                            <>
                              <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                              <span className="text-xs text-muted-foreground">Upload Photo</span>
                            </>
                          )}
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Entity Form */}
              {screeningMode === 'entity' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Name *</Label>
                      <Input
                        placeholder="Entity/Company name"
                        value={entityName}
                        onChange={(e) => setEntityName(e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Country/Region</Label>
                      <Select value={entityCountry} onValueChange={setEntityCountry}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {JURISDICTIONS.filter(j => j.code !== 'ALL' && j.code !== 'INT').map(j => (
                            <SelectItem key={j.code} value={j.name}>
                              {j.flag} {j.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Company Registration Number</Label>
                    <Input
                      placeholder="Registration/CNPJ/EIN number"
                      value={entityRegNumber}
                      onChange={(e) => setEntityRegNumber(e.target.value)}
                      className="h-10 w-1/2"
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => screeningMutation.mutate()}
                  disabled={screeningMutation.isPending || 
                    (screeningMode === 'individual' ? !subjectName.trim() : !entityName.trim())}
                  className="px-8 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                  size="lg"
                >
                  {screeningMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Scanning Global Databases...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Run Screening
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {currentResult && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{currentResult.summary.total_matches}</div>
                    <p className="text-sm text-muted-foreground">Total Matches</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{currentResult.summary.total_screened_lists}</div>
                    <p className="text-sm text-muted-foreground">Lists Screened</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <RiskBadge level={currentResult.summary.risk_level} />
                    <p className="text-sm text-muted-foreground mt-1">Risk Assessment</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{currentResult.elapsed_ms}ms</div>
                    <p className="text-sm text-muted-foreground">Tempo</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(currentResult.summary as any).api_sources?.map((src: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-[10px]">
                          {src}
                        </Badge>
                      )) || (
                        <Badge variant="outline" className="text-xs">OpenSanctions</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button onClick={() => setShowLanguageModal(true)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF Report
                </Button>
                <Button variant="outline" onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(currentResult, null, 2));
                  toast.success('Report copied to clipboard');
                }}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy JSON
                </Button>
              </div>

              {/* Match Results */}
              <Card>
                <CardHeader>
                  <CardTitle>Match Results</CardTitle>
                  <CardDescription>
                    Showing {currentResult.matches.length} matches with ≥{currentResult.summary.match_rate_threshold}% similarity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {currentResult.matches.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                      <p>No matches found above the threshold</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {currentResult.matches.map((match, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card className={`border-l-4 ${match.tag === 'REG' ? 'border-l-green-500' : 'border-l-red-500'}`}>
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="font-bold text-lg">{match.matched_name}</span>
                                    {match.matched_name_local && (
                                      <span className="text-muted-foreground">({match.matched_name_local})</span>
                                    )}
                                    <Badge className={getTagColor(match.tag)}>{getTagLabel(match.tag)}</Badge>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Source:</span>
                                      <p className="font-medium truncate">{match.source_name}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Jurisdiction:</span>
                                      <p className="font-medium">{match.source_jurisdiction}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Nationality:</span>
                                      <p className="font-medium">{match.nationality || '-'}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">ID:</span>
                                      <p className="font-medium truncate">{match.id_number || '-'}</p>
                                    </div>
                                  </div>
                                  
                                  {match.reason && (
                                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                      <strong>Reason:</strong> {match.reason}
                                    </p>
                                  )}
                                </div>
                                
                                <div className="text-right ml-4">
                                  <div className={`text-2xl font-bold ${match.tag === 'REG' ? 'text-green-600' : 'text-red-600'}`}>{match.match_rate}%</div>
                                  <p className="text-xs text-muted-foreground">{match.tag === 'REG' ? 'Verified' : 'Match Rate'}</p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-2"
                                    onClick={() => setSelectedMatch(match)}
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    Details
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Lists Tab */}
        <TabsContent value="lists">
          <Card>
            <CardHeader>
              <CardTitle>Screened Lists ({currentResult?.screened_lists.length || 33})</CardTitle>
              <CardDescription>
                Global sanctions, PEP, and watchlist sources used for screening
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>List Name</TableHead>
                    <TableHead>Issuer</TableHead>
                    <TableHead>Jurisdiction</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Matches</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(currentResult?.screened_lists || []).map((list, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {list.url ? (
                          <a href={list.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                            {list.name}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          list.name
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={list.issuer}>{list.issuer}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{list.jurisdiction}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{list.type}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {list.matches_found > 0 ? (
                          <Badge variant="destructive">{list.matches_found}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Match Detail Dialog */}
      <Dialog open={!!selectedMatch} onOpenChange={() => setSelectedMatch(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge className={getTagColor(selectedMatch?.tag || 'SAN')}>
                {selectedMatch?.tag}
              </Badge>
              {selectedMatch?.matched_name}
              <span className="text-red-600 ml-auto">{selectedMatch?.match_rate}%</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedMatch && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Local Name</Label>
                  <p className="font-medium">{selectedMatch.matched_name_local || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Entity Type</Label>
                  <p className="font-medium capitalize">{selectedMatch.entity_type}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Nationality</Label>
                  <p className="font-medium">{selectedMatch.nationality || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">ID Number</Label>
                  <p className="font-medium">{selectedMatch.id_number || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date of Birth</Label>
                  <p className="font-medium">{selectedMatch.date_of_birth || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Gender</Label>
                  <p className="font-medium">{selectedMatch.gender || '-'}</p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <Label className="text-muted-foreground">Source</Label>
                <p className="font-medium">{selectedMatch.source_issuer}</p>
                <p className="text-sm text-muted-foreground">{selectedMatch.source_name}</p>
              </div>
              
              {selectedMatch.role_description && (
                <div>
                  <Label className="text-muted-foreground">Role/Position</Label>
                  <p className="font-medium">{selectedMatch.role_description}</p>
                </div>
              )}
              
              {selectedMatch.reason && (
                <div>
                  <Label className="text-muted-foreground">Reason for Listing</Label>
                  <p className="font-medium">{selectedMatch.reason}</p>
                </div>
              )}
              
              {selectedMatch.address && (
                <div>
                  <Label className="text-muted-foreground">Address</Label>
                  <p className="font-medium">{selectedMatch.address}</p>
                </div>
              )}
              
              {selectedMatch.remark && (
                <div>
                  <Label className="text-muted-foreground">Remarks</Label>
                  <p className="font-medium">{selectedMatch.remark}</p>
                </div>
              )}
              
              {selectedMatch.associated_companies && selectedMatch.associated_companies.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Associated Companies</Label>
                  {selectedMatch.associated_companies.map((company, idx) => (
                    <div key={idx} className="flex items-center gap-2 mt-1">
                      <Building2 className="w-4 h-4" />
                      <span className="font-medium">{company.name}</span>
                      {company.registration_number && (
                        <span className="text-muted-foreground">({company.registration_number})</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                {selectedMatch.disclosure_date && (
                  <div>
                    <Label className="text-muted-foreground">Disclosure Date</Label>
                    <p className="font-medium">{selectedMatch.disclosure_date}</p>
                  </div>
                )}
                {selectedMatch.start_date && (
                  <div>
                    <Label className="text-muted-foreground">Start Date</Label>
                    <p className="font-medium">{selectedMatch.start_date}</p>
                  </div>
                )}
                {selectedMatch.delisting_date && (
                  <div>
                    <Label className="text-muted-foreground">Delisting Date</Label>
                    <p className="font-medium">{selectedMatch.delisting_date}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* History Panel */}
      <Collapsible open={showHistory} onOpenChange={setShowHistory}>
        <CollapsibleContent>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-4 h-4" />
                Screening History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : screeningHistory && screeningHistory.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Matches</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {screeningHistory.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="text-sm">
                          {new Date(report.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium">{report.subject_name}</TableCell>
                        <TableCell>{report.subject_country || '-'}</TableCell>
                        <TableCell>
                          {report.total_matches > 0 ? (
                            <Badge variant="destructive">{report.total_matches}</Badge>
                          ) : (
                            <Badge variant="secondary">0</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <RiskBadge level={report.risk_level} />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{report.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">No screening history found</p>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Language Selection Modal for PDF Download */}
      <Dialog open={showLanguageModal} onOpenChange={setShowLanguageModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Select PDF Language
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose the language for the PDF document headers and footers:
            </p>
            <div className="grid grid-cols-1 gap-2">
              {pdfLanguages.map((lang) => (
                <Button
                  key={lang.code}
                  variant={selectedPdfLanguage === lang.code ? "default" : "outline"}
                  className="justify-start gap-3 h-12"
                  onClick={() => setSelectedPdfLanguage(lang.code)}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span className="font-medium">{lang.name}</span>
                  {selectedPdfLanguage === lang.code && (
                    <CheckCircle className="w-4 h-4 ml-auto" />
                  )}
                </Button>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowLanguageModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  generatePDF(selectedPdfLanguage);
                  setShowLanguageModal(false);
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
