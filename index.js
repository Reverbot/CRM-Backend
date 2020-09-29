const { ApolloServer } = require('apollo-server')
const  typeDefs  = require('./db/schema')
const  resolvers  = require('./db/resolver')
const conectarDB = require('./config/db')
const jwt = require('jsonwebtoken')

//mandar a llamar a la DB
conectarDB();

//servidor
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({req}) => {
        
        const token = req.headers['authorization'] || ""

        if(token){
            try {
                const usuario = jwt.verify(token, process.env.SECRETA)
            
                return {
                    usuario
                }
            } catch (error) {
                console.log(error)
            }
        }   
    }
})



//arrancar el servidor
server.listen().then( ( {url} ) => {
    console.log(`Servidor listo en ${url}`)
})