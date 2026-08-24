// Define the type of the environment variables injected by @ngx-env/builder.
declare interface Env {
  readonly NODE_ENV: string;
  readonly SCHOLARSOME_RECAPTCHA_SITE: string;
  readonly SCHOLARSOME_RECAPTCHA_SECRET: string;
  readonly SCHOLARSOME_HEAD_SCRIPTS_BASE64: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

// Access environment variables with import.meta.env.YOUR_ENV_VAR.
declare interface ImportMeta {
  readonly env: Env;
}
