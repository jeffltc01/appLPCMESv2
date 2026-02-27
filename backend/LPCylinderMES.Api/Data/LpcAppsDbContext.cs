using System;
using System.Collections.Generic;
using LPCylinderMES.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Data;

public partial class LpcAppsDbContext : DbContext
{
    public LpcAppsDbContext(DbContextOptions<LpcAppsDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Address> Addresses { get; set; }

    public virtual DbSet<Color> Colors { get; set; }

    public virtual DbSet<Contact> Contacts { get; set; }

    public virtual DbSet<Customer> Customers { get; set; }

    public virtual DbSet<CustomerItem> CustomerItems { get; set; }

    public virtual DbSet<Item> Items { get; set; }
    
    public virtual DbSet<OrderLineRouteInstance> OrderLineRouteInstances { get; set; }

    public virtual DbSet<OrderLineRouteStepInstance> OrderLineRouteStepInstances { get; set; }

    public virtual DbSet<OperatorActivityLog> OperatorActivityLogs { get; set; }

    public virtual DbSet<OrderAttachment> OrderAttachments { get; set; }

    public virtual DbSet<BusinessDecisionPolicy> BusinessDecisionPolicies { get; set; }

    public virtual DbSet<BusinessDecisionSignoff> BusinessDecisionSignoffs { get; set; }

    public virtual DbSet<PromiseReasonPolicy> PromiseReasonPolicies { get; set; }

    public virtual DbSet<ItemSize> ItemSizes { get; set; }

    public virtual DbSet<Manufacturer> Manufacturers { get; set; }

    public virtual DbSet<PartCrossReference> PartCrossReferences { get; set; }

    public virtual DbSet<PaymentTerm> PaymentTerms { get; set; }

    public virtual DbSet<Pricing> Pricings { get; set; }

    public virtual DbSet<SalesOrder> SalesOrders { get; set; }

    public virtual DbSet<SalesOrderDetail> SalesOrderDetails { get; set; }

    public virtual DbSet<SalesOrderDetailCharge> SalesOrderDetailCharges { get; set; }

    public virtual DbSet<SalesOrderDetailSn> SalesOrderDetailSns { get; set; }

    public virtual DbSet<SalesPeople> SalesPeoples { get; set; }

    public virtual DbSet<ScrapReason> ScrapReasons { get; set; }

    public virtual DbSet<RouteTemplate> RouteTemplates { get; set; }

    public virtual DbSet<RouteTemplateAssignment> RouteTemplateAssignments { get; set; }

    public virtual DbSet<RouteTemplateStep> RouteTemplateSteps { get; set; }

    public virtual DbSet<ShipVia> ShipVias { get; set; }

    public virtual DbSet<Site> Sites { get; set; }

    public virtual DbSet<StepChecklistResult> StepChecklistResults { get; set; }

    public virtual DbSet<StepMaterialUsage> StepMaterialUsages { get; set; }

    public virtual DbSet<StepScrapEntry> StepScrapEntries { get; set; }

    public virtual DbSet<StepSerialCapture> StepSerialCaptures { get; set; }

    public virtual DbSet<WorkCenter> WorkCenters { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Address>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__addresse__3213E83F5AE845D5");

            entity.ToTable("addresses");

            entity.HasIndex(e => e.Id, "ix_addresses_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Address1)
                .IsUnicode(false)
                .HasColumnName("address1");
            entity.Property(e => e.Address2)
                .IsUnicode(false)
                .HasColumnName("address2");
            entity.Property(e => e.AddressName)
                .HasMaxLength(500)
                .IsUnicode(false)
                .HasColumnName("address_name");
            entity.Property(e => e.City)
                .IsUnicode(false)
                .HasColumnName("city");
            entity.Property(e => e.ContactId).HasColumnName("contact_id");
            entity.Property(e => e.Country)
                .IsUnicode(false)
                .HasColumnName("country");
            entity.Property(e => e.CustomerId).HasColumnName("customer_id");
            entity.Property(e => e.DefaultSalesEmployeeId).HasColumnName("default_sales_employee_id");
            entity.Property(e => e.PostalCode)
                .IsUnicode(false)
                .HasColumnName("postal_code");
            entity.Property(e => e.State)
                .IsUnicode(false)
                .HasColumnName("state");
            entity.Property(e => e.Type)
                .HasMaxLength(7)
                .IsUnicode(false)
                .HasColumnName("type");

            entity.HasOne(d => d.Contact).WithMany(p => p.Addresses)
                .HasForeignKey(d => d.ContactId)
                .HasConstraintName("FK__addresses__conta__46136164");

            entity.HasOne(d => d.Customer).WithMany(p => p.Addresses)
                .HasForeignKey(d => d.CustomerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__addresses__custo__451F3D2B");
        });

        modelBuilder.Entity<Color>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__colors__3213E83F6681F120");

            entity.ToTable("colors");

            entity.HasIndex(e => e.Name, "UQ__colors__72E12F1BE3B3B84F").IsUnique();

            entity.HasIndex(e => e.Id, "ix_colors_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("name");
        });

        modelBuilder.Entity<Contact>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__contacts__3213E83F7213B03C");

            entity.ToTable("contacts");

            entity.HasIndex(e => e.Email, "UQ__contacts__AB6E616477A655DA").IsUnique();

            entity.HasIndex(e => e.Id, "ix_contacts_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CustomerId).HasColumnName("customer_id");
            entity.Property(e => e.Email)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("email");
            entity.Property(e => e.FirstName)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("first_name");
            entity.Property(e => e.LastName)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("last_name");
            entity.Property(e => e.MobilePhone)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("mobile_phone");
            entity.Property(e => e.Notes)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("notes");
            entity.Property(e => e.OfficePhone)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("office_phone");

            entity.HasOne(d => d.Customer).WithMany(p => p.Contacts)
                .HasForeignKey(d => d.CustomerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__contacts__custom__3E723F9C");
        });

        modelBuilder.Entity<Customer>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__customer__3213E83F98082B0B");

            entity.ToTable("customers");

            entity.HasIndex(e => e.Id, "ix_customers_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CustomerCode)
                .IsUnicode(false)
                .HasColumnName("customer_code");
            entity.Property(e => e.CustomerParentId).HasColumnName("customer_parent_id");
            entity.Property(e => e.DefaultBillToId).HasColumnName("default_bill_to_id");
            entity.Property(e => e.DefaultGauges)
                .IsUnicode(false)
                .HasColumnName("default_gauges");
            entity.Property(e => e.DefaultNeedCollars).HasColumnName("default_need_collars");
            entity.Property(e => e.DefaultNeedFillers).HasColumnName("default_need_fillers");
            entity.Property(e => e.DefaultNeedFootRings).HasColumnName("default_need_foot_rings");
            entity.Property(e => e.DefaultOrderContactId).HasColumnName("default_order_contact_id");
            entity.Property(e => e.DefaultPaymentTermId).HasColumnName("default_payment_term_id");
            entity.Property(e => e.DefaultPickUpId).HasColumnName("default_pick_up_id");
            entity.Property(e => e.DefaultReturnBrass).HasColumnName("default_return_brass");
            entity.Property(e => e.DefaultReturnScrap).HasColumnName("default_return_scrap");
            entity.Property(e => e.DefaultSalesEmployeeId).HasColumnName("default_sales_employee_id");
            entity.Property(e => e.DefaultShipToId).HasColumnName("default_ship_to_id");
            entity.Property(e => e.DefaultShipViaId).HasColumnName("default_ship_via_id");
            entity.Property(e => e.DefaultValveType)
                .IsUnicode(false)
                .HasColumnName("default_valve_type");
            entity.Property(e => e.Email)
                .IsUnicode(false)
                .HasColumnName("email");
            entity.Property(e => e.LidColorId).HasColumnName("lid_color_id");
            entity.Property(e => e.Name)
                .IsUnicode(false)
                .HasColumnName("name");
            entity.Property(e => e.Notes)
                .IsUnicode(false)
                .HasColumnName("notes");
            entity.Property(e => e.Status)
                .IsUnicode(false)
                .HasColumnName("status");
            entity.Property(e => e.TankColorId).HasColumnName("tank_color_id");

            entity.HasOne(d => d.CustomerParent).WithMany(p => p.InverseCustomerParent)
                .HasForeignKey(d => d.CustomerParentId)
                .HasConstraintName("FK__customers__custo__2F2FFC0C");

            entity.HasOne(d => d.DefaultPaymentTerm).WithMany(p => p.Customers)
                .HasForeignKey(d => d.DefaultPaymentTermId)
                .HasConstraintName("FK__customers__defau__30242045");

            entity.HasOne(d => d.DefaultOrderContact).WithMany()
                .HasForeignKey(d => d.DefaultOrderContactId)
                .HasConstraintName("FK_customers_default_order_contact");

            entity.HasOne(d => d.DefaultShipVia).WithMany(p => p.Customers)
                .HasForeignKey(d => d.DefaultShipViaId)
                .HasConstraintName("FK__customers__defau__3118447E");

            entity.HasOne(d => d.LidColor).WithMany(p => p.CustomerLidColors)
                .HasForeignKey(d => d.LidColorId)
                .HasConstraintName("FK__customers__lid_c__2E3BD7D3");

            entity.HasOne(d => d.TankColor).WithMany(p => p.CustomerTankColors)
                .HasForeignKey(d => d.TankColorId)
                .HasConstraintName("FK__customers__tank___2D47B39A");
        });

