import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { LoginForm } from "./login-form"

export const metadata: Metadata = {
  title: "Login - Admin Panel",
  description: "Login to the tourism platform admin panel",
}

export default function LoginPage() {
  return (
    <div className="container relative flex h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-zinc-900">
          <Image
            src="/placeholder.svg?height=1080&width=1920"
            width={1920}
            height={1080}
            alt="Authentication background"
            className="h-full w-full object-cover opacity-20"
          />
        </div>

   
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Acceso al Panel de Administración</h1>
            <p className="text-sm text-muted-foreground">Ingresa tus credenciales para acceder al backoffice</p>
          </div>
          <LoginForm />
          <p className="px-8 text-center text-sm text-muted-foreground">
            ¿Problemas para acceder?{" "}
            <Link href="/admin/contact-support" className="underline underline-offset-4 hover:text-primary">
              Contacta a soporte
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

