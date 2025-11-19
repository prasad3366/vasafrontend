import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import {
  BoxIcon,
  LineChartIcon,
  TagIcon,
  UsersIcon,
  MessageSquare,
} from "lucide-react";

const AdminNavigation = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    {
      href: "/admin/products",
      label: "Products",
      icon: BoxIcon,
    },
    {
      href: "/admin/analytics",
      label: "Analytics",
      icon: LineChartIcon,
    },
    {
      href: "/admin/sections",
      label: "Manage Sections",
      icon: TagIcon,
    },
      {
        href: "/admin/reviews",
        label: "Reviews",
        icon: MessageSquare,
      },
      {
        href: "/admin/orders",
        label: "Orders",
        icon: UsersIcon,
      },
  ];

  return (
    <div className="flex gap-3 mb-6 items-center">
      {menuItems.map((item) => {
        const Icon = item.icon;
        return (
          <Button
            key={item.href}
            variant={isActive(item.href) ? "default" : "outline"}
            size={"lg"}
            className={isActive(item.href) ? "rounded-full shadow-sm px-4" : "rounded-full px-4"}
            asChild
          >
            <Link to={item.href} className="flex items-center gap-2">
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          </Button>
        );
      })}
    </div>
  );
}

export default AdminNavigation;