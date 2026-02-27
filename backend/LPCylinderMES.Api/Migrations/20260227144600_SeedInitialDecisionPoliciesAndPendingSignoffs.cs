using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LPCylinderMES.Api.Migrations
{
    /// <inheritdoc />
    public partial class SeedInitialDecisionPoliciesAndPendingSignoffs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateTime>(
                name: "approved_utc",
                table: "business_decision_signoffs",
                type: "datetime",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime");

            migrationBuilder.AlterColumn<string>(
                name: "approved_by_emp_no",
                table: "business_decision_signoffs",
                type: "varchar(30)",
                unicode: false,
                maxLength: 30,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(30)",
                oldUnicode: false,
                oldMaxLength: 30);

            migrationBuilder.AddColumn<bool>(
                name: "is_approved",
                table: "business_decision_signoffs",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.Sql("""
                IF NOT EXISTS (SELECT 1 FROM business_decision_policies WHERE policy_version = 1 AND decision_key = 'HoldReleaseAuthorityRole' AND scope_type = 'Global')
                INSERT INTO business_decision_policies (policy_version, decision_key, scope_type, site_id, customer_id, policy_value, is_active, updated_utc, updated_by_emp_no, notes)
                VALUES (1, 'HoldReleaseAuthorityRole', 'Global', NULL, NULL, 'Supervisor', 0, GETUTCDATE(), 'SYSTEM-SEED', 'Seeded v1 default');

                IF NOT EXISTS (SELECT 1 FROM business_decision_policies WHERE policy_version = 1 AND decision_key = 'AllowCustomerDropoffTransitWithAppointment' AND scope_type = 'Global')
                INSERT INTO business_decision_policies (policy_version, decision_key, scope_type, site_id, customer_id, policy_value, is_active, updated_utc, updated_by_emp_no, notes)
                VALUES (1, 'AllowCustomerDropoffTransitWithAppointment', 'Global', NULL, NULL, 'false', 0, GETUTCDATE(), 'SYSTEM-SEED', 'Seeded v1 default');

                IF NOT EXISTS (SELECT 1 FROM business_decision_policies WHERE policy_version = 1 AND decision_key = 'RequireOutboundPlannedForCustomerPickup' AND scope_type = 'Global')
                INSERT INTO business_decision_policies (policy_version, decision_key, scope_type, site_id, customer_id, policy_value, is_active, updated_utc, updated_by_emp_no, notes)
                VALUES (1, 'RequireOutboundPlannedForCustomerPickup', 'Global', NULL, NULL, 'false', 0, GETUTCDATE(), 'SYSTEM-SEED', 'Seeded v1 default');

                IF NOT EXISTS (SELECT 1 FROM business_decision_policies WHERE policy_version = 1 AND decision_key = 'AttachmentEmailPolicy' AND scope_type = 'Global')
                INSERT INTO business_decision_policies (policy_version, decision_key, scope_type, site_id, customer_id, policy_value, is_active, updated_utc, updated_by_emp_no, notes)
                VALUES (1, 'AttachmentEmailPolicy', 'Global', NULL, NULL, 'AlwaysOptional', 0, GETUTCDATE(), 'SYSTEM-SEED', 'Seeded v1 default');

                IF NOT EXISTS (SELECT 1 FROM business_decision_policies WHERE policy_version = 1 AND decision_key = 'AttachmentEmailRequiredCustomerIdsCsv' AND scope_type = 'Global')
                INSERT INTO business_decision_policies (policy_version, decision_key, scope_type, site_id, customer_id, policy_value, is_active, updated_utc, updated_by_emp_no, notes)
                VALUES (1, 'AttachmentEmailRequiredCustomerIdsCsv', 'Global', NULL, NULL, '', 0, GETUTCDATE(), 'SYSTEM-SEED', 'Seeded v1 default');

                IF NOT EXISTS (SELECT 1 FROM business_decision_policies WHERE policy_version = 1 AND decision_key = 'MissingDeliveryEvidenceBehavior' AND scope_type = 'Global')
                INSERT INTO business_decision_policies (policy_version, decision_key, scope_type, site_id, customer_id, policy_value, is_active, updated_utc, updated_by_emp_no, notes)
                VALUES (1, 'MissingDeliveryEvidenceBehavior', 'Global', NULL, NULL, 'ReportingOnly', 0, GETUTCDATE(), 'SYSTEM-SEED', 'Seeded v1 default');

                IF NOT EXISTS (SELECT 1 FROM business_decision_policies WHERE policy_version = 1 AND decision_key = 'RequiredAttachmentCategoriesCsv' AND scope_type = 'Global')
                INSERT INTO business_decision_policies (policy_version, decision_key, scope_type, site_id, customer_id, policy_value, is_active, updated_utc, updated_by_emp_no, notes)
                VALUES (1, 'RequiredAttachmentCategoriesCsv', 'Global', NULL, NULL, '', 0, GETUTCDATE(), 'SYSTEM-SEED', 'Seeded v1 default');

                IF NOT EXISTS (SELECT 1 FROM business_decision_policies WHERE policy_version = 1 AND decision_key = 'ReworkRevertTargetStatus' AND scope_type = 'Global')
                INSERT INTO business_decision_policies (policy_version, decision_key, scope_type, site_id, customer_id, policy_value, is_active, updated_utc, updated_by_emp_no, notes)
                VALUES (1, 'ReworkRevertTargetStatus', 'Global', NULL, NULL, 'InProduction', 0, GETUTCDATE(), 'SYSTEM-SEED', 'Seeded v1 default');

                IF NOT EXISTS (SELECT 1 FROM business_decision_policies WHERE policy_version = 1 AND decision_key = 'PromiseReasonTaxonomyOwnerRole' AND scope_type = 'Global')
                INSERT INTO business_decision_policies (policy_version, decision_key, scope_type, site_id, customer_id, policy_value, is_active, updated_utc, updated_by_emp_no, notes)
                VALUES (1, 'PromiseReasonTaxonomyOwnerRole', 'Global', NULL, NULL, 'Office', 0, GETUTCDATE(), 'SYSTEM-SEED', 'Seeded v1 default');
                """);

            migrationBuilder.Sql("""
                IF NOT EXISTS (SELECT 1 FROM business_decision_signoffs WHERE policy_version = 1 AND function_role = 'Office')
                INSERT INTO business_decision_signoffs (policy_version, function_role, is_approved, approved_by_emp_no, approved_utc, notes)
                VALUES (1, 'Office', 0, NULL, NULL, 'Pending cross-functional review');

                IF NOT EXISTS (SELECT 1 FROM business_decision_signoffs WHERE policy_version = 1 AND function_role = 'Transportation')
                INSERT INTO business_decision_signoffs (policy_version, function_role, is_approved, approved_by_emp_no, approved_utc, notes)
                VALUES (1, 'Transportation', 0, NULL, NULL, 'Pending cross-functional review');

                IF NOT EXISTS (SELECT 1 FROM business_decision_signoffs WHERE policy_version = 1 AND function_role = 'Receiving')
                INSERT INTO business_decision_signoffs (policy_version, function_role, is_approved, approved_by_emp_no, approved_utc, notes)
                VALUES (1, 'Receiving', 0, NULL, NULL, 'Pending cross-functional review');

                IF NOT EXISTS (SELECT 1 FROM business_decision_signoffs WHERE policy_version = 1 AND function_role = 'Production')
                INSERT INTO business_decision_signoffs (policy_version, function_role, is_approved, approved_by_emp_no, approved_utc, notes)
                VALUES (1, 'Production', 0, NULL, NULL, 'Pending cross-functional review');

                IF NOT EXISTS (SELECT 1 FROM business_decision_signoffs WHERE policy_version = 1 AND function_role = 'Quality')
                INSERT INTO business_decision_signoffs (policy_version, function_role, is_approved, approved_by_emp_no, approved_utc, notes)
                VALUES (1, 'Quality', 0, NULL, NULL, 'Pending cross-functional review');

                IF NOT EXISTS (SELECT 1 FROM business_decision_signoffs WHERE policy_version = 1 AND function_role = 'Accounting')
                INSERT INTO business_decision_signoffs (policy_version, function_role, is_approved, approved_by_emp_no, approved_utc, notes)
                VALUES (1, 'Accounting', 0, NULL, NULL, 'Pending cross-functional review');
                """);

            migrationBuilder.Sql("""
                IF NOT EXISTS (SELECT 1 FROM promise_reason_policies WHERE reason_code = 'Capacity')
                INSERT INTO promise_reason_policies (reason_code, description, owner_role, allowed_notification_policies, is_active, updated_utc, updated_by_emp_no)
                VALUES ('Capacity', 'Capacity constraint impacted promise commitment.', 'Office', 'Notified,DeferredNotification,InternalOnly', 1, GETUTCDATE(), 'SYSTEM-SEED');

                IF NOT EXISTS (SELECT 1 FROM promise_reason_policies WHERE reason_code = 'Material')
                INSERT INTO promise_reason_policies (reason_code, description, owner_role, allowed_notification_policies, is_active, updated_utc, updated_by_emp_no)
                VALUES ('Material', 'Material availability impacted commitment.', 'Office', 'Notified,DeferredNotification,InternalOnly', 1, GETUTCDATE(), 'SYSTEM-SEED');

                IF NOT EXISTS (SELECT 1 FROM promise_reason_policies WHERE reason_code = 'Quality')
                INSERT INTO promise_reason_policies (reason_code, description, owner_role, allowed_notification_policies, is_active, updated_utc, updated_by_emp_no)
                VALUES ('Quality', 'Quality findings impacted commitment.', 'Office', 'Notified,DeferredNotification,InternalOnly', 1, GETUTCDATE(), 'SYSTEM-SEED');

                IF NOT EXISTS (SELECT 1 FROM promise_reason_policies WHERE reason_code = 'CustomerChange')
                INSERT INTO promise_reason_policies (reason_code, description, owner_role, allowed_notification_policies, is_active, updated_utc, updated_by_emp_no)
                VALUES ('CustomerChange', 'Customer-requested change impacted commitment.', 'Office', 'Notified,DeferredNotification,InternalOnly', 1, GETUTCDATE(), 'SYSTEM-SEED');

                IF NOT EXISTS (SELECT 1 FROM promise_reason_policies WHERE reason_code = 'Logistics')
                INSERT INTO promise_reason_policies (reason_code, description, owner_role, allowed_notification_policies, is_active, updated_utc, updated_by_emp_no)
                VALUES ('Logistics', 'Transport or carrier constraints impacted commitment.', 'Office', 'Notified,DeferredNotification,InternalOnly', 1, GETUTCDATE(), 'SYSTEM-SEED');

                IF NOT EXISTS (SELECT 1 FROM promise_reason_policies WHERE reason_code = 'ExternalDependency')
                INSERT INTO promise_reason_policies (reason_code, description, owner_role, allowed_notification_policies, is_active, updated_utc, updated_by_emp_no)
                VALUES ('ExternalDependency', 'Third-party dependency impacted commitment.', 'Office', 'Notified,DeferredNotification,InternalOnly', 1, GETUTCDATE(), 'SYSTEM-SEED');

                IF NOT EXISTS (SELECT 1 FROM promise_reason_policies WHERE reason_code = 'Other')
                INSERT INTO promise_reason_policies (reason_code, description, owner_role, allowed_notification_policies, is_active, updated_utc, updated_by_emp_no)
                VALUES ('Other', 'Other commitment-impacting reason.', 'Office', 'Notified,DeferredNotification,InternalOnly', 1, GETUTCDATE(), 'SYSTEM-SEED');
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "is_approved",
                table: "business_decision_signoffs");

            migrationBuilder.AlterColumn<DateTime>(
                name: "approved_utc",
                table: "business_decision_signoffs",
                type: "datetime",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "datetime",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "approved_by_emp_no",
                table: "business_decision_signoffs",
                type: "varchar(30)",
                unicode: false,
                maxLength: 30,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "varchar(30)",
                oldUnicode: false,
                oldMaxLength: 30,
                oldNullable: true);

            migrationBuilder.Sql("""
                DELETE FROM business_decision_signoffs
                WHERE policy_version = 1
                  AND function_role IN ('Office', 'Transportation', 'Receiving', 'Production', 'Quality', 'Accounting')
                  AND (approved_by_emp_no IS NULL OR approved_by_emp_no = '')
                  AND notes = 'Pending cross-functional review';

                DELETE FROM business_decision_policies
                WHERE policy_version = 1
                  AND updated_by_emp_no = 'SYSTEM-SEED'
                  AND decision_key IN (
                    'HoldReleaseAuthorityRole',
                    'AllowCustomerDropoffTransitWithAppointment',
                    'RequireOutboundPlannedForCustomerPickup',
                    'AttachmentEmailPolicy',
                    'AttachmentEmailRequiredCustomerIdsCsv',
                    'MissingDeliveryEvidenceBehavior',
                    'RequiredAttachmentCategoriesCsv',
                    'ReworkRevertTargetStatus',
                    'PromiseReasonTaxonomyOwnerRole'
                  );

                DELETE FROM promise_reason_policies
                WHERE updated_by_emp_no = 'SYSTEM-SEED'
                  AND reason_code IN ('Capacity', 'Material', 'Quality', 'CustomerChange', 'Logistics', 'ExternalDependency', 'Other');
                """);
        }
    }
}
