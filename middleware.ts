import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        }
      }
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname
  const rotaPublica = path === '/login'

  // Não logado tentando acessar área protegida
  if (!user && !rotaPublica) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Logado tentando acessar /login
  if (user && rotaPublica) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Precisa trocar senha e não está na página de troca
  if (user?.user_metadata?.must_change_password && path !== '/trocar-senha') {
    return NextResponse.redirect(new URL('/trocar-senha', request.url))
  }

  // Protege /admin só pra time = trade
  if (user && path.startsWith('/admin')) {
    const { data: funcionario } = await supabase
      .from('funcionarios')
      .select('time')
      .eq('auth_user_id', user.id)
      .single()

    if (funcionario?.time !== 'trade') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}