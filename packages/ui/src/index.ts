import './index.css'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal, DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Toaster } from '@/components/ui/toaster'
import { genId, useToast } from '@/components/ui/use-toast'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage, useForm,
  useFormField
} from '@/components/ui/form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useFormContext } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuPortal, ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger,
  ContextMenuTrigger
} from '@/components/ui/context-menu'

declare global {
  var LSUI: any
  var LSUtils: any
}

const shadui = {
  Button, Slider,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  Toaster, useToast, Badge,
  genToastId: genId,
  Alert, AlertTitle, Input, Textarea,
  AlertDescription, Label,
  Form, FormItem, FormLabel,
  FormField, FormControl,
  FormDescription, FormMessage,
  useFormField, useForm,
  useFormContext, yupResolver, yup,
  Switch, Checkbox, RadioGroup, RadioGroupItem,
  Card, CardHeader, CardTitle, CardDescription,
  CardContent, CardFooter, Skeleton,
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
}

function setupGlobals () {
  console.debug('[ui] setup logseq ui globals')

  window.LSUI = shadui

  window.LSUtils = {
    isDev: process.env.NODE_ENV === 'development'
  }
}

// setup
setupGlobals()

export {
  setupGlobals
}