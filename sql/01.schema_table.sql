CREATE TABLE dbo.Plot
(
	Id INT IDENTITY(1,1) 
		CONSTRAINT pk_Plot PRIMARY KEY CLUSTERED,
	DiscordServerId BIGINT NOT NULL,
	OwnerId BIGINT NOT NULL,
	CenterX BIGINT NOT NULL,
	CenterY BIGINT NOT NULL,
	Area GEOMETRY NULL,
	RealmName NVARCHAR(100) NOT NULL,
	Notes NVARCHAR(500) NULL
);
GO

--CREATE SPATIAL INDEX siArea 
--	ON dbo.Plot (Area)
--	USING GEOMETRY_AUTO_GRID 
--	WITH
--	(
--		BOUNDING_BOX = (XMIN=-10000, YMIN=-10000, XMAX=10000, YMAX=10000)
--	);
--GO

CREATE NONCLUSTERED INDEX ixDiscordServerId_RealmName_INCLUDES
ON dbo.Plot (
                DiscordServerId,
                RealmName
            )
INCLUDE (Area, OwnerId);

CREATE TABLE dbo.AppLog
(
	Id INT IDENTITY(1,1) 
		CONSTRAINT pk_AppLog PRIMARY KEY CLUSTERED,
	LogTime DATETIME NOT NULL
		CONSTRAINT df_LogTime DEFAULT GETUTCDATE(),
	Message NVARCHAR(200) NOT NULL,
	StackTrace VARCHAR(MAX) NULL
);
GO

CREATE TABLE dbo.RealmSetting
(
	Id INT IDENTITY(1,1)
		CONSTRAINT pk_RealmSetting PRIMARY KEY CLUSTERED,
	[Key] VARCHAR(50)  NOT NULL,
	[Value] VARCHAR(500) NOT NULL,
	DiscordServerId BIGINT NOT NULL,
	RealmName NVARCHAR(50) NOT NULL,
	PlayerId BIGINT NULL
);
GO

CREATE NONCLUSTERED INDEX ixDiscordServerId_RealmName_PlayerId 
	ON dbo.RealmSetting
	(
		[Key],
		DiscordServerId,
		RealmName,
		PlayerId
	) 
INCLUDE (Value);
GO