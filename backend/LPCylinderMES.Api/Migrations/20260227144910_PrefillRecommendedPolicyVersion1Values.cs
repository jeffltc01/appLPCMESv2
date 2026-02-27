using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LPCylinderMES.Api.Migrations
{
    /// <inheritdoc />
    public partial class PrefillRecommendedPolicyVersion1Values : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                MERGE business_decision_policies AS target
                USING (SELECT 1 AS policy_version, 'HoldReleaseAuthorityRole' AS decision_key) AS src
                ON target.policy_version = src.policy_version
                   AND target.decision_key = src.decision_key
                   AND target.scope_type = 'Global'
                   AND target.site_id IS NULL
                   AND target.customer_id IS NULL
                WHEN MATCHED THEN
                    UPDATE SET policy_value = 'Supervisor', is_active = 0, updated_utc = GETUTCDATE(), updated_by_emp_no = 'SYSTEM-RECOMMENDED', notes = 'Recommended baseline'
                WHEN NOT MATCHED THEN
                    INSERT (policy_version, decision_key, scope_type, site_id, customer_id, policy_value, is_active, updated_utc, updated_by_emp_no, notes)
                    VALUES (1, 'HoldReleaseAuthorityRole', 'Global', NULL, NULL, 'Supervisor', 0, GETUTCDATE(), 'SYSTEM-RECOMMENDED', 'Recommended baseline');

                MERGE business_decision_policies AS target
                USING (SELECT 1 AS policy_version, 'AllowCustomerDropoffTransitWithAppointment' AS decision_key) AS src
                ON target.policy_version = src.policy_version
                   AND target.decision_key = src.decision_key
                   AND target.scope_type = 'Global'
                   AND target.site_id IS NULL
                   AND target.customer_id IS NULL
                WHEN MATCHED THEN
                    UPDATE SET policy_value = 'true', is_active = 0, updated_utc = GETUTCDATE(), updated_by_emp_no = 'SYSTEM-RECOMMENDED', notes = 'Recommended baseline'
                WHEN NOT MATCHED THEN
                    INSERT (policy_version, decision_key, scope_type, site_id, customer_id, policy_value, is_active, updated_utc, updated_by_emp_no, notes)
                    VALUES (1, 'AllowCustomerDropoffTransitWithAppointment', 'Global', NULL, NULL, 'true', 0, GETUTCDATE(), 'SYSTEM-RECOMMENDED', 'Recommended baseline');

                MERGE business_decision_policies AS target
                USING (SELECT 1 AS policy_version, 'RequireOutboundPlannedForCustomerPickup' AS decision_key) AS src
                ON target.policy_version = src.policy_version
                   AND target.decision_key = src.decision_key
                   AND target.scope_type = 'Global'
                   AND target.site_id IS NULL
                   AND target.customer_id IS NULL
                WHEN MATCHED THEN
                    UPDATE SET policy_value = 'true', is_active = 0, updated_utc = GETUTCDATE(), updated_by_emp_no = 'SYSTEM-RECOMMENDED', notes = 'Recommended baseline'
                WHEN NOT MATCHED THEN
                    INSERT (policy_version, decision_key, scope_type, site_id, customer_id, policy_value, is_active, updated_utc, updated_by_emp_no, notes)
                    VALUES (1, 'RequireOutboundPlannedForCustomerPickup', 'Global', NULL, NULL, 'true', 0, GETUTCDATE(), 'SYSTEM-RECOMMENDED', 'Recommended baseline');

                MERGE business_decision_policies AS target
                USING (SELECT 1 AS policy_version, 'AttachmentEmailPolicy' AS decision_key) AS src
                ON target.policy_version = src.policy_version
                   AND target.decision_key = src.decision_key
                   AND target.scope_type = 'Global'
                   AND target.site_id IS NULL
                   AND target.customer_id IS NULL
                WHEN MATCHED THEN
                    UPDATE SET policy_value = 'MandatoryForConfiguredCustomers', is_active = 0, updated_utc = GETUTCDATE(), updated_by_emp_no = 'SYSTEM-RECOMMENDED', notes = 'Recommended baseline'
                WHEN NOT MATCHED THEN
                    INSERT (policy_version, decision_key, scope_type, site_id, customer_id, policy_value, is_active, updated_utc, updated_by_emp_no, notes)
                    VALUES (1, 'AttachmentEmailPolicy', 'Global', NULL, NULL, 'MandatoryForConfiguredCustomers', 0, GETUTCDATE(), 'SYSTEM-RECOMMENDED', 'Recommended baseline');

                MERGE business_decision_policies AS target
                USING (SELECT 1 AS policy_version, 'AttachmentEmailRequiredCustomerIdsCsv' AS decision_key) AS src
                ON target.policy_version = src.policy_version
                   AND target.decision_key = src.decision_key
                   AND target.scope_type = 'Global'
                   AND target.site_id IS NULL
                   AND target.customer_id IS NULL
                WHEN MATCHED THEN
                    UPDATE SET policy_value = '', is_active = 0, updated_utc = GETUTCDATE(), updated_by_emp_no = 'SYSTEM-RECOMMENDED', notes = 'Configure customer ids before activation'
                WHEN NOT MATCHED THEN
                    INSERT (policy_version, decision_key, scope_type, site_id, customer_id, policy_value, is_active, updated_utc, updated_by_emp_no, notes)
                    VALUES (1, 'AttachmentEmailRequiredCustomerIdsCsv', 'Global', NULL, NULL, '', 0, GETUTCDATE(), 'SYSTEM-RECOMMENDED', 'Configure customer ids before activation');

                MERGE business_decision_policies AS target
                USING (SELECT 1 AS policy_version, 'MissingDeliveryEvidenceBehavior' AS decision_key) AS src
                ON target.policy_version = src.policy_version
                   AND target.decision_key = src.decision_key
                   AND target.scope_type = 'Global'
                   AND target.site_id IS NULL
                   AND target.customer_id IS NULL
                WHEN MATCHED THEN
                    UPDATE SET policy_value = 'ReportingOnly', is_active = 0, updated_utc = GETUTCDATE(), updated_by_emp_no = 'SYSTEM-RECOMMENDED', notes = 'Recommended baseline'
                WHEN NOT MATCHED THEN
                    INSERT (policy_version, decision_key, scope_type, site_id, customer_id, policy_value, is_active, updated_utc, updated_by_emp_no, notes)
                    VALUES (1, 'MissingDeliveryEvidenceBehavior', 'Global', NULL, NULL, 'ReportingOnly', 0, GETUTCDATE(), 'SYSTEM-RECOMMENDED', 'Recommended baseline');

                MERGE business_decision_policies AS target
                USING (SELECT 1 AS policy_version, 'RequiredAttachmentCategoriesCsv' AS decision_key) AS src
                ON target.policy_version = src.policy_version
                   AND target.decision_key = src.decision_key
                   AND target.scope_type = 'Global'
                   AND target.site_id IS NULL
                   AND target.customer_id IS NULL
                WHEN MATCHED THEN
                    UPDATE SET policy_value = 'TestResult,SerialReport', is_active = 0, updated_utc = GETUTCDATE(), updated_by_emp_no = 'SYSTEM-RECOMMENDED', notes = 'Recommended baseline'
                WHEN NOT MATCHED THEN
                    INSERT (policy_version, decision_key, scope_type, site_id, customer_id, policy_value, is_active, updated_utc, updated_by_emp_no, notes)
                    VALUES (1, 'RequiredAttachmentCategoriesCsv', 'Global', NULL, NULL, 'TestResult,SerialReport', 0, GETUTCDATE(), 'SYSTEM-RECOMMENDED', 'Recommended baseline');

                MERGE business_decision_policies AS target
                USING (SELECT 1 AS policy_version, 'ReworkRevertTargetStatus' AS decision_key) AS src
                ON target.policy_version = src.policy_version
                   AND target.decision_key = src.decision_key
                   AND target.scope_type = 'Global'
                   AND target.site_id IS NULL
                   AND target.customer_id IS NULL
                WHEN MATCHED THEN
                    UPDATE SET policy_value = 'ProductionCompletePendingApproval', is_active = 0, updated_utc = GETUTCDATE(), updated_by_emp_no = 'SYSTEM-RECOMMENDED', notes = 'Recommended baseline'
                WHEN NOT MATCHED THEN
                    INSERT (policy_version, decision_key, scope_type, site_id, customer_id, policy_value, is_active, updated_utc, updated_by_emp_no, notes)
                    VALUES (1, 'ReworkRevertTargetStatus', 'Global', NULL, NULL, 'ProductionCompletePendingApproval', 0, GETUTCDATE(), 'SYSTEM-RECOMMENDED', 'Recommended baseline');

                MERGE business_decision_policies AS target
                USING (SELECT 1 AS policy_version, 'PromiseReasonTaxonomyOwnerRole' AS decision_key) AS src
                ON target.policy_version = src.policy_version
                   AND target.decision_key = src.decision_key
                   AND target.scope_type = 'Global'
                   AND target.site_id IS NULL
                   AND target.customer_id IS NULL
                WHEN MATCHED THEN
                    UPDATE SET policy_value = 'Office', is_active = 0, updated_utc = GETUTCDATE(), updated_by_emp_no = 'SYSTEM-RECOMMENDED', notes = 'Recommended baseline'
                WHEN NOT MATCHED THEN
                    INSERT (policy_version, decision_key, scope_type, site_id, customer_id, policy_value, is_active, updated_utc, updated_by_emp_no, notes)
                    VALUES (1, 'PromiseReasonTaxonomyOwnerRole', 'Global', NULL, NULL, 'Office', 0, GETUTCDATE(), 'SYSTEM-RECOMMENDED', 'Recommended baseline');
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE business_decision_policies
                SET policy_value = 'Supervisor', updated_utc = GETUTCDATE(), updated_by_emp_no = 'SYSTEM-SEED', notes = 'Seeded v1 default'
                WHERE policy_version = 1 AND decision_key = 'HoldReleaseAuthorityRole' AND scope_type = 'Global' AND site_id IS NULL AND customer_id IS NULL;

                UPDATE business_decision_policies
                SET policy_value = 'false', updated_utc = GETUTCDATE(), updated_by_emp_no = 'SYSTEM-SEED', notes = 'Seeded v1 default'
                WHERE policy_version = 1 AND decision_key IN ('AllowCustomerDropoffTransitWithAppointment', 'RequireOutboundPlannedForCustomerPickup')
                  AND scope_type = 'Global' AND site_id IS NULL AND customer_id IS NULL;

                UPDATE business_decision_policies
                SET policy_value = 'AlwaysOptional', updated_utc = GETUTCDATE(), updated_by_emp_no = 'SYSTEM-SEED', notes = 'Seeded v1 default'
                WHERE policy_version = 1 AND decision_key = 'AttachmentEmailPolicy' AND scope_type = 'Global' AND site_id IS NULL AND customer_id IS NULL;

                UPDATE business_decision_policies
                SET policy_value = '', updated_utc = GETUTCDATE(), updated_by_emp_no = 'SYSTEM-SEED', notes = 'Seeded v1 default'
                WHERE policy_version = 1 AND decision_key IN ('AttachmentEmailRequiredCustomerIdsCsv', 'RequiredAttachmentCategoriesCsv')
                  AND scope_type = 'Global' AND site_id IS NULL AND customer_id IS NULL;

                UPDATE business_decision_policies
                SET policy_value = 'ReportingOnly', updated_utc = GETUTCDATE(), updated_by_emp_no = 'SYSTEM-SEED', notes = 'Seeded v1 default'
                WHERE policy_version = 1 AND decision_key = 'MissingDeliveryEvidenceBehavior' AND scope_type = 'Global' AND site_id IS NULL AND customer_id IS NULL;

                UPDATE business_decision_policies
                SET policy_value = 'InProduction', updated_utc = GETUTCDATE(), updated_by_emp_no = 'SYSTEM-SEED', notes = 'Seeded v1 default'
                WHERE policy_version = 1 AND decision_key = 'ReworkRevertTargetStatus' AND scope_type = 'Global' AND site_id IS NULL AND customer_id IS NULL;

                UPDATE business_decision_policies
                SET policy_value = 'Office', updated_utc = GETUTCDATE(), updated_by_emp_no = 'SYSTEM-SEED', notes = 'Seeded v1 default'
                WHERE policy_version = 1 AND decision_key = 'PromiseReasonTaxonomyOwnerRole' AND scope_type = 'Global' AND site_id IS NULL AND customer_id IS NULL;
                """);
        }
    }
}
