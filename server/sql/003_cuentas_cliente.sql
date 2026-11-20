-- =============================================================
-- Farmashop Web - Cuentas de clientes
-- Ejecutar una sola vez sobre la base farmashop (idempotente).
-- Completa web_cliente (creada en 001) y agrega favoritos.
-- Compatible con SQL Server 2008 R2 (nivel 90).
-- =============================================================

-- Seguridad del login
IF COL_LENGTH('dbo.web_cliente', 'intentosFallidos') IS NULL
    ALTER TABLE dbo.web_cliente ADD intentosFallidos INT NOT NULL CONSTRAINT DF_web_cliente_intentos DEFAULT 0;
GO
IF COL_LENGTH('dbo.web_cliente', 'bloqueadoHasta') IS NULL
    ALTER TABLE dbo.web_cliente ADD bloqueadoHasta DATETIME2 NULL;
GO
IF COL_LENGTH('dbo.web_cliente', 'ultimoLogin') IS NULL
    ALTER TABLE dbo.web_cliente ADD ultimoLogin DATETIME2 NULL;
GO
-- Se incrementa al cambiar la contraseña: invalida las sesiones abiertas en otros dispositivos
IF COL_LENGTH('dbo.web_cliente', 'versionSesion') IS NULL
    ALTER TABLE dbo.web_cliente ADD versionSesion INT NOT NULL CONSTRAINT DF_web_cliente_version DEFAULT 0;
GO

-- Facturación
IF COL_LENGTH('dbo.web_cliente', 'razonSocial') IS NULL
    ALTER TABLE dbo.web_cliente ADD razonSocial NVARCHAR(150) NULL;
GO

-- Entrega preferida (se precarga en el checkout)
IF COL_LENGTH('dbo.web_cliente', 'metodoEnvio') IS NULL
    ALTER TABLE dbo.web_cliente ADD metodoEnvio VARCHAR(20) NULL
        CONSTRAINT CK_web_cliente_envio CHECK (metodoEnvio IN ('retiro','delivery'));
GO
IF COL_LENGTH('dbo.web_cliente', 'idSucursal') IS NULL
    ALTER TABLE dbo.web_cliente ADD idSucursal INT NULL;
GO
IF COL_LENGTH('dbo.web_cliente', 'calle') IS NULL
    ALTER TABLE dbo.web_cliente ADD calle NVARCHAR(150) NULL;
GO
IF COL_LENGTH('dbo.web_cliente', 'calleSecundaria') IS NULL
    ALTER TABLE dbo.web_cliente ADD calleSecundaria NVARCHAR(150) NULL;
GO
IF COL_LENGTH('dbo.web_cliente', 'referencia') IS NULL
    ALTER TABLE dbo.web_cliente ADD referencia NVARCHAR(250) NULL;
GO
IF COL_LENGTH('dbo.web_cliente', 'ciudad') IS NULL
    ALTER TABLE dbo.web_cliente ADD ciudad NVARCHAR(100) NULL;
GO

-- Comunicaciones: consentimiento explícito para promociones (Ley 6534/2020 de datos personales).
-- Los avisos sobre pedidos no requieren este consentimiento.
IF COL_LENGTH('dbo.web_cliente', 'aceptaComunicaciones') IS NULL
    ALTER TABLE dbo.web_cliente ADD aceptaComunicaciones BIT NOT NULL CONSTRAINT DF_web_cliente_comunicaciones DEFAULT 0;
GO
IF COL_LENGTH('dbo.web_cliente', 'fechaConsentimiento') IS NULL
    ALTER TABLE dbo.web_cliente ADD fechaConsentimiento DATETIME2 NULL;
GO
-- Reservado para la verificación por correo (cuando se configure el envío de emails)
IF COL_LENGTH('dbo.web_cliente', 'emailVerificado') IS NULL
    ALTER TABLE dbo.web_cliente ADD emailVerificado BIT NOT NULL CONSTRAINT DF_web_cliente_verificado DEFAULT 0;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_web_cliente_fechaAlta' AND object_id = OBJECT_ID('dbo.web_cliente'))
    CREATE INDEX IX_web_cliente_fechaAlta ON dbo.web_cliente (fechaAlta DESC);
GO

-- Productos favoritos de cada cliente
IF OBJECT_ID('dbo.web_cliente_favorito', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.web_cliente_favorito (
        idCliente   INT       NOT NULL CONSTRAINT FK_web_cliente_favorito_cliente REFERENCES dbo.web_cliente(idCliente),
        idProducto  INT       NOT NULL CONSTRAINT FK_web_cliente_favorito_producto REFERENCES dbo.producto(idProducto),
        fecha       DATETIME2 NOT NULL CONSTRAINT DF_web_cliente_favorito_fecha DEFAULT SYSDATETIME(),
        CONSTRAINT PK_web_cliente_favorito PRIMARY KEY (idCliente, idProducto)
    );
END
GO

-- Pedidos de cada cliente (Mis pedidos)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_web_pedido_cliente' AND object_id = OBJECT_ID('dbo.web_pedido'))
    CREATE INDEX IX_web_pedido_cliente ON dbo.web_pedido (idCliente, fecha DESC);
GO
