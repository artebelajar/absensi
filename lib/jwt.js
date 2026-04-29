import {sign, verify} from "hono/jwt";

const secret = process.env.JWT_SECRET;

if(!secret){
    throw new Error("JWT_SECRET is not defined");
}

export async function createToken(payload){
    return await sign({...payload, 
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24},
        secret, "HS256"
    );
}

export async function verifyToken(token){
    return await verify(token, secret, {alg: "HS256"});
}