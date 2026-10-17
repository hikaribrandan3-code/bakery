export type Product={id:string;title:string;short:string;category:string;price:number;image:string;stock:number;badge:string|null;description:string;allergens:string;kind:'simple'|'cake'|'box';options?:{id:string;label:string;price:number}[]};
export type Settings={name:string;tagline:string;neighborhood:string;address:string;hours:string;whatsapp:string;instagram:string;deliveryFee:number;deliveryArea:string;pointsPerPeso:number;boxSize:number;boxPrice:number;openHour:number;closeHour:number;timezone:string};
export type Selection={size?:string;message?:string;candles?:boolean;flavors?:Record<string,number>};
export type CartItem={key:string;product:Product;selection:Selection;qty:number;price:number;detail:string};
export type Checkout={name:string;phone:string;method:'pickup'|'delivery';address:string;date:string;time:string;notes:string};
export type Order=Checkout&{id:string;number:string;items:{id:string;title:string;qty:number;price:number;detail:string;image:string;selection:Selection}[];subtotal:number;deliveryFee:number;total:number;points:number;pointsBalance:number;status:string;createdAt:string;whatsappUrl:string|null};
