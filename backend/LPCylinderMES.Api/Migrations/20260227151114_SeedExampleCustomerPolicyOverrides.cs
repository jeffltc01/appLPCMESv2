using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LPCylinderMES.Api.Migrations
{
    /// <inheritdoc />
    public partial class SeedExampleCustomerPolicyOverrides : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DECLARE @exampleCustomerId INT;
                SELECT TOP (1) @exampleCustomerId = id
                FROM customers
                ORDER BY id;

                IF @exampleCustomerId IS NOT NULL
                BEGIN
                    MERGE business_decision_policies AS target
                    USING (SELECT 1 AS policy_version, 'AttachmentEmailPolicy' AS decision_key, @exampleCustomerId AS customer_id) AS src
                    ON target.policy_version = src.policy_version
                       AND target.decision_key = src.decision_key
                       AND target.scope_type = 'Customer'
                       AND target.site_id IS NULL
                       AND target.customer_id = src.customer_id
                    WHEN MATCHED THEN
                        UPDATE SET policy_value = 'MandatoryForAll', is_active = 0, updated_utc = GETUTCDATE(), updated_by_emp_no = 'SYSTEM-EXAMPLE', notes = 'Example override: always send attachment email for this customer'
                    WHEN NOT MATCHED THEN
                        INSERT (policy_version, decision_key, scope_type, site_id, customer_id, policy_value, is_active, updated_utc, updated_by_emp_no, notes)
                        VALUES (1, 'AttachmentEmailPolicy', 'Customer', NULL, @exampleCustomerId, 'MandatoryForAll', 0, GETUTCDATE(), 'SYSTEM-EXAMPLE', 'Example override: always send attachment email for this customer');

                    MERGE business_decision_policies AS target
                    USING (SELECT 1 AS policy_version, 'RequiredAttachmentCategoriesCsv' AS decision_key, @exampleCustomerId AS customer_id) AS src
                    ON target.policy_version = src.policy_version
                       AND target.decision_key = src.decision_key
                       AND target.scope_type = 'Customer'
                       AND target.site_id IS NULL
                       AND target.customer_id = src.customer_id
                    WHEN MATCHED THEN
                        UPDATE SET policy_value = 'TestResult,SerialReport,PackingSlip', is_active = 0, updated_utc = GETUTCDATE(), updated_by_emp_no = 'SYSTEM-EXAMPLE', notes = 'Example override: stricter attachment categories for this customer'
                    WHEN NOT MATCHED THEN
                        INSERT (policy_version, decision_key, scope_type, site_id, customer_id, policy_value, is_active, updated_utc, updated_by_emp_no, notes)
                        VALUES (1, 'RequiredAttachmentCategoriesCsv', 'Customer', NULL, @exampleCustomerId, 'TestResult,SerialReport,PackingSlip', 0, GETUTCDATE(), 'SYSTEM-EXAMPLE', 'Example override: stricter attachment categories for this customer');
                END
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DELETE FROM business_decision_policies
                WHERE policy_version = 1
                  AND scope_type = 'Customer'
                  AND updated_by_emp_no = 'SYSTEM-EXAMPLE'
                  AND decision_key IN ('AttachmentEmailPolicy', 'RequiredAttachmentCategoriesCsv');
                """);
        }
    }
}
