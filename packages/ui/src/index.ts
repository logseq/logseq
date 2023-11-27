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
  Alert, AlertTitle, Input,
  AlertDescription, Label,
  Form, FormItem, FormLabel,
  FormField, FormControl,
  FormDescription, FormMessage,
  useFormField, useForm,
  useFormContext, yupResolver, yup,
  Switch, Checkbox,
}

function setupGlobals() {
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