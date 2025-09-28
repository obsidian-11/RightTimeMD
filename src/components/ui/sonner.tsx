import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      style={
        {
          "--normal-bg": "hsl(var(--background))",
          "--normal-text": "hsl(var(--foreground))",
          "--normal-border": "hsl(var(--border))",
          "--success-bg": "hsl(142 76% 36%)",
          "--success-text": "hsl(355.7 100% 97.3%)",
          "--error-bg": "hsl(var(--destructive))",
          "--error-text": "hsl(var(--destructive-foreground))",
          "--warning-bg": "hsl(32 95% 44%)",
          "--warning-text": "hsl(355.7 100% 97.3%)",
          "--info-bg": "hsl(221.2 83.2% 53.3%)",
          "--info-text": "hsl(355.7 100% 97.3%)",
        } as React.CSSProperties
      }
      toastOptions={{
        style: {
          background: "hsl(var(--background))",
          color: "hsl(var(--foreground))",
          border: "1px solid hsl(var(--border))",
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          backdropFilter: "none",
          opacity: "1",
        },
      }}
      position="top-right"
      expand={true}
      richColors={true}
      closeButton={true}
      {...props}
    />
  );
};

export { Toaster };
