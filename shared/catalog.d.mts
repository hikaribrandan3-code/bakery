export const products: import('../src/lib/types').Product[];
export const categories: {id:string;label:string;description:string;image:string}[];
export const boxFlavors: {id:string;label:string;category:string;image:string;tone?:string}[];
export const defaultSettings: import('../src/lib/types').Settings;
export function money(value:number):string;
export function localDay(date?:Date):string;
export function schedule(settings?:import('../src/lib/types').Settings,now?:Date):{date:string;label:string;detail:string;slots:string[]}[];
export function normalizePhone(value:string):string;
export function orderMessage(order:import('../src/lib/types').Order,settings?:import('../src/lib/types').Settings):string;
