import { Button } from "./ui/button";
import { Icons } from "./ui/icons";
import { useTheme } from "./ThemeProvider";

export function ThemePopover() {
  const { theme, toggle } = useTheme();
  return (
    <div>
      <Button variant="ghost" size="sm" aria-label="Toggle theme" onClick={toggle}>
        {theme === "light" ? <Icons.Sun className="w-4 h-4" /> : <Icons.Moon className="w-4 h-4" />}
      </Button>
    </div>
  );
}