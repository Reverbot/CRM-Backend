const { gql } = require('apollo-server')



//schema
const typeDefs = gql`
   
    type Usuario{
        id : ID
        nombre : String
        apellido : String
        email : String
        creado : String
    }

    type Token{
        token: String
    }

    type Producto{
        id: ID
        nombre: String
        existencia : Int
        precio: Float
        creado : String
    }

    type Cliente{
        id : ID
        nombre: String
        empresa : String
        apellido : String
        email : String
        telefono : String
        vendedor : ID
    }

    type Pedido{
        id : ID
        pedido : [PedidoGrupo]
        total : Float
        cliente : ID
        vendedor : ID
        fecha : String
        estado : EstadoPedido
    }

    type PedidoGrupo{
        id: ID
        cantidad : Int
    }

    type topCliente{
        total : Float
        cliente : [Cliente]
    }

    type topVendedor{
        total : Float
        vendedor : [Usuario]
    }

    input UsuarioInput{
        nombre : String!
        apellido : String!
        email : String!
        password : String!
    }

    input ProductoInput{
        nombre: String!
        existencia : Int!
        precio: Float!
    }

    input AutenticarInput{
        email: String!
        password : String!
    }

    input ClienteInput{
        nombre: String!
        apellido : String!
        empresa : String!
        email : String!
        telefono : String
    }

    input PedidoProductoInput{
        id : ID
        cantidad : Int
    }

    input PedidoInput{
        pedido : [PedidoProductoInput]
        total : Float!
        cliente : ID!
        estado : EstadoPedido
    }

    enum EstadoPedido{
        PENDIENTE
        COMPLETADO
        CANCELADO
    }

    type Query{
        #usuarios
        obtenerUsuario: Usuario

        #productos
        obtenerProductos: [Producto]
        obtenerProducto(id : ID!) : Producto

        #cliente
        obtenerClientes : [Cliente]
        obtenerClientesVendedor : [Cliente]
        obtenerCliente(id : ID!) : Cliente

        #pedidos
        obtenerPedidos : [Pedido]
        obtenerpedidosVendedor : [Pedido]
        obtenerPedido(id : ID!) : Pedido
        obtenerPedidosEstado(estado : String!) : [Pedido]

        #busquedas avanzadas
        mejoresClientes : [topCliente]
        mejoresVendedores : [topVendedor]
        busquedaProducto(texto : String!) : [Producto]
    }

    type Mutation{
        #Usuarios
        nuevoUsuario(input : UsuarioInput) : Usuario
        autenticarUsuario(input : AutenticarInput) : Token

        #Productos
        nuevoProducto(input : ProductoInput) : Producto
        actualizarProducto(id : ID!, input : ProductoInput) : Producto
        eliminarProducto(id : ID!) : String

        #cliente
        nuevoCliente(input: ClienteInput) : Cliente
        actualizarCliente(id : ID!, input : ClienteInput) : Cliente
        eliminarCliente(id : ID!) : String

        #Pedidos
        nuevoPedido(input : PedidoInput) : Pedido
        actualizarPedido(id : ID!, input : PedidoInput) : Pedido
        eliminarpedido(id : ID!) : String
    }
`

module.exports = typeDefs