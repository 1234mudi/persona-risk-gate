import { Moon, Sun, Contrast, Palette } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect } from "react";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  // Apply data-theme attribute for custom themes
  useEffect(() => {
    const root = document.documentElement;
    if (theme?.startsWith('high-contrast') || theme?.startsWith('colorblind')) {
      root.setAttribute('data-theme', theme);
      // Remove dark class for custom themes
      root.classList.remove('dark');
    } else {
      root.removeAttribute('data-theme');
    }
  }, [theme]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-9 h-9 p-0">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Standard Themes</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel>High Contrast</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setTheme("high-contrast-light")}>
          <Contrast className="mr-2 h-4 w-4" />
          <span>High Contrast Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("high-contrast-dark")}>
          <Contrast className="mr-2 h-4 w-4" />
          <span>High Contrast Dark</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Colorblind-Friendly</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setTheme("colorblind-light")}>
          <Palette className="mr-2 h-4 w-4" />
          <span>Colorblind Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("colorblind-dark")}>
          <Palette className="mr-2 h-4 w-4" />
          <span>Colorblind Dark</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
