import { Global, Module } from "@nestjs/common";
import { AuthModuleOptions } from "@nestjs/passport";

/**
 * NestJS 12 resolves @Optional() constructor parameters with
 * Reflect.getOwnMetadata, which — unlike the Reflect.getMetadata used in
 * NestJS 11 — does not walk the prototype chain. Guards subclassed from
 * AuthGuard (which declares its AuthModuleOptions parameter as optional on
 * its internal base class) therefore can no longer fall back to `undefined`
 * when PassportModule options are absent, and fail DI resolution at
 * bootstrap.
 *
 * Registering empty options globally restores the NestJS 11 behavior: the
 * guard falls back to its own defaults ({ session: false, property: "user" }),
 * which matches how this application used guards before the upgrade.
 */
@Global()
@Module({
  providers: [
    {
      provide: AuthModuleOptions,
      useValue: {}
    }
  ],
  exports: [
    {
      provide: AuthModuleOptions,
      useValue: {}
    }
  ]
})
export class PassportOptionsModule {}