        modelBuilder.Entity<CustomerItem>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__customer__3213E83F12A48E3E");

            entity.ToTable("customer_items");

            entity.HasIndex(e => e.Id, "ix_customer_items_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CustomerId).HasColumnName("customer_id");
            entity.Property(e => e.ItemId).HasColumnName("item_id");
            entity.Property(e => e.LidColorId).HasColumnName("lid_color_id");
            entity.Property(e => e.TankColorId).HasColumnName("tank_color_id");

            entity.HasOne(d => d.Customer).WithMany(p => p.CustomerItems)
                .HasForeignKey(d => d.CustomerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__customer___custo__38B96646");

            entity.HasOne(d => d.Item).WithMany(p => p.CustomerItems)
                .HasForeignKey(d => d.ItemId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__customer___item___37C5420D");

            entity.HasOne(d => d.LidColor).WithMany(p => p.CustomerItemLidColors)
                .HasForeignKey(d => d.LidColorId)
                .HasConstraintName("FK__customer___lid_c__3AA1AEB8");

            entity.HasOne(d => d.TankColor).WithMany(p => p.CustomerItemTankColors)
                .HasForeignKey(d => d.TankColorId)
                .HasConstraintName("FK__customer___tank___39AD8A7F");
        });

        modelBuilder.Entity<Item>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__items__3213E83F05A16803");

            entity.ToTable("items");

            entity.HasIndex(e => e.ItemNo, "UQ__items__5202274F1F373C3F").IsUnique();

            entity.HasIndex(e => e.Id, "ix_items_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ItemDescription)
                .IsUnicode(false)
                .HasColumnName("item_description");
            entity.Property(e => e.ItemNo)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("item_no");
            entity.Property(e => e.ItemSize).HasColumnName("item_size");
            entity.Property(e => e.ItemType)
                .HasMaxLength(13)
                .IsUnicode(false)
                .HasColumnName("item_type");
            entity.Property(e => e.ProductLine)
                .IsUnicode(false)
                .HasColumnName("product_line");
            entity.Property(e => e.RequiresCollarOption).HasColumnName("requires_collar_option");
            entity.Property(e => e.RequiresFillerOption).HasColumnName("requires_filler_option");
            entity.Property(e => e.RequiresFootRingOption).HasColumnName("requires_foot_ring_option");
            entity.Property(e => e.RequiresGaugeOption).HasColumnName("requires_gauge_option");
            entity.Property(e => e.RequiresSerialNumbers).HasColumnName("requires_serial_numbers");
            entity.Property(e => e.RequiresValveTypeOption).HasColumnName("requires_valve_type_option");
            entity.Property(e => e.SystemCode)
                .IsUnicode(false)
                .HasColumnName("system_code");

            entity.HasOne(d => d.ItemSizeNavigation).WithMany(p => p.Items)
                .HasForeignKey(d => d.ItemSize)
                .HasConstraintName("FK__items__item_size__34E8D562");
        });

        modelBuilder.Entity<OrderAttachment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_order_attachments");

            entity.ToTable("order_attachments");

            entity.HasIndex(e => e.OrderId, "ix_order_attachments_order_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.OrderId).HasColumnName("order_id");
            entity.Property(e => e.FileName)
                .HasMaxLength(260)
                .IsUnicode(false)
                .HasColumnName("file_name");
            entity.Property(e => e.BlobPath)
                .HasMaxLength(500)
                .IsUnicode(false)
                .HasColumnName("blob_path");
            entity.Property(e => e.ContentType)
                .HasMaxLength(200)
                .IsUnicode(false)
                .HasColumnName("content_type");
            entity.Property(e => e.Category)
                .HasMaxLength(60)
                .IsUnicode(false)
                .HasColumnName("category");
            entity.Property(e => e.SizeBytes).HasColumnName("size_bytes");
            entity.Property(e => e.CreatedAtUtc)
                .HasColumnType("datetime")
                .HasColumnName("created_at_utc");

            entity.HasOne(d => d.Order).WithMany(p => p.OrderAttachments)
                .HasForeignKey(d => d.OrderId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_order_attachments_sales_orders");
        });

        modelBuilder.Entity<ItemSize>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__item_siz__3213E83F747BDD7A");

            entity.ToTable("item_sizes");

