"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  FolderOpen,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { SidebarUserMenu } from "./sidebar-user-menu";
import Image from "next/image";

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

type SidebarUser = {
  name?: string | null;
  email?: string | null;
  role: "ADMIN" | "EDITOR";
};

const navContent: NavItem[] = [
  { title: "Visão geral", href: "/dashboard", icon: LayoutDashboard },
  { title: "Categorias", href: "/dashboard/categorias", icon: FolderOpen },
  { title: "Artigos", href: "/dashboard/artigos", icon: FileText },
];

const navAdmin: NavItem[] = [
  { title: "Usuários", href: "/dashboard/usuarios", icon: Users, adminOnly: true },
  { title: "Chaves de API (MCP)", href: "/dashboard/chaves-api", icon: KeyRound, adminOnly: true },
];

export function AppSidebar({ user }: { user: SidebarUser }) {
  const isAdmin = user.role === "ADMIN";
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  }

  function renderItems(items: NavItem[]) {
    return items
      .filter((item) => !item.adminOnly || isAdmin)
      .map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.title}>
            <Link href={item.href}>
              <item.icon />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ));
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="Central de Ajuda">
              <Link href="/dashboard" className="gap-2">
                <Image
                  src="/wcheck-logo.webp"
                  alt="W Check Brasil"
                  width={140}
                  height={31}
                  className="h-auto w-[120px] object-contain group-data-[collapsible=icon]:hidden"
                />
                <span className="text-lg font-bold text-white group-data-[collapsible=icon]:block hidden">
                  W
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Conteúdo</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(navContent)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin ? (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{renderItems(navAdmin)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Ver central de ajuda">
                  <Link href="/" target="_blank">
                    <LifeBuoy />
                    <span>Ver central de ajuda</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarUserMenu name={user.name} email={user.email} role={user.role} />
      </SidebarFooter>
    </Sidebar>
  );
}
