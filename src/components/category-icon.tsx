import {
  BarChart3,
  BookOpen,
  Building2,
  Calculator,
  Car,
  ClipboardList,
  CreditCard,
  Database,
  DollarSign,
  FileText,
  FolderOpen,
  Globe,
  HelpCircle,
  Receipt,
  Settings,
  Shield,
  Truck,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICONS: { name: string; icon: LucideIcon; label: string }[] = [
  { name: "Truck", icon: Truck, label: "Caminhão" },
  { name: "Car", icon: Car, label: "Carro" },
  { name: "Wallet", icon: Wallet, label: "Carteira" },
  { name: "CreditCard", icon: CreditCard, label: "Cartão" },
  { name: "DollarSign", icon: DollarSign, label: "Dólar" },
  { name: "Receipt", icon: Receipt, label: "Recibo" },
  { name: "Calculator", icon: Calculator, label: "Calculadora" },
  { name: "BarChart3", icon: BarChart3, label: "Gráfico" },
  { name: "FileText", icon: FileText, label: "Documento" },
  { name: "ClipboardList", icon: ClipboardList, label: "Checklist" },
  { name: "BookOpen", icon: BookOpen, label: "Livro" },
  { name: "HelpCircle", icon: HelpCircle, label: "Ajuda" },
  { name: "Settings", icon: Settings, label: "Configurações" },
  { name: "Shield", icon: Shield, label: "Segurança" },
  { name: "Users", icon: Users, label: "Usuários" },
  { name: "Building2", icon: Building2, label: "Empresa" },
  { name: "Database", icon: Database, label: "Banco de dados" },
  { name: "Globe", icon: Globe, label: "Web" },
  { name: "Wrench", icon: Wrench, label: "Ferramentas" },
  { name: "FolderOpen", icon: FolderOpen, label: "Pasta" },
];

export function CategoryIcon({
  name,
  className,
}: {
  name?: string | null;
  className?: string;
}) {
  const entry = CATEGORY_ICONS.find((item) => item.name === name);
  const Icon = entry?.icon ?? FolderOpen;
  return <Icon className={className} aria-hidden />;
}
