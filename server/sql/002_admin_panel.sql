-- =============================================================
-- Farmashop Web - Panel administrativo
-- Ejecutar una sola vez sobre la base farmashop (idempotente).
-- No modifica tablas del ERP: sólo crea tablas nuevas con FK hacia ellas.
-- =============================================================

-- Usuarios habilitados para el panel (vinculados a un usuario del ERP)
IF OBJECT_ID('dbo.usuarioWeb', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.usuarioWeb (
        idUsuarioWeb      INT IDENTITY(1,1) PRIMARY KEY,
        idUsuario         INT          NOT NULL
                          CONSTRAINT FK_usuarioWeb_usuario REFERENCES dbo.usuario(idUsuario),
        passwordHash      VARCHAR(100) NOT NULL,
        rol               VARCHAR(10)  NOT NULL DEFAULT 'editor'
                          CONSTRAINT CK_usuarioWeb_rol CHECK (rol IN ('admin','editor')),
        activo            BIT          NOT NULL DEFAULT 1,
        intentosFallidos  INT          NOT NULL DEFAULT 0,
        bloqueadoHasta    DATETIME2    NULL,
        ultimoLogin       DATETIME2    NULL,
        fechaAlta         DATETIME2    NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT UX_usuarioWeb_usuario UNIQUE (idUsuario)
    );
END
GO

-- Configuración general de la web (clave/valor)
IF OBJECT_ID('dbo.web_config', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.web_config (
        clave            VARCHAR(50)   NOT NULL PRIMARY KEY,
        valor            NVARCHAR(MAX) NULL,
        fechaMod         DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
        idUsuarioWebMod  INT           NULL REFERENCES dbo.usuarioWeb(idUsuarioWeb)
    );

    INSERT INTO dbo.web_config (clave, valor) VALUES
        ('tema', 'default'),
        ('tema_programado', NULL),   -- JSON: {"tema":"navidad","desde":"2026-12-01","hasta":"2026-12-26"}
        ('ga4_id', NULL);
END
GO

-- Banners del carrusel y espacios promocionales
IF OBJECT_ID('dbo.web_banner', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.web_banner (
        idBanner      INT IDENTITY(1,1) PRIMARY KEY,
        ubicacion     VARCHAR(20)   NOT NULL
                      CONSTRAINT CK_web_banner_ubicacion CHECK (ubicacion IN ('carrusel','promo_1','promo_2')),
        archivo       VARCHAR(100)  NOT NULL,
        archivoMovil  VARCHAR(100)  NULL,
        alt           NVARCHAR(150) NOT NULL,
        link          NVARCHAR(300) NULL,
        orden         INT           NOT NULL DEFAULT 0,
        activo        BIT           NOT NULL DEFAULT 1,
        desde         DATETIME2     NULL,
        hasta         DATETIME2     NULL,
        tema          VARCHAR(20)   NULL,   -- si se indica, sólo se muestra con esa temática
        fechaAlta     DATETIME2     NOT NULL DEFAULT SYSDATETIME()
    );
END
GO

-- Datos web de los productos del ERP
IF OBJECT_ID('dbo.web_producto', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.web_producto (
        idProducto         INT           NOT NULL PRIMARY KEY
                           CONSTRAINT FK_web_producto_producto REFERENCES dbo.producto(idProducto),
        descripcionWeb     NVARCHAR(MAX) NULL,
        visible            BIT           NOT NULL DEFAULT 1,
        destacado          BIT           NOT NULL DEFAULT 0,
        precioRecomendado  DECIMAL(18,0) NULL,
        precioFarmashop    DECIMAL(18,0) NULL,
        fechaMod           DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
        idUsuarioWebMod    INT           NULL REFERENCES dbo.usuarioWeb(idUsuarioWeb),
        CONSTRAINT CK_web_producto_precios CHECK (
            precioFarmashop IS NULL OR precioRecomendado IS NULL OR precioFarmashop < precioRecomendado
        )
    );
END
GO

-- Analítica propia: sesiones y eventos
IF OBJECT_ID('dbo.web_sesion', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.web_sesion (
        idSesion      UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        visitanteId   UNIQUEIDENTIFIER NOT NULL,
        inicio        DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
        ultimoEvento  DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
        landing       NVARCHAR(300) NULL,
        referrer      NVARCHAR(300) NULL,
        fuente        VARCHAR(50)   NOT NULL DEFAULT 'directo',
        medio         VARCHAR(50)   NULL,
        campania      NVARCHAR(100) NULL,
        dispositivo   VARCHAR(10)   NULL,
        idPedido      INT           NULL REFERENCES dbo.web_pedido(idPedido)
    );
    CREATE INDEX IX_web_sesion_inicio ON dbo.web_sesion (inicio);
    CREATE INDEX IX_web_sesion_visitante ON dbo.web_sesion (visitanteId);
END
GO

IF OBJECT_ID('dbo.web_evento', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.web_evento (
        idEvento    BIGINT IDENTITY(1,1) PRIMARY KEY,
        idSesion    UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.web_sesion(idSesion),
        fecha       DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
        tipo        VARCHAR(20)   NOT NULL
                    CONSTRAINT CK_web_evento_tipo CHECK (tipo IN ('page_view','view_item','search','add_to_cart','begin_checkout','purchase')),
        ruta        NVARCHAR(300) NULL,
        idProducto  INT           NULL,
        termino     NVARCHAR(100) NULL,
        resultados  INT           NULL,
        valor       DECIMAL(18,0) NULL
    );
    CREATE INDEX IX_web_evento_fecha_tipo ON dbo.web_evento (fecha, tipo) INCLUDE (idSesion, idProducto);
    CREATE INDEX IX_web_evento_sesion ON dbo.web_evento (idSesion);
END
GO

-- Auditoría de cambios hechos desde el panel
IF OBJECT_ID('dbo.web_auditoria', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.web_auditoria (
        idAuditoria   BIGINT IDENTITY(1,1) PRIMARY KEY,
        idUsuarioWeb  INT           NOT NULL REFERENCES dbo.usuarioWeb(idUsuarioWeb),
        fecha         DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
        accion        VARCHAR(50)   NOT NULL,
        detalle       NVARCHAR(MAX) NULL
    );
    CREATE INDEX IX_web_auditoria_fecha ON dbo.web_auditoria (fecha DESC);
END
GO

-- Fecha de cambio de estado del pedido (para medir tiempo a entrega)
IF COL_LENGTH('dbo.web_pedido', 'fechaEstado') IS NULL
    ALTER TABLE dbo.web_pedido ADD fechaEstado DATETIME2 NULL;
GO
