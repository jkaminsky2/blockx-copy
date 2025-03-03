declare module "pako" {
    export * from "pako";
    export function gzip(input: string | Uint8Array, options?: any): Uint8Array;  
  }