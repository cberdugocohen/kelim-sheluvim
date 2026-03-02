import * as React from "react"
import { cn } from "@/lib/utils"
import { Menu, X } from "lucide-react"
import { Button } from "./button"

const SidebarContext = React.createContext({
  isOpen: true,
  setIsOpen: () => {},
  isMobile: false,
})

function useSidebar() {
  return React.useContext(SidebarContext)
}

const SidebarProvider = React.forwardRef(({ children, className, ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, isMobile }}>
      <div ref={ref} className={cn("relative flex min-h-screen w-full", className)} {...props}>
        {children}
      </div>
    </SidebarContext.Provider>
  )
})
SidebarProvider.displayName = "SidebarProvider"

const Sidebar = React.forwardRef(({ children, className, ...props }, ref) => {
  const { isOpen, setIsOpen, isMobile } = useSidebar()

  if (isMobile) {
    return (
      <>
        {isOpen && (
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setIsOpen(false)} />
        )}
        <aside
          ref={ref}
          className={cn(
            "fixed inset-y-0 right-0 z-50 w-72 bg-white shadow-xl transition-transform duration-300 ease-in-out",
            isOpen ? "translate-x-0" : "translate-x-full",
            className
          )}
          {...props}
        >
          <div className="flex h-full flex-col overflow-y-auto">
            {children}
          </div>
        </aside>
      </>
    )
  }

  return (
    <aside
      ref={ref}
      className={cn(
        "hidden md:flex w-64 flex-col border-l bg-white/80 backdrop-blur-sm",
        className
      )}
      {...props}
    >
      <div className="flex h-full flex-col overflow-y-auto">
        {children}
      </div>
    </aside>
  )
})
Sidebar.displayName = "Sidebar"

const SidebarTrigger = React.forwardRef(({ className, ...props }, ref) => {
  const { isOpen, setIsOpen } = useSidebar()

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn("md:hidden", className)}
      onClick={() => setIsOpen(!isOpen)}
      {...props}
    >
      {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 border-b", className)} {...props} />
))
SidebarHeader.displayName = "SidebarHeader"

const SidebarContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex-1 overflow-y-auto p-2", className)} {...props} />
))
SidebarContent.displayName = "SidebarContent"

const SidebarFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 border-t mt-auto", className)} {...props} />
))
SidebarFooter.displayName = "SidebarFooter"

const SidebarGroup = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("py-2", className)} {...props} />
))
SidebarGroup.displayName = "SidebarGroup"

const SidebarGroupContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-1", className)} {...props} />
))
SidebarGroupContent.displayName = "SidebarGroupContent"

const SidebarMenu = React.forwardRef(({ className, ...props }, ref) => (
  <nav ref={ref} className={cn("space-y-1 px-2", className)} {...props} />
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

const SidebarMenuButton = React.forwardRef(({ className, isActive, asChild, children, ...props }, ref) => {
  const Comp = asChild ? React.Children.only(children).type : "button"
  const childProps = asChild ? React.Children.only(children).props : {}

  return (
    <Comp
      ref={ref}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-purple-100 text-purple-900"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        className
      )}
      {...props}
      {...(asChild ? childProps : {})}
    >
      {asChild ? React.Children.only(children).props.children : children}
    </Comp>
  )
})
SidebarMenuButton.displayName = "SidebarMenuButton"

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
}
