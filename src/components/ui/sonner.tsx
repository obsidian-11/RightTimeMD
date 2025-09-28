import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        style: {
          background: "#ffffff",
          color: "#0f172a",
          border: "1px solid #e2e8f0",
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          backdropFilter: "none",
          opacity: "1",
          fontSize: "14px",
          fontWeight: "500",
        },
        className: "toast",
      }}
      position="top-right"
      expand={true}
      richColors={false}
      closeButton={true}
      {...props}
    />
  );
};

export { Toaster };
