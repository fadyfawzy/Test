"use client"

import { useRouter, usePathname } from "next/navigation"
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
  SidebarRail,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { BarChart3, Users, HelpCircle, Settings, FileText, AlertTriangle, LogOut, Home } from "lucide-react"

const menuItems = [
  {
    title: "نظرة عامة",
    url: "/admin",
    icon: Home,
  },
  {
    title: "إدارة المستخدمين",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "إدارة الأسئلة",
    url: "/admin/questions",
    icon: HelpCircle,
  },
  {
    title: "إعدادات الاختبار",
    url: "/admin/test-settings",
    icon: Settings,
  },
  {
    title: "النتائج",
    url: "/admin/results",
    icon: FileText,
  },
  {
    title: "التنبيهات",
    url: "/admin/alerts",
    icon: AlertTriangle,
  },
  {
    title: "إعدادات النظام",
    url: "/admin/system",
    icon: BarChart3,
  },
]

export function AdminSidebar() {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    localStorage.removeItem("userRole")
    localStorage.removeItem("userCode")
    router.push("/")
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="h-8 w-8">
            <img src="/logo.png" alt="شعار الأمانة العامة" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="text-sm font-semibold">لوحة التحكم</p>
            <p className="text-xs text-muted-foreground">الأمانة العامة</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>القائمة الرئيسية</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <a href={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
              <LogOut className="h-4 w-4 ml-2" />
              تسجيل الخروج
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
