import { cva, type VariantProps } from "class-variance-authority";
import type { FC, ButtonHTMLAttributes } from "react";

const cn = (...classes: Array<string | false | null | undefined>) => {
  return classes.filter(Boolean).join(" ");
};

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-white text-black hover:bg-gray-200",
        ghost: "bg-transparent text-gray-400 hover:bg-zinc-800 hover:text-white",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export const Button: FC<ButtonProps> = ({ className, variant, size, ...props }) => {
  return <button className={cn(buttonVariants({ variant, size, className }))} {...props} />;
};
