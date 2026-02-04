import * as React from "react";
import { Sun, Moon, Check, Paperclip, Send, Square, Plus } from "lucide-react";

export const Icons = {
  Sun: (props: React.SVGProps<SVGSVGElement>) => <Sun {...props} />,
  Moon: (props: React.SVGProps<SVGSVGElement>) => <Moon {...props} />,
  Check: (props: React.SVGProps<SVGSVGElement>) => <Check {...props} />,
  Paperclip: (props: React.SVGProps<SVGSVGElement>) => <Paperclip {...props} />,
  Send: (props: React.SVGProps<SVGSVGElement>) => <Send {...props} />,
  Square: (props: React.SVGProps<SVGSVGElement>) => <Square {...props} />,
  Plus: (props: React.SVGProps<SVGSVGElement>) => <Plus {...props} />,
};

export default Icons; 
