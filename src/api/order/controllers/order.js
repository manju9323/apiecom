//require('dotenv').config();

const stripe = require("stripe")("sk_test_51MBhyOSEO3iGTW6YDOG7i9Ct2S58HA0bEXROug5ciZwoNY2Qlt6YkJ9NibL1BCabv9OXnUNStyfZXO1inBJBr8ST00d4VJg3zR");


const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::order.order',({strapi})=>({
    async create(ctx){
        const {products}= ctx.request.body;
       // console.log(ctx.request.body.products)
    
            const quan=products.quantity
        const lineItems =await Promise.all(
           
            products?.map(async (product)=> {
            const item= await strapi.service("api::product.product").findOne(product.id);
            console.log(item,"item") 
            return{
                price_data:{
                    currency:"usd",
                    product_data:{
                        name:item.title,
                    },
                    unit_amount:Math.round(item.price*100),
                },
                quantity:2
            };
        })
        );
        console.log(lineItems,"lineitems") 

        try{
            const session = await stripe.checkout.sessions.create({
                mode: 'payment',
                success_url: process.env.CLIENT_URL+"?sucess=true",
                cancel_url: process.env.CLIENT_URL+"?sucess=false",
                line_items:lineItems,
                shipping_address_collection:{allowed_countries:["US"]},
                payment_method_types:["card"],
            });
            await strapi.service("api::order.order").create({data:{
                products,stripeId: session.id
            }});
            console.log({stripeSession:session},"inner")
            return {stripeSession:session};
        }
        catch(err)
        {
            ctx.response.status =500;
            return {err};
        }
    },
}));
