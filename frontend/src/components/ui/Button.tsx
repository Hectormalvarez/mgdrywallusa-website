import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50 disabled:pointer-events-none select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-white hover:bg-accent-strong",
        outline:
          "border-2 border-brand text-brand bg-transparent hover:bg-brand hover:text-white",
        ghost:
          "text-brand bg-transparent hover:bg-brand/10",
        inverse:
          "border-2 border-white text-white bg-transparent hover:bg-white/15",
      },
      size: {
        md: "h-11 px-6 text-base",
        lg: "h-12 px-8 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

type ButtonBaseProps = VariantProps<typeof buttonVariants> & {
  className?: string;
  children: React.ReactNode;
};

type ButtonAsButton = ButtonBaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> & {
    href?: undefined;
  };

type ButtonAsAnchor = ButtonBaseProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonBaseProps> & {
    href: string;
  };

type ButtonProps = ButtonAsButton | ButtonAsAnchor;

function isAnchor(props: ButtonProps): props is ButtonAsAnchor {
  return typeof props.href === "string";
}

export function Button(props: ButtonProps) {
  const { variant, size, className, children, ...rest } = props;

  if (isAnchor(props)) {
    return (
      <a
        className={cn(buttonVariants({ variant, size }), className)}
        {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
}
