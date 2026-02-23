using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LPCylinderMES.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialBaseline : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "colors",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__colors__3213E83F6681F120", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "item_sizes",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "varchar(max)", unicode: false, nullable: false),
                    size = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__item_siz__3213E83F747BDD7A", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "manufacturers",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__manufact__3213E83FFEAA6498", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "part_cross_references",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    lpc_item_number = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: false),
                    erp_item_number = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__part_cro__3213E83FF0BAB81B", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "payment_terms",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: false),
                    no_of_days = table.Column<int>(type: "int", nullable: true),
                    terms_code = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__payment___3213E83F48AF8F4C", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "sales_peoples",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: false),
                    employee_number = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: false),
                    erp_no = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__sales_pe__3213E83F59F312A4", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "scrap_reasons",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__scrap_re__3213E83F6E9926E7", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "ship_vias",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: false),
                    system_code = table.Column<string>(type: "varchar(max)", unicode: false, nullable: true),
                    erp_code = table.Column<string>(type: "varchar(max)", unicode: false, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__ship_via__3213E83F5DD7083B", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "sites",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: false),
                    site_code = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__sites__3213E83FDCF6A861", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "items",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    item_no = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: false),
                    item_description = table.Column<string>(type: "varchar(max)", unicode: false, nullable: true),
                    item_type = table.Column<string>(type: "varchar(13)", unicode: false, maxLength: 13, nullable: false),
                    requires_serial_numbers = table.Column<int>(type: "int", nullable: false),
                    product_line = table.Column<string>(type: "varchar(max)", unicode: false, nullable: true),
                    requires_gauge_option = table.Column<bool>(type: "bit", nullable: true),
                    requires_filler_option = table.Column<bool>(type: "bit", nullable: true),
                    requires_collar_option = table.Column<bool>(type: "bit", nullable: true),
                    requires_foot_ring_option = table.Column<bool>(type: "bit", nullable: true),
                    requires_valve_type_option = table.Column<bool>(type: "bit", nullable: true),
                    system_code = table.Column<string>(type: "varchar(max)", unicode: false, nullable: true),
                    item_size = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__items__3213E83F05A16803", x => x.id);
                    table.ForeignKey(
                        name: "FK__items__item_size__34E8D562",
                        column: x => x.item_size,
                        principalTable: "item_sizes",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "customers",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "varchar(max)", unicode: false, nullable: false),
                    notes = table.Column<string>(type: "varchar(max)", unicode: false, nullable: true),
                    default_need_collars = table.Column<int>(type: "int", nullable: true),
                    default_need_fillers = table.Column<int>(type: "int", nullable: true),
                    default_need_foot_rings = table.Column<int>(type: "int", nullable: true),
                    default_return_scrap = table.Column<int>(type: "int", nullable: true),
                    default_return_brass = table.Column<int>(type: "int", nullable: true),
                    default_valve_type = table.Column<string>(type: "varchar(max)", unicode: false, nullable: true),
                    default_gauges = table.Column<string>(type: "varchar(max)", unicode: false, nullable: true),
                    customer_code = table.Column<string>(type: "varchar(max)", unicode: false, nullable: true),
                    status = table.Column<string>(type: "varchar(max)", unicode: false, nullable: true),
                    tank_color_id = table.Column<int>(type: "int", nullable: true),
                    lid_color_id = table.Column<int>(type: "int", nullable: true),
                    customer_parent_id = table.Column<int>(type: "int", nullable: true),
                    default_pick_up_id = table.Column<int>(type: "int", nullable: true),
                    default_bill_to_id = table.Column<int>(type: "int", nullable: true),
                    default_ship_to_id = table.Column<int>(type: "int", nullable: true),
                    default_sales_employee_id = table.Column<int>(type: "int", nullable: true),
                    default_payment_term_id = table.Column<int>(type: "int", nullable: true),
                    default_ship_via_id = table.Column<int>(type: "int", nullable: true),
                    email = table.Column<string>(type: "varchar(max)", unicode: false, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__customer__3213E83F98082B0B", x => x.id);
                    table.ForeignKey(
                        name: "FK__customers__custo__2F2FFC0C",
                        column: x => x.customer_parent_id,
                        principalTable: "customers",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK__customers__defau__30242045",
                        column: x => x.default_payment_term_id,
                        principalTable: "payment_terms",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK__customers__defau__3118447E",
                        column: x => x.default_ship_via_id,
                        principalTable: "ship_vias",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK__customers__lid_c__2E3BD7D3",
                        column: x => x.lid_color_id,
                        principalTable: "colors",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK__customers__tank___2D47B39A",
                        column: x => x.tank_color_id,
                        principalTable: "colors",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "contacts",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    first_name = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: false),
                    last_name = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: true),
                    notes = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: true),
                    email = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: true),
                    office_phone = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: true),
                    mobile_phone = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: true),
                    customer_id = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__contacts__3213E83F7213B03C", x => x.id);
                    table.ForeignKey(
                        name: "FK__contacts__custom__3E723F9C",
                        column: x => x.customer_id,
                        principalTable: "customers",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "customer_items",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    item_id = table.Column<int>(type: "int", nullable: false),
                    customer_id = table.Column<int>(type: "int", nullable: false),
                    tank_color_id = table.Column<int>(type: "int", nullable: true),
                    lid_color_id = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__customer__3213E83F12A48E3E", x => x.id);
                    table.ForeignKey(
                        name: "FK__customer___custo__38B96646",
                        column: x => x.customer_id,
                        principalTable: "customers",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK__customer___item___37C5420D",
                        column: x => x.item_id,
                        principalTable: "items",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK__customer___lid_c__3AA1AEB8",
                        column: x => x.lid_color_id,
                        principalTable: "colors",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK__customer___tank___39AD8A7F",
                        column: x => x.tank_color_id,
                        principalTable: "colors",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "pricings",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    effective_date = table.Column<DateOnly>(type: "date", nullable: false),
                    notes = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: true),
                    unit_price = table.Column<double>(type: "float", nullable: true),
                    customer_id = table.Column<int>(type: "int", nullable: true),
                    item_id = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__pricings__3213E83F892AAA3D", x => x.id);
                    table.ForeignKey(
                        name: "FK__pricings__custom__414EAC47",
                        column: x => x.customer_id,
                        principalTable: "customers",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK__pricings__item_i__4242D080",
                        column: x => x.item_id,
                        principalTable: "items",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "addresses",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    type = table.Column<string>(type: "varchar(7)", unicode: false, maxLength: 7, nullable: false),
                    address1 = table.Column<string>(type: "varchar(max)", unicode: false, nullable: false),
                    address2 = table.Column<string>(type: "varchar(max)", unicode: false, nullable: true),
                    city = table.Column<string>(type: "varchar(max)", unicode: false, nullable: true),
                    state = table.Column<string>(type: "varchar(max)", unicode: false, nullable: true),
                    postal_code = table.Column<string>(type: "varchar(max)", unicode: false, nullable: true),
                    country = table.Column<string>(type: "varchar(max)", unicode: false, nullable: true),
                    default_sales_employee_id = table.Column<int>(type: "int", nullable: true),
                    customer_id = table.Column<int>(type: "int", nullable: false),
                    contact_id = table.Column<int>(type: "int", nullable: true),
                    address_name = table.Column<string>(type: "varchar(500)", unicode: false, maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__addresse__3213E83F5AE845D5", x => x.id);
                    table.ForeignKey(
                        name: "FK__addresses__conta__46136164",
                        column: x => x.contact_id,
                        principalTable: "contacts",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK__addresses__custo__451F3D2B",
                        column: x => x.customer_id,
                        principalTable: "customers",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "sales_orders",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    sales_order_no = table.Column<string>(type: "varchar(100)", unicode: false, maxLength: 100, nullable: false),
                    customer_po_no = table.Column<string>(type: "varchar(max)", unicode: false, nullable: true),
                    order_date = table.Column<DateOnly>(type: "date", nullable: false),
                    order_status = table.Column<string>(type: "varchar(max)", unicode: false, nullable: false),
                    trailer_no = table.Column<string>(type: "varchar(max)", unicode: false, nullable: true),
                    comments = table.Column<string>(type: "varchar(2000)", unicode: false, maxLength: 2000, nullable: true),
                    commision = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    phone = table.Column<string>(type: "varchar(200)", unicode: false, maxLength: 200, nullable: true),
                    contact = table.Column<string>(type: "varchar(550)", unicode: false, maxLength: 550, nullable: true),
                    freight_amount = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    sales_person_emp_no = table.Column<string>(type: "varchar(max)", unicode: false, nullable: true),
                    received_date = table.Column<DateTime>(type: "datetime", nullable: true),
                    ready_to_ship_date = table.Column<DateTime>(type: "datetime", nullable: true),
                    return_scrap = table.Column<int>(type: "int", nullable: true),
                    return_brass = table.Column<int>(type: "int", nullable: true),
                    priority = table.Column<int>(type: "int", nullable: true),
                    ipad_order_id = table.Column<int>(type: "int", nullable: true),
                    pickup_scheduled_date = table.Column<DateTime>(type: "datetime", nullable: true),
                    scheduled_receipt_date = table.Column<DateTime>(type: "datetime", nullable: true),
                    invoice_date = table.Column<DateTime>(type: "datetime", nullable: true),
                    sales_person_id = table.Column<int>(type: "int", nullable: true),
                    site_id = table.Column<int>(type: "int", nullable: false),
                    customer_id = table.Column<int>(type: "int", nullable: false),
                    pick_up_via_id = table.Column<int>(type: "int", nullable: true),
                    ship_to_via_id = table.Column<int>(type: "int", nullable: true),
                    bill_to_address_id = table.Column<int>(type: "int", nullable: true),
                    pick_up_address_id = table.Column<int>(type: "int", nullable: true),
                    ship_to_address_id = table.Column<int>(type: "int", nullable: true),
                    payment_term_id = table.Column<int>(type: "int", nullable: true),
                    pickup_date = table.Column<DateTime>(type: "datetime", nullable: true),
                    transportation_status = table.Column<string>(type: "varchar(500)", unicode: false, maxLength: 500, nullable: true),
                    dispatch_date = table.Column<DateTime>(type: "datetime", nullable: true),
                    carrier = table.Column<string>(type: "varchar(500)", unicode: false, maxLength: 500, nullable: true),
                    transportation_notes = table.Column<string>(type: "varchar(2000)", unicode: false, maxLength: 2000, nullable: true),
                    email_sent_date = table.Column<DateTime>(type: "datetime", nullable: true),
                    closed_date = table.Column<DateTime>(type: "datetime", nullable: true),
                    est_delivery_date = table.Column<DateTime>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__sales_or__3213E83FC96DCE65", x => x.id);
                    table.ForeignKey(
                        name: "FK__sales_ord__bill___4EA8A765",
                        column: x => x.bill_to_address_id,
                        principalTable: "addresses",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK__sales_ord__custo__4BCC3ABA",
                        column: x => x.customer_id,
                        principalTable: "customers",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK__sales_ord__payme__51851410",
                        column: x => x.payment_term_id,
                        principalTable: "payment_terms",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK__sales_ord__pick___4CC05EF3",
                        column: x => x.pick_up_via_id,
                        principalTable: "ship_vias",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK__sales_ord__pick___4F9CCB9E",
                        column: x => x.pick_up_address_id,
                        principalTable: "addresses",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK__sales_ord__sales__49E3F248",
                        column: x => x.sales_person_id,
                        principalTable: "sales_peoples",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK__sales_ord__ship___4DB4832C",
                        column: x => x.ship_to_via_id,
                        principalTable: "ship_vias",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK__sales_ord__ship___5090EFD7",
                        column: x => x.ship_to_address_id,
                        principalTable: "addresses",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK__sales_ord__site___4AD81681",
                        column: x => x.site_id,
                        principalTable: "sites",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "sales_order_details",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    line_no = table.Column<decimal>(type: "numeric(18,0)", nullable: false),
                    notes = table.Column<string>(type: "varchar(max)", unicode: false, nullable: true),
                    quantity_as_ordered = table.Column<decimal>(type: "numeric(18,6)", nullable: false),
                    quantity_as_received = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    quantity_as_scrapped = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    unit_price = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    extension = table.Column<decimal>(type: "numeric(18,6)", nullable: true),
                    need_collars = table.Column<bool>(type: "bit", nullable: true),
                    need_fillers = table.Column<bool>(type: "bit", nullable: true),
                    need_foot_rings = table.Column<bool>(type: "bit", nullable: true),
                    need_decals = table.Column<bool>(type: "bit", nullable: true),
                    valve_type = table.Column<string>(type: "varchar(max)", unicode: false, nullable: true),
                    item_name = table.Column<string>(type: "varchar(max)", unicode: false, nullable: true),
                    gauges = table.Column<string>(type: "varchar(max)", unicode: false, nullable: true),
                    sales_order_id = table.Column<int>(type: "int", nullable: false),
                    item_id = table.Column<int>(type: "int", nullable: false),
                    color_id = table.Column<int>(type: "int", nullable: true),
                    site_id = table.Column<int>(type: "int", nullable: true),
                    lid_color_id = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__sales_or__3213E83F42B18D86", x => x.id);
                    table.ForeignKey(
                        name: "FK__sales_ord__color__5649C92D",
                        column: x => x.color_id,
                        principalTable: "colors",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK__sales_ord__item___5555A4F4",
                        column: x => x.item_id,
                        principalTable: "items",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK__sales_ord__lid_c__2A363CC5",
                        column: x => x.lid_color_id,
                        principalTable: "colors",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK__sales_ord__sales__546180BB",
                        column: x => x.sales_order_id,
                        principalTable: "sales_orders",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK__sales_ord__site___573DED66",
                        column: x => x.site_id,
                        principalTable: "sites",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "sales_order_detail_charges",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    quantity = table.Column<decimal>(type: "numeric(18,0)", nullable: false),
                    unit_price = table.Column<decimal>(type: "numeric(18,0)", nullable: false),
                    extension = table.Column<decimal>(type: "numeric(18,0)", nullable: false),
                    sales_order_detail_id = table.Column<int>(type: "int", nullable: false),
                    item_id = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__sales_or__3213E83F17D665A4", x => x.id);
                    table.ForeignKey(
                        name: "FK__sales_ord__item___5FD33367",
                        column: x => x.item_id,
                        principalTable: "items",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK__sales_ord__sales__5EDF0F2E",
                        column: x => x.sales_order_detail_id,
                        principalTable: "sales_order_details",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "sales_order_detail_sns",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    serial_number = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: false),
                    scrapped = table.Column<bool>(type: "bit", nullable: false),
                    status = table.Column<string>(type: "varchar(max)", unicode: false, nullable: true),
                    mfg = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: true),
                    mfg_date = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: true),
                    mfg_test_date = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: true),
                    manufacturer_id = table.Column<int>(type: "int", nullable: true),
                    sales_order_detail_id = table.Column<int>(type: "int", nullable: false),
                    scrap_reason_id = table.Column<int>(type: "int", nullable: true),
                    lid_color = table.Column<string>(type: "varchar(100)", unicode: false, maxLength: 100, nullable: true),
                    lid_size = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__sales_or__3213E83FE1328273", x => x.id);
                    table.ForeignKey(
                        name: "FK__sales_ord__manuf__5A1A5A11",
                        column: x => x.manufacturer_id,
                        principalTable: "manufacturers",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK__sales_ord__sales__5B0E7E4A",
                        column: x => x.sales_order_detail_id,
                        principalTable: "sales_order_details",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK__sales_ord__scrap__5C02A283",
                        column: x => x.scrap_reason_id,
                        principalTable: "scrap_reasons",
                        principalColumn: "id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_addresses_contact_id",
                table: "addresses",
                column: "contact_id");

            migrationBuilder.CreateIndex(
                name: "IX_addresses_customer_id",
                table: "addresses",
                column: "customer_id");

            migrationBuilder.CreateIndex(
                name: "ix_addresses_id",
                table: "addresses",
                column: "id");

            migrationBuilder.CreateIndex(
                name: "ix_colors_id",
                table: "colors",
                column: "id");

            migrationBuilder.CreateIndex(
                name: "UQ__colors__72E12F1BE3B3B84F",
                table: "colors",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_contacts_customer_id",
                table: "contacts",
                column: "customer_id");

            migrationBuilder.CreateIndex(
                name: "ix_contacts_id",
                table: "contacts",
                column: "id");

            migrationBuilder.CreateIndex(
                name: "UQ__contacts__AB6E616477A655DA",
                table: "contacts",
                column: "email",
                unique: true,
                filter: "[email] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_customer_items_customer_id",
                table: "customer_items",
                column: "customer_id");

            migrationBuilder.CreateIndex(
                name: "ix_customer_items_id",
                table: "customer_items",
                column: "id");

            migrationBuilder.CreateIndex(
                name: "IX_customer_items_item_id",
                table: "customer_items",
                column: "item_id");

            migrationBuilder.CreateIndex(
                name: "IX_customer_items_lid_color_id",
                table: "customer_items",
                column: "lid_color_id");

            migrationBuilder.CreateIndex(
                name: "IX_customer_items_tank_color_id",
                table: "customer_items",
                column: "tank_color_id");

            migrationBuilder.CreateIndex(
                name: "IX_customers_customer_parent_id",
                table: "customers",
                column: "customer_parent_id");

            migrationBuilder.CreateIndex(
                name: "IX_customers_default_payment_term_id",
                table: "customers",
                column: "default_payment_term_id");

            migrationBuilder.CreateIndex(
                name: "IX_customers_default_ship_via_id",
                table: "customers",
                column: "default_ship_via_id");

            migrationBuilder.CreateIndex(
                name: "ix_customers_id",
                table: "customers",
                column: "id");

            migrationBuilder.CreateIndex(
                name: "IX_customers_lid_color_id",
                table: "customers",
                column: "lid_color_id");

            migrationBuilder.CreateIndex(
                name: "IX_customers_tank_color_id",
                table: "customers",
                column: "tank_color_id");

            migrationBuilder.CreateIndex(
                name: "ix_item_sizes_id",
                table: "item_sizes",
                column: "id");

            migrationBuilder.CreateIndex(
                name: "ix_items_id",
                table: "items",
                column: "id");

            migrationBuilder.CreateIndex(
                name: "IX_items_item_size",
                table: "items",
                column: "item_size");

            migrationBuilder.CreateIndex(
                name: "UQ__items__5202274F1F373C3F",
                table: "items",
                column: "item_no",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_manufacturers_id",
                table: "manufacturers",
                column: "id");

            migrationBuilder.CreateIndex(
                name: "UQ__manufact__72E12F1B4F381873",
                table: "manufacturers",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_part_cross_references_id",
                table: "part_cross_references",
                column: "id");

            migrationBuilder.CreateIndex(
                name: "ix_payment_terms_id",
                table: "payment_terms",
                column: "id");

            migrationBuilder.CreateIndex(
                name: "UQ__payment___72E12F1BF114EE48",
                table: "payment_terms",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_pricings_customer_id",
                table: "pricings",
                column: "customer_id");

            migrationBuilder.CreateIndex(
                name: "ix_pricings_id",
                table: "pricings",
                column: "id");

            migrationBuilder.CreateIndex(
                name: "IX_pricings_item_id",
                table: "pricings",
                column: "item_id");

            migrationBuilder.CreateIndex(
                name: "ix_sales_order_detail_charges_id",
                table: "sales_order_detail_charges",
                column: "id");

            migrationBuilder.CreateIndex(
                name: "IX_sales_order_detail_charges_item_id",
                table: "sales_order_detail_charges",
                column: "item_id");

            migrationBuilder.CreateIndex(
                name: "IX_sales_order_detail_charges_sales_order_detail_id",
                table: "sales_order_detail_charges",
                column: "sales_order_detail_id");

            migrationBuilder.CreateIndex(
                name: "ix_sales_order_detail_sns_id",
                table: "sales_order_detail_sns",
                column: "id");

            migrationBuilder.CreateIndex(
                name: "IX_sales_order_detail_sns_manufacturer_id",
                table: "sales_order_detail_sns",
                column: "manufacturer_id");

            migrationBuilder.CreateIndex(
                name: "IX_sales_order_detail_sns_sales_order_detail_id",
                table: "sales_order_detail_sns",
                column: "sales_order_detail_id");

            migrationBuilder.CreateIndex(
                name: "IX_sales_order_detail_sns_scrap_reason_id",
                table: "sales_order_detail_sns",
                column: "scrap_reason_id");

            migrationBuilder.CreateIndex(
                name: "IX_sales_order_details_color_id",
                table: "sales_order_details",
                column: "color_id");

            migrationBuilder.CreateIndex(
                name: "ix_sales_order_details_id",
                table: "sales_order_details",
                column: "id");

            migrationBuilder.CreateIndex(
                name: "IX_sales_order_details_item_id",
                table: "sales_order_details",
                column: "item_id");

            migrationBuilder.CreateIndex(
                name: "IX_sales_order_details_lid_color_id",
                table: "sales_order_details",
                column: "lid_color_id");

            migrationBuilder.CreateIndex(
                name: "IX_sales_order_details_sales_order_id",
                table: "sales_order_details",
                column: "sales_order_id");

            migrationBuilder.CreateIndex(
                name: "IX_sales_order_details_site_id",
                table: "sales_order_details",
                column: "site_id");

            migrationBuilder.CreateIndex(
                name: "IX_sales_orders_bill_to_address_id",
                table: "sales_orders",
                column: "bill_to_address_id");

            migrationBuilder.CreateIndex(
                name: "IX_sales_orders_customer_id",
                table: "sales_orders",
                column: "customer_id");

            migrationBuilder.CreateIndex(
                name: "ix_sales_orders_id",
                table: "sales_orders",
                column: "id");

            migrationBuilder.CreateIndex(
                name: "IX_sales_orders_payment_term_id",
                table: "sales_orders",
                column: "payment_term_id");

            migrationBuilder.CreateIndex(
                name: "IX_sales_orders_pick_up_address_id",
                table: "sales_orders",
                column: "pick_up_address_id");

            migrationBuilder.CreateIndex(
                name: "IX_sales_orders_pick_up_via_id",
                table: "sales_orders",
                column: "pick_up_via_id");

            migrationBuilder.CreateIndex(
                name: "IX_sales_orders_sales_person_id",
                table: "sales_orders",
                column: "sales_person_id");

            migrationBuilder.CreateIndex(
                name: "IX_sales_orders_ship_to_address_id",
                table: "sales_orders",
                column: "ship_to_address_id");

            migrationBuilder.CreateIndex(
                name: "IX_sales_orders_ship_to_via_id",
                table: "sales_orders",
                column: "ship_to_via_id");

            migrationBuilder.CreateIndex(
                name: "IX_sales_orders_site_id",
                table: "sales_orders",
                column: "site_id");

            migrationBuilder.CreateIndex(
                name: "UQ__sales_or__ED5996F987318013",
                table: "sales_orders",
                column: "sales_order_no",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_sales_peoples_id",
                table: "sales_peoples",
                column: "id");

            migrationBuilder.CreateIndex(
                name: "UQ__sales_pe__72E12F1BB2FACA05",
                table: "sales_peoples",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ__sales_pe__8C453B0DBF55B5C4",
                table: "sales_peoples",
                column: "employee_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_scrap_reasons_id",
                table: "scrap_reasons",
                column: "id");

            migrationBuilder.CreateIndex(
                name: "UQ__scrap_re__72E12F1B20A772D7",
                table: "scrap_reasons",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_ship_vias_id",
                table: "ship_vias",
                column: "id");

            migrationBuilder.CreateIndex(
                name: "UQ__ship_via__72E12F1B9F37D780",
                table: "ship_vias",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_sites_id",
                table: "sites",
                column: "id");

            migrationBuilder.CreateIndex(
                name: "UQ__sites__FF464BAE58768D0C",
                table: "sites",
                column: "site_code",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "customer_items");

            migrationBuilder.DropTable(
                name: "part_cross_references");

            migrationBuilder.DropTable(
                name: "pricings");

            migrationBuilder.DropTable(
                name: "sales_order_detail_charges");

            migrationBuilder.DropTable(
                name: "sales_order_detail_sns");

            migrationBuilder.DropTable(
                name: "manufacturers");

            migrationBuilder.DropTable(
                name: "sales_order_details");

            migrationBuilder.DropTable(
                name: "scrap_reasons");

            migrationBuilder.DropTable(
                name: "items");

            migrationBuilder.DropTable(
                name: "sales_orders");

            migrationBuilder.DropTable(
                name: "item_sizes");

            migrationBuilder.DropTable(
                name: "addresses");

            migrationBuilder.DropTable(
                name: "sales_peoples");

            migrationBuilder.DropTable(
                name: "sites");

            migrationBuilder.DropTable(
                name: "contacts");

            migrationBuilder.DropTable(
                name: "customers");

            migrationBuilder.DropTable(
                name: "payment_terms");

            migrationBuilder.DropTable(
                name: "ship_vias");

            migrationBuilder.DropTable(
                name: "colors");
        }
    }
}