            entity.HasIndex(e => e.Id, "ix_item_sizes_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name)
                .IsUnicode(false)
                .HasColumnName("name");
            entity.Property(e => e.Size).HasColumnName("size");
        });

        modelBuilder.Entity<Manufacturer>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__manufact__3213E83FFEAA6498");

            entity.ToTable("manufacturers");

            entity.HasIndex(e => e.Name, "UQ__manufact__72E12F1B4F381873").IsUnique();

            entity.HasIndex(e => e.Id, "ix_manufacturers_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("name");
        });

        modelBuilder.Entity<PartCrossReference>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__part_cro__3213E83FF0BAB81B");

            entity.ToTable("part_cross_references");

            entity.HasIndex(e => e.Id, "ix_part_cross_references_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ErpItemNumber)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("erp_item_number");
            entity.Property(e => e.LpcItemNumber)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("lpc_item_number");
        });

        modelBuilder.Entity<PaymentTerm>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__payment___3213E83F48AF8F4C");

            entity.ToTable("payment_terms");

            entity.HasIndex(e => e.Name, "UQ__payment___72E12F1BF114EE48").IsUnique();

            entity.HasIndex(e => e.Id, "ix_payment_terms_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("name");
            entity.Property(e => e.NoOfDays).HasColumnName("no_of_days");
            entity.Property(e => e.TermsCode)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("terms_code");
        });

        modelBuilder.Entity<Pricing>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__pricings__3213E83F892AAA3D");

            entity.ToTable("pricings");

            entity.HasIndex(e => e.Id, "ix_pricings_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CustomerId).HasColumnName("customer_id");
            entity.Property(e => e.EffectiveDate).HasColumnName("effective_date");
            entity.Property(e => e.ItemId).HasColumnName("item_id");
            entity.Property(e => e.Notes)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("notes");
            entity.Property(e => e.UnitPrice).HasColumnName("unit_price");

            entity.HasOne(d => d.Customer).WithMany(p => p.Pricings)
                .HasForeignKey(d => d.CustomerId)
                .HasConstraintName("FK__pricings__custom__414EAC47");

            entity.HasOne(d => d.Item).WithMany(p => p.Pricings)
                .HasForeignKey(d => d.ItemId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__pricings__item_i__4242D080");
        });

        modelBuilder.Entity<SalesOrder>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__sales_or__3213E83FC96DCE65");

            entity.ToTable("sales_orders");

            entity.HasIndex(e => e.SalesOrderNo, "UQ__sales_or__ED5996F987318013").IsUnique();

            entity.HasIndex(e => e.Id, "ix_sales_orders_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.BillToAddressId).HasColumnName("bill_to_address_id");
            entity.Property(e => e.Carrier)
                .HasMaxLength(500)
                .IsUnicode(false)
                .HasColumnName("carrier");
            entity.Property(e => e.ClosedDate)
                .HasColumnType("datetime")
                .HasColumnName("closed_date");
            entity.Property(e => e.Comments)
                .HasMaxLength(2000)
                .IsUnicode(false)
                .HasColumnName("comments");
            entity.Property(e => e.Commision)
                .HasColumnType("numeric(18, 6)")
                .HasColumnName("commision");
            entity.Property(e => e.Contact)
                .HasMaxLength(550)
                .IsUnicode(false)
                .HasColumnName("contact");
            entity.Property(e => e.CustomerId).HasColumnName("customer_id");
            entity.Property(e => e.CustomerPoNo)
                .IsUnicode(false)
                .HasColumnName("customer_po_no");
            entity.Property(e => e.DispatchDate)
                .HasColumnType("datetime")
                .HasColumnName("dispatch_date");
            entity.Property(e => e.DeliveryEvidenceReceivedUtc)
                .HasColumnType("datetime")
                .HasColumnName("delivery_evidence_received_utc");
            entity.Property(e => e.DeliveryEvidenceStatus)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("delivery_evidence_status");
            entity.Property(e => e.EmailSentDate)
                .HasColumnType("datetime")
                .HasColumnName("email_sent_date");
            entity.Property(e => e.ErpInvoiceReference)
                .HasMaxLength(80)
                .IsUnicode(false)
                .HasColumnName("erp_invoice_reference");
            entity.Property(e => e.ErpReconcileNote)
                .HasMaxLength(500)
                .IsUnicode(false)
                .HasColumnName("erp_reconcile_note");
            entity.Property(e => e.ErpReconcileStatus)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("erp_reconcile_status");
            entity.Property(e => e.EstDeliveryDate)
                .HasColumnType("datetime")
                .HasColumnName("est_delivery_date");
            entity.Property(e => e.AttachmentEmailPrompted).HasColumnName("attachment_email_prompted");
            entity.Property(e => e.AttachmentEmailRecipientSummary)
                .HasMaxLength(300)
                .IsUnicode(false)
                .HasColumnName("attachment_email_recipient_summary");
            entity.Property(e => e.AttachmentEmailSent).HasColumnName("attachment_email_sent");
            entity.Property(e => e.AttachmentEmailSentUtc)
                .HasColumnType("datetime")
                .HasColumnName("attachment_email_sent_utc");
            entity.Property(e => e.AttachmentEmailSkipReason)
                .HasMaxLength(200)
                .IsUnicode(false)
                .HasColumnName("attachment_email_skip_reason");
            entity.Property(e => e.CurrentCommittedDateUtc)
                .HasColumnType("datetime")
                .HasColumnName("current_committed_date_utc");
            entity.Property(e => e.CustomerReadyContactName)
                .HasMaxLength(150)
                .IsUnicode(false)
                .HasColumnName("customer_ready_contact_name");
            entity.Property(e => e.CustomerReadyLastContactUtc)
                .HasColumnType("datetime")
                .HasColumnName("customer_ready_last_contact_utc");
            entity.Property(e => e.CustomerReadyRetryUtc)
                .HasColumnType("datetime")
                .HasColumnName("customer_ready_retry_utc");
            entity.Property(e => e.FreightAmount)
                .HasColumnType("numeric(18, 6)")
                .HasColumnName("freight_amount");
            entity.Property(e => e.HasOpenRework).HasColumnName("has_open_rework");
            entity.Property(e => e.InvoiceDate)
                .HasColumnType("datetime")
                .HasColumnName("invoice_date");
            entity.Property(e => e.InvoiceReviewCompletedByEmpNo)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("invoice_review_completed_by_emp_no");
            entity.Property(e => e.InvoiceReviewCompletedUtc)
                .HasColumnType("datetime")
                .HasColumnName("invoice_review_completed_utc");
            entity.Property(e => e.InvoiceSubmissionChannel)
                .HasMaxLength(40)
                .IsUnicode(false)
                .HasColumnName("invoice_submission_channel");
            entity.Property(e => e.InvoiceSubmissionCorrelationId)
                .HasMaxLength(120)
                .IsUnicode(false)
                .HasColumnName("invoice_submission_correlation_id");
            entity.Property(e => e.InvoiceStagingError)
                .HasMaxLength(500)
                .IsUnicode(false)
                .HasColumnName("invoice_staging_error");
            entity.Property(e => e.InvoiceStagingResult)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("invoice_staging_result");
            entity.Property(e => e.InvoiceSubmissionRequestedByEmpNo)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("invoice_submission_requested_by_emp_no");
            entity.Property(e => e.InvoiceSubmissionRequestedUtc)
                .HasColumnType("datetime")
                .HasColumnName("invoice_submission_requested_utc");
            entity.Property(e => e.IpadOrderId).HasColumnName("ipad_order_id");
            entity.Property(e => e.InboundMode)
                .HasMaxLength(40)
                .IsUnicode(false)
                .HasColumnName("inbound_mode");
            entity.Property(e => e.OrderDate).HasColumnName("order_date");
            entity.Property(e => e.OrderLifecycleStatus)
                .HasMaxLength(60)
                .IsUnicode(false)
                .HasColumnName("order_lifecycle_status");
            entity.Property(e => e.OrderOrigin)
                .HasMaxLength(40)
                .IsUnicode(false)
                .HasColumnName("order_origin");
            entity.Property(e => e.OrderStatus)
                .IsUnicode(false)
                .HasColumnName("order_status");
            entity.Property(e => e.OutboundMode)
                .HasMaxLength(40)
                .IsUnicode(false)
                .HasColumnName("outbound_mode");
            entity.Property(e => e.PaymentTermId).HasColumnName("payment_term_id");
            entity.Property(e => e.Phone)
                .HasMaxLength(200)
                .IsUnicode(false)
                .HasColumnName("phone");
            entity.Property(e => e.PickUpAddressId).HasColumnName("pick_up_address_id");
            entity.Property(e => e.PickUpViaId).HasColumnName("pick_up_via_id");
            entity.Property(e => e.PickupDate)
                .HasColumnType("datetime")
                .HasColumnName("pickup_date");
            entity.Property(e => e.PickupScheduledDate)
                .HasColumnType("datetime")
                .HasColumnName("pickup_scheduled_date");
            entity.Property(e => e.Priority).HasColumnName("priority");
            entity.Property(e => e.PromiseDateLastChangedByEmpNo)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("promise_date_last_changed_by_emp_no");
            entity.Property(e => e.PromiseDateLastChangedUtc)
                .HasColumnType("datetime")
                .HasColumnName("promise_date_last_changed_utc");
            entity.Property(e => e.PromiseMissReasonCode)
                .HasMaxLength(80)
                .IsUnicode(false)
                .HasColumnName("promise_miss_reason_code");
            entity.Property(e => e.PromiseRevisionCount).HasColumnName("promise_revision_count");
            entity.Property(e => e.PromisedDateUtc)
                .HasColumnType("datetime")
                .HasColumnName("promised_date_utc");
            entity.Property(e => e.ReadyToShipDate)
                .HasColumnType("datetime")
                .HasColumnName("ready_to_ship_date");
            entity.Property(e => e.ReceivedDate)
                .HasColumnType("datetime")
                .HasColumnName("received_date");
            entity.Property(e => e.RequestedDateUtc)
                .HasColumnType("datetime")
                .HasColumnName("requested_date_utc");
            entity.Property(e => e.ReworkBlockingInvoice).HasColumnName("rework_blocking_invoice");
            entity.Property(e => e.ReturnBrass).HasColumnName("return_brass");
            entity.Property(e => e.ReturnScrap).HasColumnName("return_scrap");
            entity.Property(e => e.SalesOrderNo)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("sales_order_no");
            entity.Property(e => e.SalesPersonEmpNo)
                .IsUnicode(false)
                .HasColumnName("sales_person_emp_no");
            entity.Property(e => e.SalesPersonId).HasColumnName("sales_person_id");
            entity.Property(e => e.ScheduledReceiptDate)
                .HasColumnType("datetime")
                .HasColumnName("scheduled_receipt_date");
            entity.Property(e => e.ShipToAddressId).HasColumnName("ship_to_address_id");
            entity.Property(e => e.ShipToViaId).HasColumnName("ship_to_via_id");
            entity.Property(e => e.SiteId).HasColumnName("site_id");
            entity.Property(e => e.StatusNote)
                .HasMaxLength(500)
                .IsUnicode(false)
                .HasColumnName("status_note");
            entity.Property(e => e.StatusOwnerRole)
                .HasMaxLength(40)
                .IsUnicode(false)
                .HasColumnName("status_owner_role");
            entity.Property(e => e.StatusReasonCode)
                .HasMaxLength(80)
                .IsUnicode(false)
                .HasColumnName("status_reason_code");
            entity.Property(e => e.StatusUpdatedUtc)
                .HasColumnType("datetime")
                .HasColumnName("status_updated_utc");
            entity.Property(e => e.TrailerNo)
                .IsUnicode(false)
                .HasColumnName("trailer_no");
            entity.Property(e => e.HoldOverlay)
                .HasMaxLength(60)
                .IsUnicode(false)
                .HasColumnName("hold_overlay");
            entity.Property(e => e.TransportationNotes)
                .HasMaxLength(2000)
                .IsUnicode(false)
                .HasColumnName("transportation_notes");
            entity.Property(e => e.TransportationStatus)
                .HasMaxLength(500)
                .IsUnicode(false)
                .HasColumnName("transportation_status");

            entity.HasOne(d => d.BillToAddress).WithMany(p => p.SalesOrderBillToAddresses)
                .HasForeignKey(d => d.BillToAddressId)
                .HasConstraintName("FK__sales_ord__bill___4EA8A765");

            entity.HasOne(d => d.Customer).WithMany(p => p.SalesOrders)
                .HasForeignKey(d => d.CustomerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__sales_ord__custo__4BCC3ABA");

            entity.HasOne(d => d.PaymentTerm).WithMany(p => p.SalesOrders)
                .HasForeignKey(d => d.PaymentTermId)
                .HasConstraintName("FK__sales_ord__payme__51851410");

            entity.HasOne(d => d.PickUpAddress).WithMany(p => p.SalesOrderPickUpAddresses)
                .HasForeignKey(d => d.PickUpAddressId)
                .HasConstraintName("FK__sales_ord__pick___4F9CCB9E");

            entity.HasOne(d => d.PickUpVia).WithMany(p => p.SalesOrderPickUpVia)
                .HasForeignKey(d => d.PickUpViaId)
                .HasConstraintName("FK__sales_ord__pick___4CC05EF3");

            entity.HasOne(d => d.SalesPerson).WithMany(p => p.SalesOrders)
                .HasForeignKey(d => d.SalesPersonId)
                .HasConstraintName("FK__sales_ord__sales__49E3F248");

            entity.HasOne(d => d.ShipToAddress).WithMany(p => p.SalesOrderShipToAddresses)
                .HasForeignKey(d => d.ShipToAddressId)
                .HasConstraintName("FK__sales_ord__ship___5090EFD7");

            entity.HasOne(d => d.ShipToVia).WithMany(p => p.SalesOrderShipToVia)
                .HasForeignKey(d => d.ShipToViaId)
                .HasConstraintName("FK__sales_ord__ship___4DB4832C");

            entity.HasOne(d => d.Site).WithMany(p => p.SalesOrders)
                .HasForeignKey(d => d.SiteId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__sales_ord__site___4AD81681");
        });

        modelBuilder.Entity<SalesOrderDetail>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__sales_or__3213E83F42B18D86");

            entity.ToTable("sales_order_details");

            entity.HasIndex(e => e.Id, "ix_sales_order_details_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ColorId).HasColumnName("color_id");
            entity.Property(e => e.Extension)
                .HasColumnType("numeric(18, 6)")
                .HasColumnName("extension");
            entity.Property(e => e.Gauges)
                .IsUnicode(false)
                .HasColumnName("gauges");
            entity.Property(e => e.ItemId).HasColumnName("item_id");
            entity.Property(e => e.ItemName)
                .IsUnicode(false)
                .HasColumnName("item_name");
            entity.Property(e => e.LidColorId).HasColumnName("lid_color_id");
            entity.Property(e => e.LineNo)
                .HasColumnType("numeric(18, 0)")
                .HasColumnName("line_no");
            entity.Property(e => e.NeedCollars).HasColumnName("need_collars");
            entity.Property(e => e.NeedDecals).HasColumnName("need_decals");
            entity.Property(e => e.NeedFillers).HasColumnName("need_fillers");
            entity.Property(e => e.NeedFootRings).HasColumnName("need_foot_rings");
            entity.Property(e => e.Notes)
                .IsUnicode(false)
                .HasColumnName("notes");
            entity.Property(e => e.QuantityAsOrdered)
                .HasColumnType("numeric(18, 6)")
                .HasColumnName("quantity_as_ordered");
            entity.Property(e => e.QuantityAsReceived)
                .HasColumnType("numeric(18, 6)")
                .HasColumnName("quantity_as_received");
            entity.Property(e => e.QuantityAsShipped)
                .HasColumnType("numeric(18, 6)")
                .HasColumnName("quantity_as_shipped");
            entity.Property(e => e.QuantityAsScrapped)
                .HasColumnType("numeric(18, 6)")
                .HasColumnName("quantity_as_scrapped");
            entity.Property(e => e.SalesOrderId).HasColumnName("sales_order_id");
            entity.Property(e => e.SiteId).HasColumnName("site_id");
            entity.Property(e => e.UnitPrice)
                .HasColumnType("numeric(18, 6)")
                .HasColumnName("unit_price");
            entity.Property(e => e.ValveType)
                .IsUnicode(false)
                .HasColumnName("valve_type");

            entity.HasOne(d => d.Color).WithMany(p => p.SalesOrderDetailColors)
                .HasForeignKey(d => d.ColorId)
                .HasConstraintName("FK__sales_ord__color__5649C92D");

            entity.HasOne(d => d.Item).WithMany(p => p.SalesOrderDetails)
                .HasForeignKey(d => d.ItemId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__sales_ord__item___5555A4F4");

            entity.HasOne(d => d.LidColor).WithMany(p => p.SalesOrderDetailLidColors)
                .HasForeignKey(d => d.LidColorId)
                .HasConstraintName("FK__sales_ord__lid_c__2A363CC5");

            entity.HasOne(d => d.SalesOrder).WithMany(p => p.SalesOrderDetails)
                .HasForeignKey(d => d.SalesOrderId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__sales_ord__sales__546180BB");

            entity.HasOne(d => d.Site).WithMany(p => p.SalesOrderDetails)
                .HasForeignKey(d => d.SiteId)
                .HasConstraintName("FK__sales_ord__site___573DED66");
        });

        modelBuilder.Entity<SalesOrderDetailCharge>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__sales_or__3213E83F17D665A4");

            entity.ToTable("sales_order_detail_charges");

            entity.HasIndex(e => e.Id, "ix_sales_order_detail_charges_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Extension)
                .HasColumnType("numeric(18, 0)")
                .HasColumnName("extension");
            entity.Property(e => e.ItemId).HasColumnName("item_id");
            entity.Property(e => e.Quantity)
                .HasColumnType("numeric(18, 0)")
                .HasColumnName("quantity");
            entity.Property(e => e.SalesOrderDetailId).HasColumnName("sales_order_detail_id");
            entity.Property(e => e.UnitPrice)
                .HasColumnType("numeric(18, 0)")
                .HasColumnName("unit_price");

            entity.HasOne(d => d.Item).WithMany(p => p.SalesOrderDetailCharges)
                .HasForeignKey(d => d.ItemId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__sales_ord__item___5FD33367");

            entity.HasOne(d => d.SalesOrderDetail).WithMany(p => p.SalesOrderDetailCharges)
                .HasForeignKey(d => d.SalesOrderDetailId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__sales_ord__sales__5EDF0F2E");
        });

        modelBuilder.Entity<SalesOrderDetailSn>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__sales_or__3213E83FE1328273");

            entity.ToTable("sales_order_detail_sns");

            entity.HasIndex(e => e.Id, "ix_sales_order_detail_sns_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.LidColor)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("lid_color");
            entity.Property(e => e.LidSize)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("lid_size");
            entity.Property(e => e.ManufacturerId).HasColumnName("manufacturer_id");
            entity.Property(e => e.Mfg)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("mfg");
            entity.Property(e => e.MfgDate)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("mfg_date");
            entity.Property(e => e.MfgTestDate)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("mfg_test_date");
            entity.Property(e => e.SalesOrderDetailId).HasColumnName("sales_order_detail_id");
            entity.Property(e => e.ScrapReasonId).HasColumnName("scrap_reason_id");
            entity.Property(e => e.Scrapped).HasColumnName("scrapped");
            entity.Property(e => e.SerialNumber)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("serial_number");
            entity.Property(e => e.Status)
                .IsUnicode(false)
                .HasColumnName("status");

            entity.HasOne(d => d.Manufacturer).WithMany(p => p.SalesOrderDetailSns)
                .HasForeignKey(d => d.ManufacturerId)
                .HasConstraintName("FK__sales_ord__manuf__5A1A5A11");

            entity.HasOne(d => d.SalesOrderDetail).WithMany(p => p.SalesOrderDetailSns)
                .HasForeignKey(d => d.SalesOrderDetailId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__sales_ord__sales__5B0E7E4A");

            entity.HasOne(d => d.ScrapReason).WithMany(p => p.SalesOrderDetailSns)
                .HasForeignKey(d => d.ScrapReasonId)
                .HasConstraintName("FK__sales_ord__scrap__5C02A283");
        });

        modelBuilder.Entity<SalesPeople>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__sales_pe__3213E83F59F312A4");

            entity.ToTable("sales_peoples");

            entity.HasIndex(e => e.Name, "UQ__sales_pe__72E12F1BB2FACA05").IsUnique();

            entity.HasIndex(e => e.EmployeeNumber, "UQ__sales_pe__8C453B0DBF55B5C4").IsUnique();

            entity.HasIndex(e => e.Id, "ix_sales_peoples_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.EmployeeNumber)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("employee_number");
            entity.Property(e => e.ErpNo)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("erp_no");
            entity.Property(e => e.Name)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("name");
        });

        modelBuilder.Entity<ScrapReason>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__scrap_re__3213E83F6E9926E7");

            entity.ToTable("scrap_reasons");

            entity.HasIndex(e => e.Name, "UQ__scrap_re__72E12F1B20A772D7").IsUnique();

            entity.HasIndex(e => e.Id, "ix_scrap_reasons_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("name");
        });

        modelBuilder.Entity<ShipVia>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ship_via__3213E83F5DD7083B");

            entity.ToTable("ship_vias");

            entity.HasIndex(e => e.Name, "UQ__ship_via__72E12F1B9F37D780").IsUnique();

            entity.HasIndex(e => e.Id, "ix_ship_vias_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ErpCode)
                .IsUnicode(false)
                .HasColumnName("erp_code");
            entity.Property(e => e.Name)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("name");
            entity.Property(e => e.SystemCode)
                .IsUnicode(false)
                .HasColumnName("system_code");
        });

        modelBuilder.Entity<Site>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__sites__3213E83FDCF6A861");

            entity.ToTable("sites");

            entity.HasIndex(e => e.SiteCode, "UQ__sites__FF464BAE58768D0C").IsUnique();

            entity.HasIndex(e => e.Id, "ix_sites_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("name");
            entity.Property(e => e.SiteCode)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("site_code");
        });

        modelBuilder.Entity<WorkCenter>(entity =>
        {
            entity.ToTable("work_centers");
            entity.HasIndex(e => e.WorkCenterCode).IsUnique();
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.WorkCenterCode).HasMaxLength(30).IsUnicode(false).HasColumnName("work_center_code");
            entity.Property(e => e.WorkCenterName).HasMaxLength(120).IsUnicode(false).HasColumnName("work_center_name");
            entity.Property(e => e.SiteId).HasColumnName("site_id");
            entity.Property(e => e.Description).HasMaxLength(500).IsUnicode(false).HasColumnName("description");
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.DefaultTimeCaptureMode).HasMaxLength(20).IsUnicode(false).HasColumnName("default_time_capture_mode");
            entity.Property(e => e.RequiresScanByDefault).HasColumnName("requires_scan_by_default");
            entity.Property(e => e.CreatedUtc).HasColumnType("datetime").HasColumnName("created_utc");
            entity.Property(e => e.UpdatedUtc).HasColumnType("datetime").HasColumnName("updated_utc");

            entity.HasOne(d => d.Site).WithMany().HasForeignKey(d => d.SiteId).OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<RouteTemplate>(entity =>
        {
            entity.ToTable("route_templates");
            entity.HasIndex(e => e.RouteTemplateCode).IsUnique();
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.RouteTemplateCode).HasMaxLength(40).IsUnicode(false).HasColumnName("route_template_code");
            entity.Property(e => e.RouteTemplateName).HasMaxLength(120).IsUnicode(false).HasColumnName("route_template_name");
            entity.Property(e => e.Description).HasMaxLength(500).IsUnicode(false).HasColumnName("description");
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.VersionNo).HasColumnName("version_no");
            entity.Property(e => e.CreatedUtc).HasColumnType("datetime").HasColumnName("created_utc");
            entity.Property(e => e.UpdatedUtc).HasColumnType("datetime").HasColumnName("updated_utc");
        });

        modelBuilder.Entity<RouteTemplateStep>(entity =>
        {
            entity.ToTable("route_template_steps");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.RouteTemplateId).HasColumnName("route_template_id");
            entity.Property(e => e.StepSequence).HasColumnName("step_sequence");
            entity.Property(e => e.StepCode).HasMaxLength(40).IsUnicode(false).HasColumnName("step_code");
            entity.Property(e => e.StepName).HasMaxLength(120).IsUnicode(false).HasColumnName("step_name");
            entity.Property(e => e.WorkCenterId).HasColumnName("work_center_id");
            entity.Property(e => e.IsRequired).HasColumnName("is_required");
            entity.Property(e => e.DataCaptureMode).HasMaxLength(30).IsUnicode(false).HasColumnName("data_capture_mode");
            entity.Property(e => e.TimeCaptureMode).HasMaxLength(20).IsUnicode(false).HasColumnName("time_capture_mode");
            entity.Property(e => e.RequiresScan).HasColumnName("requires_scan");
            entity.Property(e => e.RequiresUsageEntry).HasColumnName("requires_usage_entry");
            entity.Property(e => e.RequiresScrapEntry).HasColumnName("requires_scrap_entry");
            entity.Property(e => e.RequiresSerialCapture).HasColumnName("requires_serial_capture");
            entity.Property(e => e.RequiresChecklistCompletion).HasColumnName("requires_checklist_completion");
            entity.Property(e => e.ChecklistFailurePolicy).HasMaxLength(40).IsUnicode(false).HasColumnName("checklist_failure_policy");
            entity.Property(e => e.RequireScrapReasonWhenBad).HasColumnName("require_scrap_reason_when_bad");
            entity.Property(e => e.RequiresTrailerCapture).HasColumnName("requires_trailer_capture");
            entity.Property(e => e.RequiresSerialLoadVerification).HasColumnName("requires_serial_load_verification");
            entity.Property(e => e.GeneratePackingSlipOnComplete).HasColumnName("generate_packing_slip_on_complete");
            entity.Property(e => e.GenerateBolOnComplete).HasColumnName("generate_bol_on_complete");
            entity.Property(e => e.RequiresAttachment).HasColumnName("requires_attachment");
            entity.Property(e => e.RequiresSupervisorApproval).HasColumnName("requires_supervisor_approval");

            entity.HasOne(d => d.RouteTemplate).WithMany(p => p.Steps).HasForeignKey(d => d.RouteTemplateId).OnDelete(DeleteBehavior.ClientSetNull);
            entity.HasOne(d => d.WorkCenter).WithMany(p => p.RouteTemplateSteps).HasForeignKey(d => d.WorkCenterId).OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<RouteTemplateAssignment>(entity =>
        {
            entity.ToTable("route_template_assignments");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AssignmentName).HasMaxLength(120).IsUnicode(false).HasColumnName("assignment_name");
            entity.Property(e => e.Priority).HasColumnName("priority");
            entity.Property(e => e.RevisionNo).HasColumnName("revision_no");
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.CustomerId).HasColumnName("customer_id");
            entity.Property(e => e.SiteId).HasColumnName("site_id");
            entity.Property(e => e.ItemId).HasColumnName("item_id");
            entity.Property(e => e.ItemType).HasMaxLength(80).IsUnicode(false).HasColumnName("item_type");
            entity.Property(e => e.RouteTemplateId).HasColumnName("route_template_id");
            entity.Property(e => e.EffectiveFromUtc).HasColumnType("datetime").HasColumnName("effective_from_utc");
            entity.Property(e => e.EffectiveToUtc).HasColumnType("datetime").HasColumnName("effective_to_utc");
            entity.Property(e => e.CreatedUtc).HasColumnType("datetime").HasColumnName("created_utc");
            entity.Property(e => e.UpdatedUtc).HasColumnType("datetime").HasColumnName("updated_utc");

            entity.HasOne(d => d.Customer).WithMany().HasForeignKey(d => d.CustomerId);
            entity.HasOne(d => d.Site).WithMany().HasForeignKey(d => d.SiteId);
            entity.HasOne(d => d.Item).WithMany().HasForeignKey(d => d.ItemId);
            entity.HasOne(d => d.RouteTemplate).WithMany(p => p.Assignments).HasForeignKey(d => d.RouteTemplateId).OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<OrderLineRouteInstance>(entity =>
        {
            entity.ToTable("order_line_route_instances");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.SalesOrderId).HasColumnName("sales_order_id");
            entity.Property(e => e.SalesOrderDetailId).HasColumnName("sales_order_detail_id");
            entity.Property(e => e.RouteTemplateId).HasColumnName("route_template_id");
            entity.Property(e => e.RouteTemplateAssignmentId).HasColumnName("route_template_assignment_id");
            entity.Property(e => e.State).HasMaxLength(30).IsUnicode(false).HasColumnName("state");
            entity.Property(e => e.CurrentStepSequence).HasColumnName("current_step_sequence");
            entity.Property(e => e.StartedUtc).HasColumnType("datetime").HasColumnName("started_utc");
            entity.Property(e => e.CompletedUtc).HasColumnType("datetime").HasColumnName("completed_utc");
            entity.Property(e => e.RouteReviewState).HasMaxLength(30).IsUnicode(false).HasColumnName("route_review_state");
            entity.Property(e => e.RouteReviewedBy).HasMaxLength(30).IsUnicode(false).HasColumnName("route_reviewed_by");
            entity.Property(e => e.RouteReviewedUtc).HasColumnType("datetime").HasColumnName("route_reviewed_utc");
            entity.Property(e => e.RouteReviewNotes).HasMaxLength(500).IsUnicode(false).HasColumnName("route_review_notes");
            entity.Property(e => e.SupervisorApprovalRequired).HasColumnName("supervisor_approval_required");
            entity.Property(e => e.SupervisorApprovedBy).HasMaxLength(30).IsUnicode(false).HasColumnName("supervisor_approved_by");
            entity.Property(e => e.SupervisorApprovedUtc).HasColumnType("datetime").HasColumnName("supervisor_approved_utc");

            entity.HasOne(d => d.SalesOrder).WithMany().HasForeignKey(d => d.SalesOrderId).OnDelete(DeleteBehavior.ClientSetNull);
            entity.HasOne(d => d.SalesOrderDetail).WithMany().HasForeignKey(d => d.SalesOrderDetailId).OnDelete(DeleteBehavior.ClientSetNull);
            entity.HasOne(d => d.RouteTemplate).WithMany().HasForeignKey(d => d.RouteTemplateId).OnDelete(DeleteBehavior.ClientSetNull);
            entity.HasOne(d => d.RouteTemplateAssignment).WithMany().HasForeignKey(d => d.RouteTemplateAssignmentId);
        });

        modelBuilder.Entity<OrderLineRouteStepInstance>(entity =>
        {
            entity.ToTable("order_line_route_step_instances");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.OrderLineRouteInstanceId).HasColumnName("order_line_route_instance_id");
            entity.Property(e => e.SalesOrderDetailId).HasColumnName("sales_order_detail_id");
            entity.Property(e => e.StepSequence).HasColumnName("step_sequence");
            entity.Property(e => e.StepCode).HasMaxLength(40).IsUnicode(false).HasColumnName("step_code");
            entity.Property(e => e.StepName).HasMaxLength(120).IsUnicode(false).HasColumnName("step_name");
            entity.Property(e => e.WorkCenterId).HasColumnName("work_center_id");
            entity.Property(e => e.State).HasMaxLength(30).IsUnicode(false).HasColumnName("state");
            entity.Property(e => e.IsRequired).HasColumnName("is_required");
            entity.Property(e => e.DataCaptureMode).HasMaxLength(30).IsUnicode(false).HasColumnName("data_capture_mode");
            entity.Property(e => e.TimeCaptureMode).HasMaxLength(20).IsUnicode(false).HasColumnName("time_capture_mode");
            entity.Property(e => e.RequiresUsageEntry).HasColumnName("requires_usage_entry");
            entity.Property(e => e.RequiresScrapEntry).HasColumnName("requires_scrap_entry");
            entity.Property(e => e.RequiresSerialCapture).HasColumnName("requires_serial_capture");
            entity.Property(e => e.RequiresChecklistCompletion).HasColumnName("requires_checklist_completion");
            entity.Property(e => e.RequiresTrailerCapture).HasColumnName("requires_trailer_capture");
            entity.Property(e => e.ScanInUtc).HasColumnType("datetime").HasColumnName("scan_in_utc");
            entity.Property(e => e.ScanOutUtc).HasColumnType("datetime").HasColumnName("scan_out_utc");
            entity.Property(e => e.DurationMinutes).HasColumnType("decimal(10,2)").HasColumnName("duration_minutes");
            entity.Property(e => e.ManualDurationMinutes).HasColumnType("decimal(10,2)").HasColumnName("manual_duration_minutes");
            entity.Property(e => e.ManualDurationReason).HasMaxLength(300).IsUnicode(false).HasColumnName("manual_duration_reason");
            entity.Property(e => e.TimeCaptureSource).HasMaxLength(30).IsUnicode(false).HasColumnName("time_capture_source");
            entity.Property(e => e.StartedByEmpNo).HasMaxLength(30).IsUnicode(false).HasColumnName("started_by_emp_no");
            entity.Property(e => e.CompletedByEmpNo).HasMaxLength(30).IsUnicode(false).HasColumnName("completed_by_emp_no");
            entity.Property(e => e.CompletedUtc).HasColumnType("datetime").HasColumnName("completed_utc");
            entity.Property(e => e.BlockedReason).HasMaxLength(300).IsUnicode(false).HasColumnName("blocked_reason");

            entity.HasOne(d => d.OrderLineRouteInstance).WithMany(p => p.Steps).HasForeignKey(d => d.OrderLineRouteInstanceId).OnDelete(DeleteBehavior.ClientSetNull);
            entity.HasOne(d => d.SalesOrderDetail).WithMany().HasForeignKey(d => d.SalesOrderDetailId).OnDelete(DeleteBehavior.ClientSetNull);
            entity.HasOne(d => d.WorkCenter).WithMany(p => p.OrderLineRouteStepInstances).HasForeignKey(d => d.WorkCenterId).OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<OperatorActivityLog>(entity =>
        {
            entity.ToTable("operator_activity_logs");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.SalesOrderId).HasColumnName("sales_order_id");
            entity.Property(e => e.SalesOrderDetailId).HasColumnName("sales_order_detail_id");
            entity.Property(e => e.OrderLineRouteStepInstanceId).HasColumnName("order_line_route_step_instance_id");
            entity.Property(e => e.WorkCenterId).HasColumnName("work_center_id");
            entity.Property(e => e.OperatorEmpNo).HasMaxLength(30).IsUnicode(false).HasColumnName("operator_emp_no");
            entity.Property(e => e.ActionType).HasMaxLength(30).IsUnicode(false).HasColumnName("action_type");
            entity.Property(e => e.ActionUtc).HasColumnType("datetime").HasColumnName("action_utc");
            entity.Property(e => e.DeviceId).HasMaxLength(100).IsUnicode(false).HasColumnName("device_id");
            entity.Property(e => e.Notes).HasMaxLength(500).IsUnicode(false).HasColumnName("notes");

            entity.HasOne(d => d.SalesOrder).WithMany().HasForeignKey(d => d.SalesOrderId).OnDelete(DeleteBehavior.ClientSetNull);
            entity.HasOne(d => d.SalesOrderDetail).WithMany().HasForeignKey(d => d.SalesOrderDetailId).OnDelete(DeleteBehavior.ClientSetNull);
            entity.HasOne(d => d.OrderLineRouteStepInstance).WithMany(p => p.ActivityLogs).HasForeignKey(d => d.OrderLineRouteStepInstanceId).OnDelete(DeleteBehavior.ClientSetNull);
            entity.HasOne(d => d.WorkCenter).WithMany(p => p.OperatorActivityLogs).HasForeignKey(d => d.WorkCenterId).OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<StepMaterialUsage>(entity =>
        {
            entity.ToTable("step_material_usages");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.OrderLineRouteStepInstanceId).HasColumnName("order_line_route_step_instance_id");
            entity.Property(e => e.SalesOrderDetailId).HasColumnName("sales_order_detail_id");
            entity.Property(e => e.PartItemId).HasColumnName("part_item_id");
            entity.Property(e => e.QuantityUsed).HasColumnType("decimal(18,4)").HasColumnName("quantity_used");
            entity.Property(e => e.Uom).HasMaxLength(20).IsUnicode(false).HasColumnName("uom");
            entity.Property(e => e.RecordedByEmpNo).HasMaxLength(30).IsUnicode(false).HasColumnName("recorded_by_emp_no");
            entity.Property(e => e.RecordedUtc).HasColumnType("datetime").HasColumnName("recorded_utc");

            entity.HasOne(d => d.OrderLineRouteStepInstance).WithMany().HasForeignKey(d => d.OrderLineRouteStepInstanceId).OnDelete(DeleteBehavior.ClientSetNull);
            entity.HasOne(d => d.SalesOrderDetail).WithMany().HasForeignKey(d => d.SalesOrderDetailId).OnDelete(DeleteBehavior.ClientSetNull);
            entity.HasOne(d => d.PartItem).WithMany().HasForeignKey(d => d.PartItemId).OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<StepScrapEntry>(entity =>
        {
            entity.ToTable("step_scrap_entries");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.OrderLineRouteStepInstanceId).HasColumnName("order_line_route_step_instance_id");
            entity.Property(e => e.SalesOrderDetailId).HasColumnName("sales_order_detail_id");
            entity.Property(e => e.QuantityScrapped).HasColumnType("decimal(18,4)").HasColumnName("quantity_scrapped");
            entity.Property(e => e.ScrapReasonId).HasColumnName("scrap_reason_id");
            entity.Property(e => e.Notes).HasMaxLength(500).IsUnicode(false).HasColumnName("notes");
            entity.Property(e => e.RecordedByEmpNo).HasMaxLength(30).IsUnicode(false).HasColumnName("recorded_by_emp_no");
            entity.Property(e => e.RecordedUtc).HasColumnType("datetime").HasColumnName("recorded_utc");

            entity.HasOne(d => d.OrderLineRouteStepInstance).WithMany().HasForeignKey(d => d.OrderLineRouteStepInstanceId).OnDelete(DeleteBehavior.ClientSetNull);
            entity.HasOne(d => d.SalesOrderDetail).WithMany().HasForeignKey(d => d.SalesOrderDetailId).OnDelete(DeleteBehavior.ClientSetNull);
            entity.HasOne(d => d.ScrapReason).WithMany().HasForeignKey(d => d.ScrapReasonId).OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<StepSerialCapture>(entity =>
        {
            entity.ToTable("step_serial_captures");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.OrderLineRouteStepInstanceId).HasColumnName("order_line_route_step_instance_id");
            entity.Property(e => e.SalesOrderDetailId).HasColumnName("sales_order_detail_id");
            entity.Property(e => e.SerialNo).HasMaxLength(80).IsUnicode(false).HasColumnName("serial_no");
            entity.Property(e => e.Manufacturer).HasMaxLength(120).IsUnicode(false).HasColumnName("manufacturer");
            entity.Property(e => e.ManufactureDate).HasColumnName("manufacture_date");
            entity.Property(e => e.TestDate).HasColumnName("test_date");
            entity.Property(e => e.LidColorId).HasColumnName("lid_color_id");
            entity.Property(e => e.LidSizeId).HasColumnName("lid_size_id");
            entity.Property(e => e.ConditionStatus).HasMaxLength(20).IsUnicode(false).HasColumnName("condition_status");
            entity.Property(e => e.ScrapReasonId).HasColumnName("scrap_reason_id");
            entity.Property(e => e.RecordedByEmpNo).HasMaxLength(30).IsUnicode(false).HasColumnName("recorded_by_emp_no");
            entity.Property(e => e.RecordedUtc).HasColumnType("datetime").HasColumnName("recorded_utc");

            entity.HasOne(d => d.OrderLineRouteStepInstance).WithMany().HasForeignKey(d => d.OrderLineRouteStepInstanceId).OnDelete(DeleteBehavior.ClientSetNull);
            entity.HasOne(d => d.SalesOrderDetail).WithMany().HasForeignKey(d => d.SalesOrderDetailId).OnDelete(DeleteBehavior.ClientSetNull);
            entity.HasOne(d => d.LidColor).WithMany().HasForeignKey(d => d.LidColorId);
            entity.HasOne(d => d.LidSize).WithMany().HasForeignKey(d => d.LidSizeId);
            entity.HasOne(d => d.ScrapReason).WithMany().HasForeignKey(d => d.ScrapReasonId);
        });

        modelBuilder.Entity<StepChecklistResult>(entity =>
        {
            entity.ToTable("step_checklist_results");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.OrderLineRouteStepInstanceId).HasColumnName("order_line_route_step_instance_id");
            entity.Property(e => e.ChecklistTemplateItemId).HasColumnName("checklist_template_item_id");
            entity.Property(e => e.ItemLabel).HasMaxLength(200).IsUnicode(false).HasColumnName("item_label");
            entity.Property(e => e.IsRequiredItem).HasColumnName("is_required_item");
            entity.Property(e => e.ResultStatus).HasMaxLength(20).IsUnicode(false).HasColumnName("result_status");
            entity.Property(e => e.ResultNotes).HasMaxLength(500).IsUnicode(false).HasColumnName("result_notes");
            entity.Property(e => e.CompletedByEmpNo).HasMaxLength(30).IsUnicode(false).HasColumnName("completed_by_emp_no");
            entity.Property(e => e.CompletedUtc).HasColumnType("datetime").HasColumnName("completed_utc");

            entity.HasOne(d => d.OrderLineRouteStepInstance).WithMany().HasForeignKey(d => d.OrderLineRouteStepInstanceId).OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<BusinessDecisionPolicy>(entity =>
        {
            entity.ToTable("business_decision_policies");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.PolicyVersion).HasColumnName("policy_version");
            entity.Property(e => e.DecisionKey).HasMaxLength(120).IsUnicode(false).HasColumnName("decision_key");
            entity.Property(e => e.ScopeType).HasMaxLength(20).IsUnicode(false).HasColumnName("scope_type");
            entity.Property(e => e.SiteId).HasColumnName("site_id");
            entity.Property(e => e.CustomerId).HasColumnName("customer_id");
            entity.Property(e => e.PolicyValue).HasMaxLength(1000).IsUnicode(false).HasColumnName("policy_value");
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.UpdatedUtc).HasColumnType("datetime").HasColumnName("updated_utc");
            entity.Property(e => e.UpdatedByEmpNo).HasMaxLength(30).IsUnicode(false).HasColumnName("updated_by_emp_no");
            entity.Property(e => e.Notes).HasMaxLength(500).IsUnicode(false).HasColumnName("notes");
            entity.HasIndex(e => new { e.PolicyVersion, e.DecisionKey, e.ScopeType, e.SiteId, e.CustomerId }).IsUnique();
        });

        modelBuilder.Entity<BusinessDecisionSignoff>(entity =>
        {
            entity.ToTable("business_decision_signoffs");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.PolicyVersion).HasColumnName("policy_version");
            entity.Property(e => e.FunctionRole).HasMaxLength(40).IsUnicode(false).HasColumnName("function_role");
            entity.Property(e => e.IsApproved).HasColumnName("is_approved");
            entity.Property(e => e.ApprovedByEmpNo).HasMaxLength(30).IsUnicode(false).HasColumnName("approved_by_emp_no");
            entity.Property(e => e.ApprovedUtc).HasColumnType("datetime").HasColumnName("approved_utc");
            entity.Property(e => e.Notes).HasMaxLength(500).IsUnicode(false).HasColumnName("notes");
            entity.HasIndex(e => new { e.PolicyVersion, e.FunctionRole }).IsUnique();
        });

        modelBuilder.Entity<PromiseReasonPolicy>(entity =>
        {
            entity.ToTable("promise_reason_policies");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ReasonCode).HasMaxLength(80).IsUnicode(false).HasColumnName("reason_code");
            entity.Property(e => e.Description).HasMaxLength(240).IsUnicode(false).HasColumnName("description");
            entity.Property(e => e.OwnerRole).HasMaxLength(40).IsUnicode(false).HasColumnName("owner_role");
            entity.Property(e => e.AllowedNotificationPolicies).HasMaxLength(200).IsUnicode(false).HasColumnName("allowed_notification_policies");
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.UpdatedUtc).HasColumnType("datetime").HasColumnName("updated_utc");
            entity.Property(e => e.UpdatedByEmpNo).HasMaxLength(30).IsUnicode(false).HasColumnName("updated_by_emp_no");
            entity.HasIndex(e => e.ReasonCode).IsUnique();
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
