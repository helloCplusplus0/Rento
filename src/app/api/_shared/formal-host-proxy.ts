import { NextRequest, NextResponse } from 'next/server'

import formalHostApp from '../../../../server/app'

interface FormalHostProxyOptions {
  routeLabel: string
  migrationHost: string
  exitCondition: string
  compatMetadata?: {
    targetStrategy?: string
    closurePhase?: string
    compatReason?: string
  }
}

/**
 * Reuse the unified Hono formal host in-process so legacy Next route handlers
 * stay as thin compat wrappers instead of keeping a second copy of business logic.
 */
export async function proxyToFormalHost(
  request: NextRequest,
  options: FormalHostProxyOptions
) {
  try {
    const proxiedResponse = await formalHostApp.fetch(request)
    const response = new Response(proxiedResponse.body, proxiedResponse)

    response.headers.set('x-rento-compat-proxy', options.migrationHost)

    return response
  } catch (error) {
    console.error(
      `[compat proxy:${options.routeLabel}] failed to delegate to ${options.migrationHost}`,
      error
    )

    return NextResponse.json(
      {
        error: 'Formal host proxy failed',
        details: {
          currentState: 'compat-wrapper',
          targetStrategy:
            options.compatMetadata?.targetStrategy ??
            'in-process-formal-host-proxy',
          migrationHost: options.migrationHost,
          exitCondition: options.exitCondition,
          ...(options.compatMetadata?.closurePhase
            ? { closurePhase: options.compatMetadata.closurePhase }
            : {}),
          ...(options.compatMetadata?.compatReason
            ? { compatReason: options.compatMetadata.compatReason }
            : {}),
        },
      },
      { status: 502 }
    )
  }
}
