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

    public virtual DbSet<ShipVia> ShipVias { get; set; }

    public virtual DbSet<Site> Sites { get; set; }

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
            entity.Property(e => e.EmailSentDate)
                .HasColumnType("datetime")
                .HasColumnName("email_sent_date");
            entity.Property(e => e.EstDeliveryDate)
                .HasColumnType("datetime")
                .HasColumnName("est_delivery_date");
            entity.Property(e => e.FreightAmount)
                .HasColumnType("numeric(18, 6)")
                .HasColumnName("freight_amount");
            entity.Property(e => e.InvoiceDate)
                .HasColumnType("datetime")
                .HasColumnName("invoice_date");
            entity.Property(e => e.IpadOrderId).HasColumnName("ipad_order_id");
            entity.Property(e => e.OrderDate).HasColumnName("order_date");
            entity.Property(e => e.OrderStatus)
                .IsUnicode(false)
                .HasColumnName("order_status");
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
            entity.Property(e => e.ReadyToShipDate)
                .HasColumnType("datetime")
                .HasColumnName("ready_to_ship_date");
            entity.Property(e => e.ReceivedDate)
                .HasColumnType("datetime")
                .HasColumnName("received_date");
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
            entity.Property(e => e.TrailerNo)
                .IsUnicode(false)
                .HasColumnName("trailer_no");
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

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
