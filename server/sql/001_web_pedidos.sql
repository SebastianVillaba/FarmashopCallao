-- =============================================================
-- Farmashop Web - Tablas de pedidos online
-- Ejecutar una sola vez sobre la base farmashop.
-- No modifica tablas del ERP: todo queda bajo el prefijo web_.
-- =============================================================

IF OBJECT_ID('dbo.web_cliente', 'U') IS NULL
BEGIN
    -- Reservada para la Fase 3 (cuentas de cliente)
    CREATE TABLE dbo.web_cliente (
        idCliente       INT IDENTITY(1,1) PRIMARY KEY,
        email           VARCHAR(150)  NOT NULL UNIQUE,
        passwordHash    VARCHAR(255)  NULL,
        nombre          NVARCHAR(100) NOT NULL,
        apellido        NVARCHAR(100) NOT NULL,
        telefono        VARCHAR(30)   NULL,
        documento       VARCHAR(20)   NULL,
        dv              VARCHAR(2)    NULL,
        fechaAlta       DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
        activo          BIT           NOT NULL DEFAULT 1
    );
END
GO

IF OBJECT_ID('dbo.web_pedido', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.web_pedido (
        idPedido        INT IDENTITY(1,1) PRIMARY KEY,
        nroPedido       AS ('FS-' + RIGHT('000000' + CAST(idPedido AS VARCHAR(10)), 6)) PERSISTED,
        fecha           DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
        estado          VARCHAR(20)   NOT NULL DEFAULT 'pendiente'
                        CONSTRAINT CK_web_pedido_estado CHECK (estado IN ('pendiente','confirmado','preparando','enviado','entregado','cancelado')),
        idCliente       INT           NULL REFERENCES dbo.web_cliente(idCliente),

        -- Datos del cliente
        nombre          NVARCHAR(100) NOT NULL,
        apellido        NVARCHAR(100) NOT NULL,
        email           VARCHAR(150)  NOT NULL,
        telefono        VARCHAR(30)   NOT NULL,

        -- Facturación
        documento       VARCHAR(20)   NOT NULL,
        dv              VARCHAR(2)    NULL,
        razonSocial     NVARCHAR(150) NULL,

        -- Envío
        metodoEnvio     VARCHAR(20)   NOT NULL
                        CONSTRAINT CK_web_pedido_envio CHECK (metodoEnvio IN ('retiro','delivery')),
        idSucursal      INT           NULL,
        calle           NVARCHAR(150) NULL,
        calleSecundaria NVARCHAR(150) NULL,
        referencia      NVARCHAR(250) NULL,
        ciudad          NVARCHAR(100) NULL,
        observacion     NVARCHAR(500) NULL,

        -- Pago
        metodoPago      VARCHAR(20)   NOT NULL
                        CONSTRAINT CK_web_pedido_pago CHECK (metodoPago IN ('transferencia','qr','contra_entrega')),

        -- Totales (Gs.)
        subtotal        DECIMAL(18,0) NOT NULL,
        costoEnvio      DECIMAL(18,0) NOT NULL DEFAULT 0,
        total           DECIMAL(18,0) NOT NULL
    );

    CREATE UNIQUE INDEX UX_web_pedido_nro ON dbo.web_pedido (nroPedido);
    CREATE INDEX IX_web_pedido_email ON dbo.web_pedido (email);
    CREATE INDEX IX_web_pedido_fecha ON dbo.web_pedido (fecha DESC);
END
GO

IF OBJECT_ID('dbo.web_pedido_detalle', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.web_pedido_detalle (
        idDetalle       INT IDENTITY(1,1) PRIMARY KEY,
        idPedido        INT           NOT NULL REFERENCES dbo.web_pedido(idPedido),
        idProducto      INT           NOT NULL,
        codigo          VARCHAR(50)   NULL,
        nombre          NVARCHAR(250) NOT NULL,
        precioUnitario  DECIMAL(18,0) NOT NULL,
        cantidad        INT           NOT NULL CHECK (cantidad > 0),
        subtotal        DECIMAL(18,0) NOT NULL
    );

    CREATE INDEX IX_web_pedido_detalle_pedido ON dbo.web_pedido_detalle (idPedido);
END
GO
