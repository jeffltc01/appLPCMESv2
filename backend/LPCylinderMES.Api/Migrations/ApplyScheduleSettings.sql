-- Run this script if the schedule_settings table is missing (e.g. migration was not applied).
-- Creates the schedule_settings table and seeds default values.

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'schedule_settings')
BEGIN
    CREATE TABLE schedule_settings (
        id int IDENTITY(1,1) NOT NULL,
        throughput_lookback_days int NOT NULL DEFAULT 90,
        updated_utc datetime NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_by_emp_no varchar(20) NULL,
        CONSTRAINT PK_schedule_settings PRIMARY KEY (id)
    );

    SET IDENTITY_INSERT schedule_settings ON;
    INSERT INTO schedule_settings (id, throughput_lookback_days, updated_utc)
    VALUES (1, 90, SYSUTCDATETIME());
    SET IDENTITY_INSERT schedule_settings OFF;

    -- Record migration so EF Core knows it was applied
    INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion)
    VALUES ('20260314151157_AddScheduleSettingsDesigner', '9.0.13');
END
GO
