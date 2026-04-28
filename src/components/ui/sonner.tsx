import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      expand
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-2 group-[.toaster]:border-primary/40 group-[.toaster]:shadow-xl group-[.toaster]:text-base group-[.toaster]:font-medium group-[.toaster]:p-4 group-[.toaster]:min-h-[64px] group-[.toaster]:w-[min(92vw,460px)]",
          title: "group-[.toast]:text-base group-[.toast]:font-bold",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:!border-primary group-[.toaster]:!bg-primary/10",
          error: "group-[.toaster]:!border-destructive group-[.toaster]:!bg-destructive/10",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
