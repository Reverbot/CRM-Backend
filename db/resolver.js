const Usuario = require('../models/Usuarios')
const Producto = require('../models/Producto')
const Cliente = require('../models/Cliente')
const Pedido = require('../models/Pedido')
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')

const crearToken = (usuario, palabra, expiresIn) => {

    const {nombre, apellido, email, id} = usuario
    return jwt.sign( { id, nombre, apellido, email }, palabra, { expiresIn } )
}

//resolvers
const resolvers = {
    Query: {
        obtenerUsuario :async (_, { token }) => {
            const usuarioID = jwt.verify(token, process.env.SECRETA)

            return usuarioID
        },
        obtenerProductos : async () => {

            try {
                const productos = await Producto.find({})
                return productos

            } catch (error) {
                console.log(error)
            }
        },
        obtenerProducto : async (_, { id }) => {
          
                const producto = await Producto.findById(id)

            if(!producto){
               throw new Error('Producto no encontrado')
            }

            return producto
           
        },
        obtenerClientes : async () => {
            try {
                const cliente = await Cliente.find({})
                return cliente
            } catch (error) {
                console.log(error)
            }
        },
        obtenerClientesVendedor: async (_, {}, ctx) => {
            try {
                const clientes = await Cliente.find({vendedor : ctx.usuario.id.toString()})

                return clientes
            } catch (error) {
                console.log(error)
            }
        },
        obtenerCliente : async (_, { id }, ctx) =>  {

            //revisar si el cliente existe o  no

            const cliente = await Cliente.findById(id);

            if(!cliente){
                throw new Error('Cliente no encontrado')
            }

            //quien lo encontro puede verlo
            if(cliente.vendedor.toString() !== ctx.usuario.id){
                throw new Error('No tienes las credenciales')
            }

            return cliente
        },
        obtenerPedidos : async () => {
            try {
                const pedidos = Pedido.find({})
                return pedidos
            } catch (error) {
                console.log(error)
            }
        },
        obtenerpedidosVendedor : async (_, {}, ctx) => {
            try {
                const pedidos = await Pedido.find({vendedor : ctx.usuario.id})
                return pedidos
            } catch (error) {
                console.log(error)
            }
        },
        obtenerPedido : async (_, {id}, ctx) => {
            //validar si existe el pedido
            const pedido = await Pedido.findById(id)

            if(!pedido){
                throw new Error('Pedido no encontrado')
            }

            //solo el que lo creo puede verlo
            if(pedido.vendedor.toString() !== ctx.usuario.id){
                throw new Error('no tiene las credenciales')
            }

            //resultado
            return pedido
        },
        obtenerPedidosEstado : async (_ ,{estado}, ctx) => {
            //vaildar que el usuario sea el dueño
            const pedidos = await Pedido.find({vendedor : ctx.usuario.id, estado : estado})

            return pedidos
        },
        mejoresClientes : async () => {
            const clientes = await Pedido.aggregate([
                {$match : { estado : "COMPLETADO"}},
                    {$group : {
                        _id : "$cliente",
                    total : { $sum : '$total'}
                }},
                {
                    $lookup: {
                        from : 'clientes',
                        localField : '_id',
                        foreignField : '_id',
                        as : "cliente"
                    }
                },
                {
                    $sort : {total : -1}
                },
                {
                    $limit : 10
                }
            ])

            return clientes
        },
        mejoresVendedores : async () => {
            const vendedores = await Pedido.aggregate([
                {$match : {estado : "COMPLETADO"}},
                {
                    $group : {
                        _id : "$vendedor",
                        total : {$sum : "$total"}
                    }
                },
                {
                    $lookup:{
                        from : 'usuarios',
                        localField : '_id',
                        foreignField : '_id',
                        as : "vendedor"
                    }
                },
                {
                    $limit : 3
                },
                {
                    $sort :{total : -1}
                }
            ])

            return vendedores
        },
        busquedaProducto : async (_, {texto}) => {
            const productos = await Producto.find({$text: { $search : texto}}).limit(10)

            return productos
        }
    },
    Mutation: {
        nuevoUsuario:async (_, {input}) => {

            const {email, password} = input
            
            //revisar si el usuario ya esta registrado
            const existeUsuario = await Usuario.findOne({email})
            
            if(existeUsuario){
                throw new Error('El usuario ya esta Registrado')
            }

            //hashear el passqord       
            input.password =  await bcryptjs.hash(password, 10)

            //guardar en la BD

            try {

                const usuario = new Usuario(input)
                usuario.save()
                return usuario

            } catch (error) {
                console.log(error)
            }
            
        },
        autenticarUsuario: async (_, {input}) => {
            
            const {email, password} = input

            //si el usuario existe

            const existeUsuario = await Usuario.findOne({email})

            if(!existeUsuario){
                throw new Error('El usuario no existe')
            }

            //revisar si el password es corrrecto
            const passwordCorrecto = await bcryptjs.compare(password, existeUsuario.password)

            if(!passwordCorrecto){
                throw new Error('El password es incorrecto')
            }

            //crear el token
            return{
                token: crearToken(existeUsuario, process.env.SECRETA, '24h')
            }
        },
        nuevoProducto:async (_, { input }) => {
            try {
                const nuevoProducto = new Producto(input)

                //almacenar en la base de datos
                const resultado = await nuevoProducto.save()

                return resultado

            } catch (error) {
                console.log(error)
            }
        },
        actualizarProducto: async (_, {id, input}) => {

            
            let producto = await Producto.findById(id)

            if(!producto){
               throw new Error('Producto no encontrado')
            }

            //guardar en la base de datos
            producto = await Producto.findOneAndUpdate({_id : id}, input, {new : true})

            return producto

        },
        eliminarProducto: async (_, {id}) => {  

            let producto = await Producto.findById(id)

            if(!producto){
               throw new Error('Producto no encontrado')
            }

            await Producto.findOneAndDelete({_id : id})

            return "producto eliminado"
        },
        nuevoCliente : async (_, {input}, ctx) => {

            const {email} = input

            //verificar si existe
            const cliente = await Cliente.findOne({ email })

            if(cliente){
                throw new error('Cliente ya esta registrado')
            }

            const nuevoCliente = new Cliente(input)

            nuevoCliente.vendedor = ctx.usuario.id

            //guardar
           try {
           

            const resultado = await nuevoCliente.save()

            return resultado

           } catch (error) {
               console.log(error)
           }
        },
        actualizarCliente : async (_, {id, input}, ctx) => {
            //verificar si existe o no
            let cliente = await Cliente.findById(id)

            if(!cliente) {
                throw new Error('Cliente no encontrado')
            }

            //verificar si el vendedir es quien edita
            if(cliente.vendedor.toString() !== ctx.usuario.id){
                throw new Error('No tienes las credenciales')
            }

            //guardar cliente
            cliente = await Cliente.findOneAndUpdate({_id : id}, input, {new : true})

            return cliente
        },
        eliminarCliente : async (_, {id}, ctx) => {
            //validar si existe
            let cliente = await Cliente.findById(id)

            if(!cliente){
                throw new Error("Cliente no encontrado")
            }

             //validar que el usuario sea el dueño
            if(cliente.vendedor.toString() !== ctx.usuario.id){
                throw new Error("No tienes las credenciales")
            }

            //eliminar
            await Cliente.findOneAndDelete({_id : id})

            return "Cliente Eliminado"
        },
        nuevoPedido : async (_, {input}, ctx) => {

            const {cliente} = input
            //verificar si el cliente existe o no
           const validarCliente = await Cliente.findById(cliente)

            if(!validarCliente){
                throw new Error('Cliente no encontrado')
            }

            //verificar si el cliente es del vendedor
            if(validarCliente.vendedor.toString() !== ctx.usuario.id){
                throw new Error('no tiene las credenciales')
            }

            //revisar que el stock este disponible
            for await ( const articulo of input.pedido){
                const {id} = articulo

                const producto = await Producto.findById(id)

                if(articulo.cantidad > producto.existencia){
                    throw new Error(`El articulo ${producto.nombre} excede la cantidad disponible`)
                }else{
                    producto.existencia = producto.existencia - articulo.cantidad
                    await producto.save()
                }
            };

            //crear un nuevo pedido
            const nuevoPedido = new Pedido(input)

            //asignar un vendedor
            nuevoPedido.vendedor = ctx.usuario.id

            //guardar en la base de datos
            const resultado = await nuevoPedido.save()
            return resultado
        },
        actualizarPedido : async (_, {id, input}, ctx) => {
            const {cliente} = input
            //si el pedido existe
            const existePedido = await Pedido.findById(id)

            if(!existePedido){
                throw new Error('Pedido no encontrado')
            }

            //si el cliente existe
            const existeCliente = await Cliente.findById(cliente)
            if(!existeCliente){
                throw new Error('Cliente no encontrado')
            }

            //si cliente y pedido pertenecen al vendedor
            if(existeCliente.vendedor.toString() !== ctx.usuario.id){
                throw new Error('No tiene las Credenciales')
            }

             //revisar que el stock este disponible
             for await ( const articulo of input.pedido){
                const {id} = articulo

                const producto = await Producto.findById(id)

                if(articulo.cantidad > producto.existencia){
                    throw new Error(`El articulo ${producto.nombre} excede la cantidad disponible`)
                }else{
                    producto.existencia = producto.existencia - articulo.cantidad
                    await producto.save()
                }
            }

            //guardar el pedido
            const resultado = await Pedido.findByIdAndUpdate({_id : id}, input, {new : true})
            return resultado
        },
        eliminarpedido : async (_, {id}, ctx) => {
            //validar si existe pedido
            const existePedido = await Pedido.findById(id)

            if(!existePedido){
                throw new Error('Pedido no encontrado')
            }

            //validar si tiene credenciales
            if(existePedido.vendedor.toString() !== ctx.usuario.id){
                throw new Error('no tiene las crendenciales')
            }

            //eliminar
            await Pedido.findOneAndDelete({_id : id})

            return "Pedido Eliminado"
        }
       
    }
}

module.exports = resolvers